/**
 * Transcript 自动压缩器
 * 压缩过大的 transcript 文件
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const TRANSCRIPT_DIR = path.join(os.homedir(), '.openclaw', 'transcripts');
const SIZE_THRESHOLD_MB = 10;  // 超过 10MB 触发压缩
const KEEP_LAST_MESSAGES = 100;  // 保留最近 100 条消息

function getTranscriptFiles() {
  if (!fs.existsSync(TRANSCRIPT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(TRANSCRIPT_DIR)
    .filter(f => f.endsWith('.jsonl') && !f.includes('.archived'))
    .map(f => ({
      name: f,
      path: path.join(TRANSCRIPT_DIR, f),
      size: fs.statSync(path.join(TRANSCRIPT_DIR, f)).size
    }));

  return files;
}

function compressTranscript(filePath) {
  if (!fs.existsSync(filePath)) {
    return { success: false, error: 'File not found' };
  }

  try {
    // 读取所有行
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());

    if (lines.length <= KEEP_LAST_MESSAGES) {
      return { success: false, reason: 'Not enough messages to compress' };
    }

    // 保留最近的消息
    const recentLines = lines.slice(-KEEP_LAST_MESSAGES);

    // 压缩旧消息为摘要
    const oldMessages = lines.slice(0, -KEEP_LAST_MESSAGES);
    const summary = {
      type: 'compressed_summary',
      timestamp: Date.now(),
      originalMessageCount: oldMessages.length,
      compressedAt: new Date().toISOString()
    };

    // 写入压缩后的文件
    const compressedContent = JSON.stringify(summary) + '\n' + recentLines.join('\n');
    fs.writeFileSync(filePath, compressedContent);

    const newSize = fs.statSync(filePath).size;
    const originalSize = content.length;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    return {
      success: true,
      originalMessages: lines.length,
      keptMessages: recentLines.length,
      originalSize,
      newSize,
      savings: `${savings}%`
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function checkAndCompress() {
  const files = getTranscriptFiles();
  const results = [];

  for (const file of files) {
    const sizeMB = file.size / (1024 * 1024);

    if (sizeMB > SIZE_THRESHOLD_MB) {
      console.log(`[Transcript Compressor] ${file.name}: ${sizeMB.toFixed(1)}MB > threshold, compressing...`);
      const result = compressTranscript(file.path);
      results.push({ file: file.name, ...result });

      if (result.success) {
        console.log(`  ✓ Compressed: ${result.savings} saved`);
      } else {
        console.log(`  ✗ Failed: ${result.error || result.reason}`);
      }
    }
  }

  if (results.length === 0) {
    console.log('[Transcript Compressor] No files need compression');
  }

  return results;
}

function getStats() {
  const files = getTranscriptFiles();
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return {
    transcriptCount: files.length,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    thresholdMB: SIZE_THRESHOLD_MB,
    keepLastMessages: KEEP_LAST_MESSAGES
  };
}

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'check':
      checkAndCompress();
      break;
    case 'stats':
      console.log(getStats());
      break;
    default:
      console.log('Usage: node transcript-compressor.js [check|stats]');
  }
}

module.exports = { checkAndCompress, getStats, compressTranscript };
