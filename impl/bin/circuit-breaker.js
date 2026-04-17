#!/usr/bin/env node
/**
 * OpenClaw Circuit Breaker - LLM Failure Protection
 * 
 * 借鉴 DeerFlow 2.0 的 CircuitBreakerConfig 熔断器机制
 * 保护 LLM API 调用，防止雪崩效应
 * 
 * 来源: https://github.com/bytedance/deer-flow
 * 参考: backend/packages/harness/deerflow/config/app_config.py
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const STATE_FILE = path.join(__dirname, '..', '..', 'state', 'circuit-breaker-state.json');
const CONFIG_FILE = path.join(__dirname, '..', '..', 'gateway-config.yaml');

/**
 * Circuit Breaker States
 */
const CircuitState = {
  CLOSED: 'closed',      // Normal operation
  OPEN: 'open',          // Circuit tripped, rejecting calls
  HALF_OPEN: 'half-open' // Testing if circuit can close
};

/**
 * Circuit Breaker
 */
class CircuitBreaker {
  constructor(config = {}) {
    this.enabled = config.enabled || true;
    this.failureThreshold = config.failure_threshold || 5;
    this.recoveryTimeoutSec = config.recovery_timeout_sec || 60;
    
    // State
    this.failures = 0;
    this.state = CircuitState.CLOSED;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    
    // Metrics
    this.totalCalls = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    this.totalOpenEvents = 0;
    this.totalHalfOpenEvents = 0;
    
    // Load state
    this.loadState();
  }

  /**
   * Load state from file
   */
  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        this.failures = state.failures || 0;
        this.state = state.state || CircuitState.CLOSED;
        this.lastFailureTime = state.lastFailureTime || null;
        this.lastStateChange = state.lastStateChange || Date.now();
        this.totalCalls = state.totalCalls || 0;
        this.totalFailures = state.totalFailures || 0;
        this.totalSuccesses = state.totalSuccesses || 0;
        this.totalOpenEvents = state.totalOpenEvents || 0;
        this.totalHalfOpenEvents = state.totalHalfOpenEvents || 0;
      }
    } catch (err) {
      console.error('[circuit-breaker] Load state failed:', err.message);
    }
  }

  /**
   * Save state to file
   */
  saveState() {
    try {
      const state = {
        state: this.state,
        failures: this.failures,
        lastFailureTime: this.lastFailureTime,
        lastStateChange: this.lastStateChange,
        totalCalls: this.totalCalls,
        totalFailures: this.totalFailures,
        totalSuccesses: this.totalSuccesses,
        totalOpenEvents: this.totalOpenEvents,
        totalHalfOpenEvents: this.totalHalfOpenEvents,
        timestamp: Date.now()
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
      console.error('[circuit-breaker] Save state failed:', err.message);
    }
  }

  /**
   * Check if circuit is open
   */
  isOpen() {
    if (!this.enabled) {
      return false;
    }
    
    if (this.state === CircuitState.OPEN) {
      const elapsed = (Date.now() - this.lastFailureTime) / 1000;
      if (elapsed >= this.recoveryTimeoutSec) {
        // Transition to half-open
        this.transitionToHalfOpen();
        return false;
      }
      return true;
    }
    
    return false;
  }

  /**
   * Execute function with circuit breaker protection
   * @param {Function} fn - Function to execute
   * @returns {Promise<any>}
   */
  async call(fn) {
    if (!this.enabled) {
      return await fn();
    }
    
    // Check if circuit is open
    if (this.isOpen()) {
      const elapsed = Math.floor((Date.now() - this.lastFailureTime) / 1000);
      const remaining = this.recoveryTimeoutSec - elapsed;
      throw new Error(`Circuit breaker is OPEN (failures: ${this.failures}/${this.failureThreshold}, recovery in ${remaining}s)`);
    }
    
    this.totalCalls++;
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  /**
   * Handle success
   */
  onSuccess() {
    this.failures = 0;
    this.totalSuccesses++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Transition to closed
      this.state = CircuitState.CLOSED;
      this.lastStateChange = Date.now();
      console.log('[circuit-breaker] State: CLOSED (recovered)');
    }
    
    this.saveState();
  }

  /**
   * Handle failure
   */
  onFailure() {
    this.failures++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Transition back to open
      this.transitionToOpen();
    } else if (this.failures >= this.failureThreshold) {
      // Transition to open
      this.transitionToOpen();
    }
    
    console.log(`[circuit-breaker] Failure ${this.failures}/${this.failureThreshold}, state: ${this.state}`);
    this.saveState();
  }

  /**
   * Transition to OPEN state
   */
  transitionToOpen() {
    this.state = CircuitState.OPEN;
    this.lastStateChange = Date.now();
    this.totalOpenEvents++;
    console.log(`[circuit-breaker] State: OPEN (failures: ${this.failures}/${this.failureThreshold})`);
    this.saveState();
  }

  /**
   * Transition to HALF-OPEN state
   */
  transitionToHalfOpen() {
    this.state = CircuitState.HALF_OPEN;
    this.lastStateChange = Date.now();
    this.totalHalfOpenEvents++;
    console.log('[circuit-breaker] State: HALF-OPEN (testing recovery)');
    this.saveState();
  }

  /**
   * Get current state
   */
  getState() {
    return {
      enabled: this.enabled,
      state: this.state,
      failures: this.failures,
      failureThreshold: this.failureThreshold,
      recoveryTimeoutSec: this.recoveryTimeoutSec,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      isOpen: this.state === CircuitState.OPEN,
      isHalfOpen: this.state === CircuitState.HALF_OPEN,
      metrics: {
        totalCalls: this.totalCalls,
        totalSuccesses: this.totalSuccesses,
        totalFailures: this.totalFailures,
        totalOpenEvents: this.totalOpenEvents,
        totalHalfOpenEvents: this.totalHalfOpenEvents,
        successRate: this.totalCalls > 0 
          ? (this.totalSuccesses / this.totalCalls * 100).toFixed(1) + '%'
          : 'N/A'
      }
    };
  }

  /**
   * Reset circuit breaker
   */
  reset() {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    console.log('[circuit-breaker] Reset to CLOSED');
    this.saveState();
  }

  /**
   * Force open circuit breaker
   */
  forceOpen() {
    this.transitionToOpen();
    console.log('[circuit-breaker] Forced OPEN');
  }
}

