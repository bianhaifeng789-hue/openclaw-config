// @ts-nocheck
/**
 * Auto Mode Module-Scope State Pattern - 自动模式模块级状态
 *
 * Source: Claude Code utils/permissions/autoModeState.ts
 * Pattern: let + set/get + circuitBroken + _resetForTesting
 */
/**
 * Module-scope state for auto mode
 * Uses simple let variables + getter/setter functions
 * Avoids class overhead for simple boolean flags
 */
// Module-scope state (not exported directly)
let autoModeActive = false;
let autoModeFlagCli = false; // CLI intent (--auto flag)
let autoModeCircuitBroken = false;
let autoModeOptInRequired = false;
/**
 * Set auto mode active state
 */
export function setAutoModeActive(active) {
    autoModeActive = active;
}
/**
 * Check if auto mode is currently active
 */
export function isAutoModeActive() {
    return autoModeActive && !autoModeCircuitBroken;
}
/**
 * Set CLI flag intent (user passed --auto)
 */
export function setAutoModeFlagCli(flag) {
    autoModeFlagCli = flag;
}
/**
 * Check if user requested auto via CLI flag
 */
export function getAutoModeFlagCli() {
    return autoModeFlagCli;
}
/**
 * Set circuit broken state
 */
export function setAutoModeCircuitBroken(broken) {
    autoModeCircuitBroken = broken;
    if (broken) {
        autoModeActive = false; // Kick out immediately
    }
}
/**
 * Check if circuit is broken
 */
export function isAutoModeCircuitBroken() {
    return autoModeCircuitBroken;
}
/**
 * Set opt-in required state
 */
export function setAutoModeOptInRequired(required) {
    autoModeOptInRequired = required;
}
/**
 * Check if opt-in is required
 */
export function isAutoModeOptInRequired() {
    return autoModeOptInRequired;
}
/**
 * Get all state for debugging
 */
export function getAutoModeStateDebug() {
    return {
        active: autoModeActive,
        flagCli: autoModeFlagCli,
        circuitBroken: autoModeCircuitBroken,
        optInRequired: autoModeOptInRequired
    };
}
/**
 * Reset for testing (clear all state)
 */
export function _resetAutoModeStateForTesting() {
    autoModeActive = false;
    autoModeFlagCli = false;
    autoModeCircuitBroken = false;
    autoModeOptInRequired = false;
}
/**
 * Composite check: should auto mode behavior apply?
 * Active AND not circuit broken AND not requiring opt-in
 */
export function shouldAutoModeApply() {
    return autoModeActive && !autoModeCircuitBroken && !autoModeOptInRequired;
}
/**
 * Try to enable auto mode (checks circuit)
 * Returns true if enabled, false if blocked
 */
export function tryEnableAutoMode() {
    if (autoModeCircuitBroken) {
        console.warn('[AutoMode] Cannot enable: circuit broken');
        return false;
    }
    if (autoModeOptInRequired && !autoModeFlagCli) {
        console.warn('[AutoMode] Cannot enable: opt-in required but no CLI flag');
        return false;
    }
    autoModeActive = true;
    return true;
}
//# sourceMappingURL=auto-mode-state.js.map