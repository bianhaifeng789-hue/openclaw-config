#!/usr/bin/env node
/**
 * Skeleton Detector - 骨架文件检测器
 * 
 * 借鉴 Harness Engineering 的 SkeletonDetectionMiddleware
 * 检测workspace中的骨架文件/TODO标记
 * 提醒Agent填充TODO而非创建新文件
 * 
 * 来源: https://github.com/lazyFrogLOL/Harness_Engineering
 * 参考: middlewares.py SkeletonDetectionMiddleware
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.env.WORKSPACE || process.cwd();
const STATE_FILE = path.join(WORKSPACE, 'state', 'skeleton-detection.json');

/**
 * 骨架文件检测结果
 */
class SkeletonDetectionResult {
  constructor(file, markers) {
    this.file = file;
    this.markers = markers; // [{line, marker, content}]
    this.timestamp = Date.now();
  }
}

/**
 * Skeleton Detector
 */
class SkeletonDetector {
  constructor() {
    this.checked = false;
    this.skeletonFiles = [];
    this.stats = {
      totalScans: 0,
      skeletonsFound: 0,
      warningsSent: 0,
      lastScan: null
    };
    
    this.loadState();
  }

  /**
   * 加载状态文件
   */
  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        this.stats = state.stats || this.stats;
        this.skeletonFiles = state.skeletonFiles || [];
      }
    } catch (err) {
      // ignore
    }
  }

  /**
   * 保存状态文件
   */
  saveState() {
    try {
      const state = {
        stats: this.stats,
        skeletonFiles: this.skeletonFiles.slice(0, 100), // 只保留最近100个
        timestamp: Date.now()
      };
      
      const stateDir = path.dirname(STATE_FILE);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
      // ignore
    }
  }

  /**
   * 扫描workspace查找骨架标记
   */
  scanForSkeletons(workspaceDir = WORKSPACE) {
    const results = [];
    
    try {
      // 使用grep查找TODO等标记
      const grepPatterns = [
        'TODO',
        'NotImplementedError',
        'FIXME',
        'PLACEHOLDER',
        'FILL IN',
        'YOUR CODE HERE',
        'pass  # TODO',
        '# TODO:',
        '// TODO:'
      ];
      
      const pattern = grepPatterns.join('|');
      
      // 执行grep命令
      const cmd = `grep -rn '${pattern}' --include='*.js' --include='*.ts' --include='*.py' --include='*.c' --include='*.cpp' --include='*.h' --include='*.java' --include='*.go' --include='*.rs' . 2>/dev/null | head -50`;
      
      const output = execSync(cmd, {
        cwd: workspaceDir,
        encoding: 'utf8',
        timeout: 10000,
        maxBuffer: 100 * 1024
      }).trim();
      
      if (!output) {
        return results;
      }
      
      // 解析grep输出
      const lines = output.split('\n');
      const fileMap = new Map();
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // 格式: file:line:content
        const match = line.match(/^([^:]+):([^:]+):(.*)$/);
        if (!match) continue;
        
        const [, file, lineNum, content] = match;
        
        if (!fileMap.has(file)) {
          fileMap.set(file, []);
        }
        
        // 提取标记类型
        let markerType = 'UNKNOWN';
        for (const p of grepPatterns) {
          if (content.includes(p)) {
            markerType = p;
            break;
          }
        }
        
        fileMap.get(file).push({
          line: parseInt(lineNum),
          marker: markerType,
          content: content.trim().slice(0, 200)
        });
      }
      
      // 转换为结果对象
      for (const [file, markers] of fileMap.entries()) {
        results.push(new SkeletonDetectionResult(file, markers));
      }
      
    } catch (err) {
      // grep可能返回空（没有匹配），忽略错误
      if (err.status !== 1 && !err.message.includes('no matches found')) {
        console.error('Skeleton scan error:', err.message);
      }
    }
    
    return results;
  }

  /**
   * 检查骨架文件（iteration开始时调用）
   */
  check(workspaceDir = WORKSPACE) {
    if (this.checked) {
      return null;
    }
    
    this.checked = true;
    this.stats.totalScans++;
    this.stats.lastScan = Date.now();
    
    // 扫描骨架文件
    const skeletons = this.scanForSkeletons(workspaceDir);
    
    if (skeletons.length === 0) {
      this.saveState();
      return null;
    }
    
    // 记录发现的骨架文件
    this.skeletonFiles = skeletons;
    this.stats.skeletonsFound += skeletons.length;
    
    // 生成提醒消息
    const warning = this.generateWarning(skeletons);
    this.stats.warningsSent++;
    
    this.saveState();
    
    return {
      skeletons: skeletons,
      warning: warning,
      stats: this.stats
    };
  }

  /**
   * 生成骨架文件提醒
   */
  generateWarning(skeletons) {
    const fileCount = skeletons.length;
    const markerCount = skeletons.reduce((sum, s) => sum + s.markers.length, 0);
    
    const lines = [
      `⚠️ Skeleton Files Detected: ${fileCount} files with ${markerCount} TODO markers`,
      '',
      'CRITICAL: These files contain TODO/NotImplementedError markers.',
      'You MUST fill in these TODOs rather than creating separate implementations.',
      'Verifier tests will import from these original files.',
      '',
      'Skeleton files:',
    ];
    
    for (const skeleton of skeletons.slice(0, 10)) {
      const markers = skeleton.markers.slice(0, 3);
      lines.push(`  - ${skeleton.file} (${skeleton.markers.length} markers)`);
      for (const m of markers) {
        lines.push(`    Line ${m.line}: ${m.marker}`);
      }
    }
    
    if (skeletons.length > 10) {
      lines.push(`  ... and ${skeletons.length - 10} more files`);
    }
    
    lines.push('');
    lines.push('Action required:');
    lines.push('  1. Read each skeleton file to understand the expected structure');
    lines.push('  2. Fill in ALL TODO markers with actual implementation');
    lines.push('  3. Remove NotImplementedError/pass statements');
    lines.push('  4. Test that the implementation works');
    lines.push('');
    lines.push('Do NOT create new files instead of filling these TODOs.');
    
    return lines.join('\n');
  }

  /**
   * 重置检查状态（每个iteration开始时）
   */
  reset() {
    this.checked = false;
  }

  /**
   * 获取统计状态
   */
  getStatus() {
    return {
      checked: this.checked,
      skeletonsFound: this.skeletonFiles.length,
      stats: this.stats,
      recentSkeletons: this.skeletonFiles.slice(0, 10)
    };
  }
}