/**
 * Load config from gateway-config.yaml
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = yaml.parse(content);
      return config.circuit_breaker || { enabled: true };
    }
  } catch (err) {
    console.error('[circuit-breaker] Load config failed:', err.message);
  }
  return { enabled: true };
}

// Singleton instance
let _circuitBreakerInstance = null;

/**
 * Get CircuitBreaker instance (singleton)
 */
function getCircuitBreaker(config = null) {
  if (!_circuitBreakerInstance || config) {
    const actualConfig = config || loadConfig();
    _circuitBreakerInstance = new CircuitBreaker(actualConfig);
  }
  return _circuitBreakerInstance;
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'status';

if (command === 'status') {
  const cb = getCircuitBreaker();
  const state = cb.getState();
  console.log(JSON.stringify(state, null, 2));
} else if (command === 'reset') {
  const cb = getCircuitBreaker();
  cb.reset();
  console.log('✓ Circuit breaker reset to CLOSED');
} else if (command === 'open') {
  const cb = getCircuitBreaker();
  cb.forceOpen();
  console.log('✓ Circuit breaker forced OPEN');
} else if (command === 'test') {
  const cb = getCircuitBreaker();
  
  console.log('Testing circuit breaker...\n');
  
  // Test success
  console.log('1. Testing success:');
  try {
    cb.call(async () => 'Success');
    console.log('✓ Success call worked\n');
  } catch (err) {
    console.error('✗ Failed:', err.message);
  }
  
  // Test failures
  console.log('2. Testing failures:');
  for (let i = 0; i < cb.failureThreshold + 1; i++) {
    try {
      cb.call(async () => {
        throw new Error('Test failure');
      });
    } catch (err) {
      console.log(`  Failure ${i + 1}: ${err.message}`);
    }
  }
  console.log('');
  
  // Check state
  console.log('3. Final state:');
  console.log(JSON.stringify(cb.getState(), null, 2));
  
  // Reset
  console.log('\n4. Reset:');
  cb.reset();
  console.log(JSON.stringify(cb.getState(), null, 2));
} else {
  console.log('Usage: circuit-breaker.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  status - Show circuit breaker state');
  console.log('  reset  - Reset to CLOSED state');
  console.log('  open   - Force OPEN state');
  console.log('  test   - Test circuit breaker');
}

module.exports = { CircuitBreaker, getCircuitBreaker, CircuitState };