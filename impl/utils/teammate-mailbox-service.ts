/**
 * Phase 35: TeammateMailbox - 队友邮箱
 * 
 * 借鉴 Claude Code 的 teammateMailbox.ts
 * 
 * 功能：多代理协作时的消息传递邮箱
 * 飞书场景：Swarm 多代理协作的消息传递机制
 */

// ============================================================================
// Types
// ============================================================================

export interface MailboxMessage {
  id: string
  fromAgentId: string
  toAgentId: string
  timestamp: number
  type: 'task' | 'result' | 'status' | 'error' | 'sync'
  payload: Record<string, any>
  status: 'pending' | 'delivered' | 'read' | 'archived'
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

export interface MailboxConfig {
  maxMessages: number            // 最大消息数（默认 100）
  maxAgeMs: number               // 最大年龄（默认 24h）
  retentionMs: number            // 保留时间（默认 48h）
  enabled: boolean
}

export interface MailboxStats {
  totalMessages: number
  pendingMessages: number
  deliveredMessages: number
  readMessages: number
  archivedMessages: number
  averageDeliveryTimeMs: number
}

// ============================================================================
// State
// ============================================================================

const DEFAULT_CONFIG: MailboxConfig = {
  maxMessages: 100,
  maxAgeMs: 24 * 60 * 60 * 1000,  // 24h
  retentionMs: 48 * 60 * 60 * 1000,  // 48h
  enabled: true,
}

let stats: MailboxStats = {
  totalMessages: 0,
  pendingMessages: 0,
  deliveredMessages: 0,
  readMessages: 0,
  archivedMessages: 0,
  averageDeliveryTimeMs: 0,
}

// 每个代理的邮箱
const mailboxes: Map<string, MailboxMessage[]> = new Map()

// ============================================================================
// Message Management
// ============================================================================

/**
 * 创建消息
 */
export function createMessage(
  fromAgentId: string,
  toAgentId: string,
  type: MailboxMessage['type'],
  payload: Record<string, any>,
  priority: MailboxMessage['priority'] = 'normal',
): MailboxMessage {
  const message: MailboxMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fromAgentId,
    toAgentId,
    timestamp: Date.now(),
    type,
    payload,
    status: 'pending',
    priority,
  }
  
  stats.totalMessages++
  stats.pendingMessages++
  
  return message
}

/**
 * 发送消息到邮箱
 */
export function sendMessage(message: MailboxMessage): boolean {
  const mailbox = mailboxes.get(message.toAgentId) || []
  
  // 检查邮箱容量
  if (mailbox.length >= DEFAULT_CONFIG.maxMessages) {
    // 移除最旧的已读消息
    const oldRead = mailbox.filter(m => m.status === 'read')
    if (oldRead.length > 0) {
      mailbox.splice(0, oldRead.length)
      stats.archivedMessages += oldRead.length
    } else {
      return false  // 邮箱已满
    }
  }
  
  mailbox.push(message)
  mailboxes.set(message.toAgentId, mailbox)
  
  return true
}

/**
 * 获取邮箱消息
 */
export function getMessages(agentId: string, unreadOnly: boolean = false): MailboxMessage[] {
  const mailbox = mailboxes.get(agentId) || []
  
  if (unreadOnly) {
    return mailbox.filter(m => m.status === 'pending' || m.status === 'delivered')
  }
  
  return mailbox
}

/**
 * 获取高优先级消息
 */
export function getUrgentMessages(agentId: string): MailboxMessage[] {
  const mailbox = mailboxes.get(agentId) || []
  return mailbox.filter(m => m.priority === 'urgent' && m.status === 'pending')
}

/**
 * 标记消息已送达
 */
export function markDelivered(messageId: string, agentId: string): MailboxMessage | null {
  const mailbox = mailboxes.get(agentId) || []
  const message = mailbox.find(m => m.id === messageId)
  
  if (!message) return null
  
  message.status = 'delivered'
  stats.pendingMessages--
  stats.deliveredMessages++
  
  const deliveryTime = Date.now() - message.timestamp
  stats.averageDeliveryTimeMs = 
    (stats.averageDeliveryTimeMs * (stats.deliveredMessages - 1) + deliveryTime) / stats.deliveredMessages
  
  return message
}

