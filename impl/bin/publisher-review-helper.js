#!/usr/bin/env node
/**
 * Publisher Review Helper - Publisher 审核助手
 * 
 * 支持功能：
 *   - 审核状态查询
 *   - 审核清单生成
 *   - 审核时间预估
 *   - 拒绝原因分析
 *   - 重新提交建议
 * 
 * Usage:
 *   node publisher-review-helper.js check-status --publisher admob --status pending
 *   node publisher-review-helper.js checklist --publisher meta
 *   node publisher-review-helper.js estimate --publisher unity --type new
 *   node publisher-review-helper.js reject-analysis --reason "low quality"
 *   node publisher-review-helper.js resubmit --publisher admob --issues "content"
 */

const fs = require('fs');
const path = require('path');

// Publisher 配置
const PUBLISHER_CONFIGS = {
  admob: {
    name: 'Google AdMob',
    reviewTime: { new: '1-3天', update: '1-2天' },
    commonRejections: [
      'APP质量不达标',
      '内容违规',
      '无流量',
      '隐私政策不完整'
    ]
  },
  meta: {
    name: 'Meta Audience Network',
    reviewTime: { new: '3-7天', update: '1-3天' },
    commonRejections: [
      '流量不足（需5000+ DAU）',
      '内容不符合政策',
      'APP质量差',
      '缺少必要信息'
    ]
  },
  applovin: {
    name: 'AppLovin',
    reviewTime: { new: '即时', update: '即时' },
    commonRejections: [
      '非游戏类APP（优先游戏）',
      '流量不足'
    ]
  },
  unity: {
    name: 'Unity Ads',
    reviewTime: { new: '即时', update: '即时' },
    commonRejections: [
      '非游戏类APP',
      'SDK集成问题'
    ]
  },
  ironsource: {
    name: 'ironSource',
    reviewTime: { new: '1-2天', update: '1天' },
    commonRejections: [
      '游戏优先',
      'SDK集成错误',
      '流量不足'
    ]
  },
  chartboost: {
    name: 'Chartboost',
    reviewTime: { new: '即时', update: '即时' },
    commonRejections: [
      '非游戏',
      'SDK版本过旧'
    ]
  }
};

// 审核状态定义
const REVIEW_STATUS_MAP = {
  pending: { emoji: '⏳', message: '审核中', priority: 'medium' },
  in_review: { emoji: '🔍', message: '正在审核', priority: 'high' },
  approved: { emoji: '✅', message: '已通过', priority: 'low' },
  rejected: { emoji: '❌', message: '被拒绝', priority: 'critical' },
  suspended: { emoji: '⚠️', message: '暂停', priority: 'critical' },
  active: { emoji: '🎉', message: '正常运行', priority: 'low' }
};

/**
 * 检查审核状态
 */
function checkReviewStatus(publisher, status) {
  const config = PUBLISHER_CONFIGS[publisher];
  if (!config) return { error: `未知的 Publisher: ${publisher}` };
  
  const statusInfo = REVIEW_STATUS_MAP[status] || { emoji: '❓', message: '未知', priority: 'unknown' };
  
  const nextSteps = generateNextSteps(status);
  
  const guide = `## ${config.name} 审核状态

**当前状态：** ${statusInfo.emoji} ${statusInfo.message}

**优先级：** ${statusInfo.priority}

**审核时间：** ${config.reviewTime.new}

---

**下一步操作：**

${nextSteps.map(s => `- ${s}`).join('\n')}

---

**常见拒绝原因：**
${config.commonRejections.map(r => `- ${r}`).join('\n')}
`;

  return {
    publisher,
    name: config.name,
    status,
    statusInfo,
    nextSteps,
    guide,
    reviewTime: config.reviewTime
  };
}

/**
 * 生成审核清单
 */
