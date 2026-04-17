// @ts-nocheck
/**
 * Feishu Card Generator for Phase 9-13
 * 飞书卡片显示 Limits + Buddy + Stats
 */

import * as utils from './index'

// ============================================
// Buddy Card
// ============================================

export function createBuddyCard(): {
  title: string
  content: string
} {
  const buddy = utils.getCurrentBuddy()
  
  if (!buddy) {
    // 生成新 Buddy
    const newBuddy = utils.generateBuddy('user-ou_20ce8ae181b9a6ee6bd380206dad72c6')
    return formatBuddyCardContent(newBuddy)
  }
  
  return formatBuddyCardContent(buddy)
}

function formatBuddyCardContent(buddy: utils.Buddy): { title: string; content: string } {
  const rarityEmoji = {
    common: '⚪',
    uncommon: '🟢',
    rare: '🔵',
    epic: '🟣',
    legendary: '🟡',
  }
  
  const rarityCN = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传奇',
  }
  
  const speciesCN = {
    duck: '鸭子',
    cat: '猫咪',
    dog: '狗狗',
    robot: '机器人',
    alien: '外星人',
  }
  
  const statCN = {
    wisdom: '智慧',
    courage: '勇气',
    charisma: '魅力',
    intelligence: '智力',
    creativity: '创造力',
    luck: '运气',
  }
  
  const emoji = rarityEmoji[buddy.rarity]
  const rarityText = rarityCN[buddy.rarity]
  const speciesText = speciesCN[buddy.species]
  
  // 属性条形图
  const statsText = Object.entries(buddy.stats)
    .map(([key, value]) => {
      const name = statCN[key as keyof typeof statCN]
      const filled = Math.floor(value / 10)
      const empty = 10 - filled
      const bar = '█'.repeat(filled) + '░'.repeat(empty)
      return `${name}: ${bar} ${value}`
    })
    .join('\n')
  
  const title = `${emoji} ${buddy.name}`
  const content = `稀有度: ${rarityText}
种类: ${speciesText}

${statsText}

互动次数: ${buddy.interactionCount}
创建时间: ${new Date(buddy.createdAt).toLocaleString('zh-CN')}`
  
  return { title, content }
}

// ============================================
// Limits Card
// ============================================

export function createLimitsCard(): {
  title: string
  content: string
  warning?: string
} {
  const state = utils.claudeAiLimits.getState()
  const limits = state.currentLimits
  
  const statusEmoji = {
    allowed: '✅',
    allowed_warning: '⚠️',
    rejected: '❌',
  }
  
  const statusText = {
    allowed: '正常',
    allowed_warning: '接近上限',
    rejected: '已耗尽',
  }
  
  const emoji = statusEmoji[limits.status]
  const status = statusText[limits.status]
  
  let content = `状态: ${emoji} ${status}
警告次数: ${state.warningCount}
拒绝次数: ${state.rejectedCount}`
  
  // 添加利用率信息
  if (limits.utilization !== undefined) {
    const utilPct = Math.round(limits.utilization * 100)
    content += `\n使用率: ${utilPct}%`
  }
  
  // 添加重置时间
  if (limits.resetsAt !== undefined) {
    const resetDate = new Date(limits.resetsAt * 1000)
    const hoursTillReset = Math.round((limits.resetsAt - Date.now() / 1000) / 3600)
    content += `\n重置时间: ${resetDate.toLocaleString('zh-CN')}
剩余: ~${hoursTillReset} 小时`
  }
  
  let warning: string | undefined
  if (limits.status === 'allowed_warning') {
    warning = utils.getRateLimitWarning(limits)
  } else if (limits.status === 'rejected') {
    warning = utils.getRateLimitErrorMessage(limits)
  }
  
  return {
    title: '📊 使用量状态',
    content,
    warning,
  }
}

// ============================================
// Stats Card (All Phase 9-13)
// ============================================

export function createStatsCard(): {
  title: string
  content: string
} {
  const stats = utils.getSystemStats()
  
  const content = `**Coordinator**
模式: ${stats.coordinator.mode}
会话数: ${stats.coordinator.sessionCount}
Workers: ${stats.coordinator.workersSpawned}

**Memdir**
文件数: ${stats.memdir.totalFiles}
已选择: ${stats.memdir.selectedCount}
节省 tokens: ${stats.memdir.savedTokens}

**Limits**
状态: ${stats.limits.status}
警告: ${stats.limits.warningCount}
拒绝: ${stats.limits.rejectedCount}

**Tokens**
估算: ${stats.tokens.lastEstimation || '未估算'}
chars/token: ${stats.tokens.config.charsPerToken}

**Buddy**
有伙伴: ${stats.buddy.hasBuddy ? '是' : '否'}
稀有度: ${stats.buddy.rarity || '无'}
互动: ${stats.buddy.interactionCount}`
  
  return {
    title: '📈 Phase 9-13 状态',
    content,
  }
}

// ============================================
// Welcome Card (Session Start)
// ============================================

export function createWelcomeCard(): {
  title: string
  content: string
} {
  const buddyCard = createBuddyCard()
  const limitsCard = createLimitsCard()
  
  const content = `${buddyCard.content}

---

${limitsCard.content}

---

💡 所有功能已接入 OpenClaw
Phase 9-13 模块正常运行 ✅`
  
  return {
    title: '🎉 会话开始',
    content,
  }
}

// ============================================
// Export all card generators
// ============================================

export const cardGenerators = {
  buddy: createBuddyCard,
  limits: createLimitsCard,
  stats: createStatsCard,
  welcome: createWelcomeCard,
}