/**
 * 标记消息已读
 */
export function markRead(messageId: string, agentId: string): MailboxMessage | null {
  const mailbox = mailboxes.get(agentId) || []
  const message = mailbox.find(m => m.id === messageId)
  
  if (!message) return null
  
  message.status = 'read'
  stats.deliveredMessages--
  stats.readMessages++
  
  return message
}

/**
 * 归档消息
 */
export function archiveMessage(messageId: string, agentId: string): boolean {
  const mailbox = mailboxes.get(agentId) || []
  const message = mailbox.find(m => m.id === messageId)
  
  if (!message) return false
  
  message.status = 'archived'
  stats.readMessages--
  stats.archivedMessages++
  
  return true
}

/**
 * 清除邮箱
 */
export function clearMailbox(agentId: string): number {
  const mailbox = mailboxes.get(agentId) || []
  const cleared = mailbox.length
  
  stats.archivedMessages += mailbox.filter(m => m.status !== 'archived').length
  mailboxes.delete(agentId)
  
  return cleared
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * 清理过期消息
 */
export function cleanupExpiredMessages(): number {
  const now = Date.now()
  let cleaned = 0
  
  for (const [agentId, mailbox] of mailboxes.entries()) {
    const validMessages = mailbox.filter(m => 
      m.status === 'pending' || 
      now - m.timestamp < DEFAULT_CONFIG.retentionMs
    )
    
    const removed = mailbox.length - validMessages.length
    cleaned += removed
    stats.archivedMessages += removed
    
    if (validMessages.length === 0) {
      mailboxes.delete(agentId)
    } else {
      mailboxes.set(agentId, validMessages)
    }
  }
  
  return cleaned
}

// ============================================================================
// Stats
// ============================================================================

export function getMailboxStats(): MailboxStats & { 
  config: MailboxConfig
  mailboxCount: number
} {
  return {
    ...stats,
    config: DEFAULT_CONFIG,
    mailboxCount: mailboxes.size,
  }
}

// ============================================================================
// HEARTBEAT Integration
// ============================================================================

/**
 * Heartbeat 检查点
 */
export async function checkMailboxForHeartbeat(agentId: string): Promise<{
  pendingCount: number
  urgentCount: number
  oldestPendingAgeMs: number
}> {
  const mailbox = mailboxes.get(agentId) || []
  const pending = mailbox.filter(m => m.status === 'pending')
  const urgent = pending.filter(m => m.priority === 'urgent')
  
  const oldestPending = pending.length > 0 
    ? Math.min(...pending.map(m => m.timestamp))
    : Date.now()
  
  return {
    pendingCount: pending.length,
    urgentCount: urgent.length,
    oldestPendingAgeMs: Date.now() - oldestPending,
  }
}

// ============================================================================
// Feishu Card
// ============================================================================

export function createMailboxCard(agentId: string): {
  title: string
  content: string
} {
  const mailbox = mailboxes.get(agentId) || []
  const pending = mailbox.filter(m => m.status === 'pending')
  const urgent = pending.filter(m => m.priority === 'urgent')
  
  return {
    title: '📬 队友邮箱',
    content: `收件人: ${agentId.slice(0, 30)}

待处理: ${pending.length} 个
紧急: ${urgent.length} 个
已读: ${mailbox.filter(m => m.status === 'read').length} 个

${urgent.slice(0, 3).map(m => `- [紧急] ${m.type}: ${m.payload.summary || '无摘要'}`).join('\n')}`,
  }
}

// ============================================================================
// Service Object
// ============================================================================

export const teammateMailboxService = {
  create: createMessage,
  send: sendMessage,
  get: getMessages,
  getUrgent: getUrgentMessages,
  markDelivered,
  markRead,
  archive: archiveMessage,
  clear: clearMailbox,
  cleanup: cleanupExpiredMessages,
  getStats: getMailboxStats,
  checkForHeartbeat: checkMailboxForHeartbeat,
  createCard: createMailboxCard,
}

export default teammateMailboxService