function generateReviewChecklist(publisher) {
  const config = PUBLISHER_CONFIGS[publisher];
  if (!config) return { error: `未知的 Publisher: ${publisher}` };
  
  const checklist = [
    { category: '基本信息', items: [
      { item: '公司/开发者信息', required: true },
      { item: '联系方式', required: true },
      { item: '网站链接', required: false }
    ]},
    { category: 'APP信息', items: [
      { item: 'APP名称', required: true },
      { item: 'Bundle ID', required: true },
      { item: 'Store链接', required: true },
      { item: 'APP截图', required: true },
      { item: 'APP描述', required: true }
    ]},
    { category: '合规信息', items: [
      { item: '隐私政策', required: true },
      { item: '内容分级', required: true },
      { item: '目标受众', required: true },
      { item: '税务信息', required: true }
    ]},
    { category: 'SDK集成', items: [
      { item: 'SDK版本', required: true },
      { item: '广告单元配置', required: true },
      { item: '测试广告验证', required: true }
    ]}
  ];
  
  const guide = `## ${config.name} 审核清单

${checklist.map(cat =>
  `### ${cat.category}
${cat.items.map(i =>
  `- [ ] ${i.item}${i.required ? ' ✅ 必需' : ' ⚪ 可选'}`
).join('\n')}`
).join('\n\n')}

---

**审核时间：** ${config.reviewTime.new}

**注意事项：**
- 确保所有必需项填写完整
- 隐私政策必须可访问
- APP截图需真实反映功能
`;

  return {
    publisher,
    name: config.name,
    checklist,
    guide,
    totalItems: checklist.reduce((sum, cat) => sum + cat.items.length, 0),
    requiredItems: checklist.reduce((sum, cat) => sum + cat.items.filter(i => i.required).length, 0)
  };
}

/**
 * 预估审核时间
 */
function estimateReviewDuration(publisher, type) {
  const config = PUBLISHER_CONFIGS[publisher];
  if (!config) return { error: `未知的 Publisher: ${publisher}` };
  
  const reviewTime = config.reviewTime[type] || config.reviewTime.new;
  
  const factors = [
    '节假日可能延长审核',
    '完整信息可加快审核',
    '敏感内容需额外审查',
    '高峰期排队较长'
  ];
  
  const guide = `## ${config.name} 审核时间预估

**审核类型：** ${type}

**预估时间：** ${reviewTime}

---

**影响因素：**
${factors.map(f => `- ${f}`).join('\n')}

**建议：**
- 避开节假日前提交
- 准备完整信息
- 提前测试 SDK
`;

  return {
    publisher,
    name: config.name,
    type,
    reviewTime,
    factors,
    guide
  };
}

/**
 * 分析拒绝原因
 */
function analyzeRejection(reason) {
  const reasonMap = {
    'low quality': {
      category: 'APP质量',
      description: 'APP质量不达标',
      solutions: [
        '优化APP性能',
        '修复UI/UX问题',
        '提升用户体验',
        '增加测试覆盖率'
      ]
    },
    'content violation': {
      category: '内容违规',
      description: '内容不符合政策',
      solutions: [
        '审查APP内容',
        '删除违规元素',
        '更新隐私政策',
        '重新提交审核'
      ]
    },
    'no traffic': {
      category: '流量不足',
      description: '缺乏足够流量',
      solutions: [
        '提升APP推广',
        '增加用户留存',
        '等待流量增长',
        '考虑其他平台'
      ]
    },
    'privacy incomplete': {
      category: '隐私政策',
      description: '隐私政策不完整',
      solutions: [
        '补充隐私政策内容',
        '明确数据收集说明',
        '添加用户权利说明',
        '确保链接可访问'
      ]
    },
    'sdk issue': {
      category: 'SDK集成',
      description: 'SDK集成问题',
      solutions: [
        '检查SDK版本',
        '验证广告单元配置',
        '测试广告加载',
        '查看错误日志'
      ]
    }
  };
  
  const analysis = reasonMap[reason] || {
    category: '其他',
    description: reason,
    solutions: ['查看平台详细说明', '联系平台支持']
  };
  
  const guide = `## 拒绝原因分析

**原因类型：** ${analysis.category}

**具体描述：** ${analysis.description}

---

**解决方案：**

${analysis.solutions.map(s => `- ${s}`).join('\n')}

---

**建议步骤：**
1. 理解拒绝原因
2. 修正相关问题
3. 测试修正效果
4. 重新提交审核
`;

  return {
    reason,
    analysis,
    guide,
    category: analysis.category,
    solutions: analysis.solutions
  };
}

/**
 * 重新提交建议
 */
