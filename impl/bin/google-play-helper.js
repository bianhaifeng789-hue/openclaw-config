#!/usr/bin/env node
/**
 * Google Play Helper - Google Play Store 发布助手
 * 
 * 支持功能：
 *   - APP 信息检查
 *   - 版本更新检查清单
 *   - 发布状态查询
 *   - 审核时间预估
 *   - AAB/APK 文件检查
 * 
 * Usage:
 *   node google-play-helper.js check-app --package "com.game.my"
 *   node google-play-helper.js update-checklist --version "2.0.0"
 *   node google-play-helper.js status --package "com.game.my" --status pending
 *   node google-play-helper.js review-time --type game
 *   node google-play-helper.js file-check --path app.aab --size 50MB
 */

const fs = require('fs');
const path = require('path');

// 审核时间配置
const REVIEW_TIMES = {
  game: { min: 1, max: 3, avg: 2 },
  app: { min: 1, max: 7, avg: 3 },
  update: { min: 1, max: 3, avg: 2 },
  new: { min: 3, max: 7, avg: 5 }
};

// 发布要求配置
const RELEASE_REQUIREMENTS = [
  { item: 'AAB 文件', required: true, note: '推荐格式，支持动态分发' },
  { item: 'APK 文件', required: false, note: '可选，用于兼容性' },
  { item: 'APP 图标', required: true, note: '512x512 PNG' },
  { item: '截图', required: true, note: '至少 2 张，最多 8 张' },
  { item: 'APP 描述', required: true, note: '最多 4000 字符' },
  { item: '版本号', required: true, note: '格式: major.minor.patch' },
  { item: '隐私政策', required: true, note: 'URL 链接' },
  { item: '内容分级', required: true, note: 'IARC 问卷' },
  { item: '目标受众', required: true, note: '年龄范围' }
];

/**
 * 检查 APP 信息
 */
function checkAppInfo(packageName) {
  const info = {
    packageName,
    formatValid: validatePackageName(packageName),
    recommendations: [
      '检查包名是否与已发布版本一致',
      '确认签名证书已备份',
      '验证版本号递增'
    ],
    warnings: []
  };
  
  if (!info.formatValid) {
    info.warnings.push('⚠️ 包名格式不符合规范（应为 com.company.app）');
  }
  
  const guide = `## APP 信息检查

**包名：** ${packageName}

**格式验证：** ${info.formatValid ? '✅ 正确' : '❌ 错误'}

**检查项：**
- ${info.recommendations.join('\n- ')}

${info.warnings.length > 0 ? `\n**警告：**\n- ${info.warnings.join('\n- ')}` : ''}

---

**下一步：**
1. 确认包名无误
2. 准备发布文件
3. 检查版本号
`;

  return {
    info,
    guide,
    packageName,
    valid: info.formatValid
  };
}

/**
 * 生成版本更新检查清单
 */
function generateUpdateChecklist(version) {
  const checklistItems = [
    { item: '版本号递增', required: true, checked: false },
    { item: '版本名更新', required: true, checked: false },
    { item: '更新日志编写', required: true, checked: false },
    { item: 'AAB/APK 文件准备', required: true, checked: false },
    { item: '签名验证', required: true, checked: false },
    { item: '功能测试', required: true, checked: false },
    { item: '兼容性测试', required: false, checked: false },
    { item: '截图更新（如有新功能）', required: false, checked: false },
    { item: '隐私政策更新（如有）', required: false, checked: false },
    { item: '内容分级更新（如有）', required: false, checked: false }
  ];
  
  const guide = `## 版本更新检查清单

**目标版本：** ${version}

### 必需项
${checklistItems.filter(i => i.required).map(i => 
  `- [ ] ${i.item}`
).join('\n')}

### 可选项
${checklistItems.filter(i => !i.required).map(i => 
  `- [ ] ${i.item}`
).join('\n')}

---

**版本号规则：**
- Major: 大版本更新（API 变化）
- Minor: 功能更新（新功能）
- Patch: Bug 修复（小更新）

**示例：**
- 1.0.0 → 1.0.1（Bug 修复）
- 1.0.1 → 1.1.0（新功能）
- 1.1.0 → 2.0.0（大版本）
`;

  return {
    version,
    checklistItems,
    guide,
    requiredCount: checklistItems.filter(i => i.required).length,
    optionalCount: checklistItems.filter(i => !i.required).length
  };
}

