/**
 * Session Store 分布式备份
 * 自动备份到远程存储（S3/云存储）
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const STORE_PATH = path.join(os.homedir(), '.openclaw', 'session-store.json');
const BACKUP_DIR = path.join(os.homedir(), '.openclaw', 'backups');

// 备份配置
const BACKUP_CONFIG = {
  local: {
    enabled: true,
    keepCount: 10  // 保留最近 10 个备份
  },
  s3: {
    enabled: false,
    bucket: process.env.S3_BACKUP_BUCKET || 'openclaw-backups',
    region: process.env.S3_BACKUP_REGION || 'us-east-1',
    prefix: 'session-store/'
  },
  r2: {
    enabled: false,
    accountId: process.env.R2_ACCOUNT_ID,
    bucket: process.env.R2_BUCKET,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
};

class DistributedBackup {
  constructor() {
    this.config = BACKUP_CONFIG;
  }

  // 本地备份
  async backupLocal() {
    if (!this.config.local.enabled) return { skipped: true };

    // 确保备份目录存在
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `session-store-${timestamp}.json`);

    // 复制文件
    fs.copyFileSync(STORE_PATH, backupPath);

    // 清理旧备份
    const cleaned = await this.cleanupOldBackups();

    return {
      path: backupPath,
      size: (fs.statSync(backupPath).size / 1024).toFixed(2) + 'KB',
      cleaned
    };
  }

  // 清理旧备份
  async cleanupOldBackups() {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('session-store-'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    const toDelete = files.slice(this.config.local.keepCount);
    let deleted = 0;

    for (const file of toDelete) {
      try {
        fs.unlinkSync(file.path);
        deleted++;
      } catch (e) {
        console.error('[Backup] Failed to delete old backup:', e.message);
      }
    }

    return { deleted, kept: files.length - deleted };
  }

  // S3 备份（使用 AWS CLI）
  async backupS3() {
    if (!this.config.s3.enabled) return { skipped: true };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const s3Key = `${this.config.s3.prefix}session-store-${timestamp}.json`;

    try {
      await execAsync(`aws s3 cp "${STORE_PATH}" "s3://${this.config.s3.bucket}/${s3Key}"`);
      return { success: true, key: s3Key };
    } catch (e) {
      console.error('[Backup] S3 backup failed:', e.message);
      return { success: false, error: e.message };
    }
  }

  // Cloudflare R2 备份
  async backupR2() {
    if (!this.config.r2.enabled) return { skipped: true };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const r2Key = `session-store-${timestamp}.json`;

    try {
      // 使用 rclone 或 aws cli 兼容 R2
      const endpoint = `https://${this.config.r2.accountId}.r2.cloudflarestorage.com`;
      await execAsync(
        `aws s3 cp "${STORE_PATH}" "s3://${this.config.r2.bucket}/${r2Key}" ` +
        `--endpoint-url="${endpoint}"`
      );
      return { success: true, key: r2Key };
    } catch (e) {
      console.error('[Backup] R2 backup failed:', e.message);
      return { success: false, error: e.message };
    }
  }

  // 执行所有启用的备份
  async backupAll() {
    const results = {
      timestamp: new Date().toISOString(),
      local: null,
      s3: null,
      r2: null
    };

    console.log('[Backup] Starting backup...');

    // 本地备份
    try {
      results.local = await this.backupLocal();
      console.log('[Backup] Local:', results.local.path || 'skipped');
    } catch (e) {
      results.local = { error: e.message };
      console.error('[Backup] Local failed:', e.message);
    }

    // S3 备份
    try {
      results.s3 = await this.backupS3();
      console.log('[Backup] S3:', results.s3.success ? 'success' : 'skipped/failed');
    } catch (e) {
      results.s3 = { error: e.message };
      console.error('[Backup] S3 failed:', e.message);
    }

    // R2 备份
    try {
      results.r2 = await this.backupR2();
      console.log('[Backup] R2:', results.r2.success ? 'success' : 'skipped/failed');
    } catch (e) {
      results.r2 = { error: e.message };
      console.error('[Backup] R2 failed:', e.message);
    }

    return results;
  }

  // 列出备份
  async listBackups() {
    const backups = [];

    // 本地备份
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('session-store-'))
        .map(f => ({
          type: 'local',
          name: f,
          path: path.join(BACKUP_DIR, f),
          size: (fs.statSync(path.join(BACKUP_DIR, f)).size / 1024).toFixed(2) + 'KB',
          date: fs.statSync(path.join(BACKUP_DIR, f)).mtime
        }));
      backups.push(...files);
    }

    return backups.sort((a, b) => b.date - a.date);
  }

  // 恢复备份
  async restoreBackup(backupPath) {
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: 'Backup not found' };
    }

    try {
      // 备份当前状态
      const currentBackup = path.join(BACKUP_DIR, `session-store-pre-restore-${Date.now()}.json`);
      if (fs.existsSync(STORE_PATH)) {
        fs.copyFileSync(STORE_PATH, currentBackup);
      }

      // 恢复
      fs.copyFileSync(backupPath, STORE_PATH);

      return {
        success: true,
        restoredFrom: backupPath,
        preRestoreBackup: currentBackup
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

// 全局实例
const distributedBackup = new DistributedBackup();

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    switch (command) {
      case 'backup':
        const results = await distributedBackup.backupAll();
        console.log('\nBackup results:', JSON.stringify(results, null, 2));
        break;

      case 'list':
        const backups = await distributedBackup.listBackups();
        console.log('Available backups:');
        backups.forEach(b => {
          console.log(`  [${b.type}] ${b.name} - ${b.size} - ${b.date.toISOString()}`);
        });
        break;

      case 'restore':
        const backupPath = process.argv[3];
        if (!backupPath) {
          console.log('Usage: node distributed-backup.js restore <backup-path>');
          return;
        }
        const restoreResult = await distributedBackup.restoreBackup(backupPath);
        console.log('Restore result:', restoreResult);
        break;

      case 'cleanup':
        const cleaned = await distributedBackup.cleanupOldBackups();
        console.log('Cleaned:', cleaned);
        break;

      default:
        console.log('Usage: node distributed-backup.js [backup|list|restore|cleanup]');
    }
  })();
}

module.exports = { DistributedBackup, distributedBackup };