function generateResubmitRecommendations(publisher, issues) {
  const config = PUBLISHER_CONFIGS[publisher];
  if (!config) return { error: `未知的 Publisher: ${publisher}` };
  
  const recommendations = [];
  
  // 根据问题类型生成建议
  const issueArray = issues.split(',');
  
  for (const issue of issueArray) {
    switch (issue.trim()) {
      case 'content':
        recommendations.push({
          issue: '内容问题',
          steps: [
            '审查APP内容合规性',
            '删除违规元素',
            '更新隐私政策',
            '重新测试'
          ]
        });
        break;
        
      case 'quality':
        recommendations.push({
          issue: '质量问题',
          steps: [
            '优化APP性能',
            '修复Bug',
            '提升用户体验',
            '增加稳定性测试'
          ]
        });
        break;
        
      case 'sdk':
        recommendations.push({
          issue: 'SDK问题',
          steps: [
            '更新SDK版本',
            '验证配置',
            '测试广告加载',
            '检查错误日志'
          ]
        });
        break;
        
      case 'privacy':
        recommendations.push({
          issue: '隐私政策',
          steps: [
            '补充隐私政策',
            '确保链接有效',
            '明确数据使用',
            '添加用户权利'
          ]
        });
        break;
    }
  }
  
  const guide = `## ${config.name} 重新提交建议

**Publisher：** ${config.name}

**问题类型：** ${issues}

---

**修正步骤：**

${recommendations.map(r =>
  `### ${r.issue}
${r.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
).join('\n\n')}

---

**重新提交前检查：**
- ✅ 所有问题已修正
- ✅ 测试通过
- ✅ 信息完整
- ✅ 准备好说明修正内容
`;

  return {
    publisher,
    name: config.name,
    issues,
    recommendations,
    guide,
    totalIssues: issueArray.length
  };
}

/**
 * 生成下一步操作
 */
function generateNextSteps(status) {
  switch (status) {
    case 'pending':
      return [
        '等待审核完成',
        '准备SDK集成文档',
        '配置广告单元',
        '准备营销素材'
      ];
      
    case 'in_review':
      return [
        '审核正在进行',
        '准备补充信息（如需要）',
        '检查邮箱是否有问题'
      ];
      
    case 'approved':
      return [
        '开始集成SDK',
        '配置广告单元',
        '测试广告加载',
        '设置中介（如需要）'
      ];
      
    case 'rejected':
      return [
        '查看拒绝邮件',
        '分析拒绝原因',
        '修正问题',
        '重新提交'
      ];
      
    case 'suspended':
      return [
        '联系平台支持',
        '了解暂停原因',
        '提交申诉（如适用）',
        '修正问题'
      ];
      
    case 'active':
      return [
        '监控广告表现',
        '优化eCPM',
        '配置中介',
        '分析数据'
      ];
      
    default:
      return ['检查平台后台'];
  }
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
      usage: 'check-status | checklist | estimate | reject-analysis | resubmit',
      examples: [
        'node publisher-review-helper.js check-status --publisher admob --status pending',
        'node publisher-review-helper.js checklist --publisher meta'
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'check-status':
        const publisher1 = args.find(a => a.startsWith('--publisher='))?.split('=')[1] || '';
        const status = args.find(a => a.startsWith('--status='))?.split('=')[1] || 'pending';
        result = checkReviewStatus(publisher1, status);
        break;
        
      case 'checklist':
        const publisher2 = args.find(a => a.startsWith('--publisher='))?.split('=')[1] || '';
        result = generateReviewChecklist(publisher2);
        break;
        
      case 'estimate':
        const publisher3 = args.find(a => a.startsWith('--publisher='))?.split('=')[1] || '';
        const type = args.find(a => a.startsWith('--type='))?.split('=')[1] || 'new';
        result = estimateReviewDuration(publisher3, type);
        break;
        
      case 'reject-analysis':
        const reason = args.find(a => a.startsWith('--reason='))?.split('=')[1] || '';
        result = analyzeRejection(reason);
        break;
        
      case 'resubmit':
        const publisher4 = args.find(a => a.startsWith('--publisher='))?.split('=')[1] || '';
        const issues = args.find(a => a.startsWith('--issues='))?.split('=')[1] || '';
        result = generateResubmitRecommendations(publisher4, issues);
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
  checkReviewStatus,
  generateReviewChecklist,
  estimateReviewDuration,
  analyzeRejection,
  generateResubmitRecommendations,
  PUBLISHER_CONFIGS
};

if (require.main === module) {
  main();
}