/**
 * 检查发布状态
 */
function checkReleaseStatus(packageName, status) {
  const statusMap = {
    pending: { emoji: '⏳', message: '审核中', action: '等待审核完成' },
    in_review: { emoji: '🔍', message: '正在审核', action: '审核员正在检查' },
    approved: { emoji: '✅', message: '已通过', action: '准备发布' },
    rejected: { emoji: '❌', message: '被拒绝', action: '查看拒绝原因并修正' },
    published: { emoji: '🎉', message: '已发布', action: '监控下载和评分' },
    draft: { emoji: '📝', message: '草稿', action: '完成信息填写' }
  };
  
  const statusInfo = statusMap[status] || { emoji: '❓', message: '未知', action: '检查状态' };
  
  const nextSteps = [];
  
  switch (status) {
    case 'pending':
    case 'in_review':
      nextSteps.push('准备营销素材');
      nextSteps.push('配置广告投放');
      nextSteps.push('准备发布公告');
      break;
      
    case 'approved':
      nextSteps.push('确认发布时间');
      nextSteps.push('提交发布');
      nextSteps.push('通知团队');
      break;
      
    case 'rejected':
      nextSteps.push('查看拒绝邮件');
      nextSteps.push('分析拒绝原因');
      nextSteps.push('修正问题并重新提交');
      break;
      
    case 'published':
      nextSteps.push('监控下载量');
      nextSteps.push('关注用户评分');
      nextSteps.push('收集用户反馈');
      break;
      
    case 'draft':
      nextSteps.push('完成所有必需信息');
      nextSteps.push('上传 AAB/APK');
      nextSteps.push('提交审核');
      break;
  }
  
  const guide = `## 发布状态检查

**包名：** ${packageName}

**当前状态：** ${statusInfo.emoji} ${statusInfo.message}

**建议操作：** ${statusInfo.action}

**下一步：**
${nextSteps.map(s => `- ${s}`).join('\n')}

---

**状态流转：**
草稿 → 审核中 → 审核通过 → 已发布
      ↓
    被拒绝 → 修正 → 重新审核
`;

  return {
    packageName,
    status,
    statusInfo,
    nextSteps,
    guide
  };
}

/**
 * 预估审核时间
 */
function estimateReviewTime(type, complexity = 'normal') {
  const baseTime = REVIEW_TIMES[type] || REVIEW_TIMES.app;
  
  let estimatedDays;
  switch (complexity) {
    case 'simple':
      estimatedDays = baseTime.min;
      break;
    case 'complex':
      estimatedDays = baseTime.max;
      break;
    default:
      estimatedDays = baseTime.avg;
  }
  
  const guide = `## 审核时间预估

**APP 类型：** ${type}

**复杂度：** ${complexity}

**预估时间：** ${estimatedDays} 天

**范围：** ${baseTime.min} - ${baseTime.max} 天

---

**影响因素：**
- APP 类型（游戏 vs 应用）
- 内容复杂度
- 是否包含敏感内容
- 审核队列长度
- 节假日（可能延长）

**建议：**
- 避开节假日前提交
- 提前准备完整信息
- 确保隐私政策合规
`;

  return {
    type,
    complexity,
    estimatedDays,
    minDays: baseTime.min,
    maxDays: baseTime.max,
    avgDays: baseTime.avg,
    guide
  };
}

