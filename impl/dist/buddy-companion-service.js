/**
 * Buddy Companion Service
 * Phase 13 - 虚拟伙伴系统
 *
 * 借鉴 Claude Code buddy/ 目录（6 files, ~70KB）
 * 功能: 虚拟伙伴生成、稀有度系统、统计属性、通知系统
 */
// ============================================
// Constants
// ============================================
export const RARITIES = [
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
];
export const SPECIES = [
    'duck',
    'cat',
    'dog',
    'robot',
    'alien',
];
export const STAT_NAMES = [
    'wisdom',
    'courage',
    'charisma',
    'intelligence',
    'creativity',
    'luck',
];
const RARITY_WEIGHTS = {
    common: 60,
    uncommon: 25,
    rare: 10,
    epic: 4,
    legendary: 1,
};
const RARITY_FLOOR = {
    common: 5,
    uncommon: 15,
    rare: 25,
    epic: 35,
    legendary: 50,
};
const HATS = ['none', 'crown', 'hat', 'cap', 'wizard', 'pirate'];
const EYES = ['normal', 'happy', 'sleepy', 'excited', 'cool', 'robot'];
const SPECIES_NAMES = {
    duck: '鸭子',
    cat: '猫咪',
    dog: '狗狗',
    robot: '机器人',
    alien: '外星人',
};
const RARITY_NAMES = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传奇',
};
const STAT_NAMES_CN = {
    wisdom: '智慧',
    courage: '勇气',
    charisma: '魅力',
    intelligence: '智力',
    creativity: '创造力',
    luck: '运气',
};
// ============================================
// State Management
// ============================================
let _state = {
    currentBuddy: null,
    buddies: [],
    totalInteractions: 0,
    lastNotification: null,
};
let _config = {
    enabled: true,
    notificationThresholds: {
        idle: 30,
        milestone: 50,
    },
};
export function getState() {
    return { ..._state, buddies: [..._state.buddies] };
}
export function resetState() {
    _state = {
        currentBuddy: null,
        buddies: [],
        totalInteractions: 0,
        lastNotification: null,
    };
}
export function setConfig(config) {
    _config = { ..._config, ...config };
}
export function getConfig() {
    return { ..._config };
}
// ============================================
// PRNG Helpers
// ============================================
/**
 * Mulberry32 PRNG（小巧的种子随机数生成器）
 */
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/**
 * 字符串哈希
 */
function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
/**
 * 从数组随机选择
 */
function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
}
/**
 * 掷稀有度
 */
function rollRarity(rng) {
    const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let roll = rng() * total;
    for (const rarity of RARITIES) {
        roll -= RARITY_WEIGHTS[rarity];
        if (roll < 0)
            return rarity;
    }
    return 'common';
}
/**
 * 生成属性（一个峰值，一个低谷，其余随机）
 */
function rollStats(rng, rarity) {
    const floor = RARITY_FLOOR[rarity];
    const peak = pick(rng, STAT_NAMES);
    let dump = pick(rng, STAT_NAMES);
    while (dump === peak)
        dump = pick(rng, STAT_NAMES);
    const stats = {};
    for (const name of STAT_NAMES) {
        if (name === peak) {
            stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30));
        }
        else if (name === dump) {
            stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15));
        }
        else {
            stats[name] = floor + Math.floor(rng() * 40);
        }
    }
    return stats;
}
// ============================================
// Buddy Generation
// ============================================
/**
 * 根据用户生成 Buddy（确定性）
 */
export function generateBuddy(userId) {
    const seed = hashString(userId + Date.now().toString());
    const rng = mulberry32(seed);
    const rarity = rollRarity(rng);
    const species = pick(rng, SPECIES);
    const hat = pick(rng, HATS);
    const eyes = pick(rng, EYES);
    const stats = rollStats(rng, rarity);
    // 生成名字
    const namePrefix = SPECIES_NAMES[species];
    const nameSuffix = rarity === 'legendary' ? '·王者' : '';
    const name = `${namePrefix}${nameSuffix}`;
    const buddy = {
        id: `buddy-${userId}-${Date.now()}`,
        name,
        species,
        rarity,
        stats,
        hat,
        eyes,
        createdAt: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
        interactionCount: 0,
    };
    _state.currentBuddy = buddy;
    _state.buddies.push(buddy);
    return buddy;
}
/**
 * 获取当前 Buddy
 */