// CLI entry point
if (require.main === module) {
  const detector = new SkeletonDetector();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  if (command === 'check') {
    const result = detector.check();
    if (result) {
      console.log('⚠️ Skeleton files detected:');
      console.log(result.warning);
      console.log('\nStats:', JSON.stringify(result.stats, null, 2));
    } else {
      console.log('✅ No skeleton files detected');
      console.log('Stats:', JSON.stringify(detector.stats, null, 2));
    }
  } else if (command === 'status') {
    const status = detector.getStatus();
    console.log('Skeleton Detector Status:');
    console.log(JSON.stringify(status, null, 2));
  } else if (command === 'scan') {
    const workspaceDir = args[1] || WORKSPACE;
    const skeletons = detector.scanForSkeletons(workspaceDir);
    console.log('Skeleton files found:', skeletons.length);
    for (const s of skeletons) {
      console.log(`  ${s.file}: ${s.markers.length} markers`);
    }
  } else if (command === 'reset') {
    detector.reset();
    console.log('✅ Detector reset');
  } else {
    console.log('Usage: skeleton-detector.js [check|status|scan|reset]');
    console.log('  check   - Check for skeleton files (one-time per iteration)');
    console.log('  status  - Show detector status');
    console.log('  scan    - Scan workspace for skeletons');
    console.log('  reset   - Reset checked state');
  }
}

module.exports = { SkeletonDetector, SkeletonDetectionResult };