/**
 * 检查 AAB/APK 文件
 */
function checkReleaseFile(filePath, size, type = 'aab') {
  const maxSize = type === 'aab' ? 150 : 100; // MB
  
  const checks = [];
  
  // 文件类型检查
  checks.push({
    item: '文件类型',
    expected: type.toUpperCase(),
    status: filePath.endsWith(type) ? '✅' : '❌'
  });
  
  // 文件大小检查
  const sizeMB = parseFloat(size.replace('MB', ''));
  checks.push({
    item: '文件大小',
    expected: `< ${maxSize}MB`,
    actual: `${sizeMB}MB`,
    status: sizeMB <= maxSize ? '✅' : '❌ 超大'
  });
  
  // 推荐检查
  checks.push({
    item: '签名验证',
    expected: '使用相同证书',
    status: '⚠️ 需手动检查'
  });
  
  checks.push({
    item: '版本号',
    expected: '递增',
    status: '⚠️ 需手动检查'
  });
  
  const guide = `## 发布文件检查

**文件路径：** ${filePath}

**文件类型：** ${type.toUpperCase()}

**文件大小：** ${size}

### 检查项
${checks.map(c => 
  `- ${c.item}: ${c.status}${c.actual ? ` (${c.actual})` : ''}`
).join('\n')}

---

**文件要求：**
- AAB: 推荐，最大 150MB
- APK: 可选，最大 100MB
- 签名: 使用同一证书
- 版本: 必须递增

**上传步骤：**
1. 选择文件
2. 验证签名
3. 确认版本
4. 提交审核
`;

  return {
    filePath,
    size,
    type,
    checks,
    guide,
    warnings: checks.filter(c => c.status.includes('❌') || c.status.includes('⚠️')).length
  };
}

/**
 * 验证包名格式
 */
function validatePackageName(packageName) {
  // 格式: com.company.app
  const regex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+[a-z0-9_]+$/;
  return regex.test(packageName);
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(JSON.stringify({
      error: '请指定命令',
      usage: 'check-app | update-checklist | status | review-time | file-check',
      examples: [
        'node google-play-helper.js check-app --package "com.game.my"',
        'node google-play-helper.js update-checklist --version "2.0.0"'
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'check-app':
        const package1 = args.find(a => a.startsWith('--package='))?.split('=')[1] || '';
        result = checkAppInfo(package1);
        break;
        
      case 'update-checklist':
        const version = args.find(a => a.startsWith('--version='))?.split('=')[1] || '1.0.0';
        result = generateUpdateChecklist(version);
        break;
        
      case 'status':
        const package2 = args.find(a => a.startsWith('--package='))?.split('=')[1] || '';
        const status = args.find(a => a.startsWith('--status='))?.split('=')[1] || 'draft';
        result = checkReleaseStatus(package2, status);
        break;
        
      case 'review-time':
        const type = args.find(a => a.startsWith('--type='))?.split('=')[1] || 'app';
        const complexity = args.find(a => a.startsWith('--complexity='))?.split('=')[1] || 'normal';
        result = estimateReviewTime(type, complexity);
        break;
        
      case 'file-check':
        const filePath = args.find(a => a.startsWith('--path='))?.split('=')[1] || '';
        const fileSize = args.find(a => a.startsWith('--size='))?.split('=')[1] || '50MB';
        const fileType = args.find(a => a.startsWith('--type='))?.split('=')[1] || 'aab';
        result = checkReleaseFile(filePath, fileSize, fileType);
        break;
        
      default:
        result = { error: `未知命令: ${command}` };
    }
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (e) {
    console.log(JSON.stringify({ error: e.message }));
  }
}

// 导出供其他模块使用
module.exports = {
  checkAppInfo,
  generateUpdateChecklist,
  checkReleaseStatus,
  estimateReviewTime,
  checkReleaseFile,
  validatePackageName
};

if (require.main === module) {
  main();
}