export function getCurrentBuddy() {
    return _state.currentBuddy;
}
/**
 * 记录交互
 */
export function recordInteraction() {
    if (!_state.currentBuddy)
        return null;
    _state.currentBuddy.interactionCount++;
    _state.currentBuddy.lastInteraction = new Date().toISOString();
    _state.totalInteractions++;
    return _state.currentBuddy;
}
// ============================================
// Notification System
// ============================================
/**
 * 检查是否应该发送通知
 */
export function shouldNotify() {
    if (!_state.currentBuddy || !_config.enabled)
        return null;
    const buddy = _state.currentBuddy;
    const lastInteraction = new Date(buddy.lastInteraction);
    const now = new Date();
    const idleMinutes = (now.getTime() - lastInteraction.getTime()) / 60000;
    // 检查 idle
    if (idleMinutes >= _config.notificationThresholds.idle) {
        return {
            type: 'idle',
            message: `${buddy.name} 在等你回来~ (${Math.floor(idleMinutes)} 分钟没互动了)`,
        };
    }
    // 检查里程碑
    if (buddy.interactionCount > 0 &&
        buddy.interactionCount % _config.notificationThresholds.milestone === 0) {
        return {
            type: 'milestone',
            message: `🎉 ${buddy.name} 达成 ${buddy.interactionCount} 次互动！`,
        };
    }
    return null;
}
/**
 * 生成 Buddy 卡片内容
 */
export function formatBuddyCard(buddy) {
    const rarityEmoji = {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        legendary: '🟡',
    };
    const statsText = STAT_NAMES.map(name => {
        const value = buddy.stats[name];
        const cnName = STAT_NAMES_CN[name];
        const bar = '█'.repeat(Math.floor(value / 10)) + '░'.repeat(10 - Math.floor(value / 10));
        return `${cnName}: ${bar} ${value}`;
    }).join('\n');
    return `${rarityEmoji[buddy.rarity]} **${buddy.name}**
稀有度: ${RARITY_NAMES[buddy.rarity]}
种类: ${SPECIES_NAMES[buddy.species]}

${statsText}

互动次数: ${buddy.interactionCount}`;
}
// ============================================
// OpenClaw Integration Hooks
// ============================================
/**
 * 创建 Buddy Hook（接入消息处理）
 */
export function createBuddyHook() {
    return {
        name: 'buddy-companion',
        onSessionStart: (userId) => {
            if (!_state.currentBuddy) {
                generateBuddy(userId);
            }
            const notification = shouldNotify();
            if (notification) {
                return {
                    buddy: _state.currentBuddy,
                    notification,
                    card: formatBuddyCard(_state.currentBuddy),
                };
            }
            return { buddy: _state.currentBuddy };
        },
        onInteraction: () => {
            recordInteraction();
            const notification = shouldNotify();
            if (notification) {
                return {
                    notification,
                    card: formatBuddyCard(_state.currentBuddy),
                };
            }
            return {};
        },
        onIdle: (idleMinutes) => {
            if (idleMinutes >= _config.notificationThresholds.idle && _state.currentBuddy) {
                return {
                    message: `${_state.currentBuddy.name} 在等你回来~ (${Math.floor(idleMinutes)} 分钟没互动了)`,
                };
            }
            return {};
        },
    };
}
/**
 * 导出统计信息
 */
export function getSystemStats() {
    const rarityStats = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
    };
    for (const buddy of _state.buddies) {
        rarityStats[buddy.rarity]++;
    }
    return {
        state: getState(),
        config: getConfig(),
        rarityStats,
    };
}
/**
 * 重置所有状态
 */
export function resetAll() {
    resetState();
    _config = {
        enabled: true,
        notificationThresholds: {
            idle: 30,
            milestone: 50,
        },
    };
}
//# sourceMappingURL=buddy-companion-service.js.map