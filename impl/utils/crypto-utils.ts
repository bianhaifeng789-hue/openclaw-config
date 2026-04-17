// @ts-nocheck

/**
 * Crypto Utils Pattern - 加密工具
 * 
 * Source: Claude Code utils/crypto.ts
 * Pattern: crypto utils + hashing + encryption + random + secure
 */

class CryptoUtils {
  /**
   * Generate random ID
   */
  randomId(length = 16): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''

    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }

    return result
  }

  /**
   * Generate random hex string
   */
  randomHex(length = 32): string {
    const bytes = Buffer.alloc(Math.ceil(length / 2))

    // Would use crypto.randomBytes in real implementation
    // For demo, use Math.random
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }

    return bytes.toString('hex').slice(0, length)
  }

  /**
   * Simple hash (SHA256-like)
   */
  hash(data: string): string {
    // Would use crypto.createHash in real implementation
    // For demo, use simple hash
    let hash = 0

    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }

    // Convert to hex-like format
    const positive = Math.abs(hash)
    return positive.toString(16).padStart(8, '0')
  }

  /**
   * Hash with salt
   */
  hashWithSalt(data: string, salt: string): string {
    return this.hash(salt + data + salt)
  }

  /**
   * Simple encrypt (for demo)
   */
  encrypt(data: string, key: string): string {
    // Would use real encryption (AES)
    // For demo, use simple XOR
    const result: number[] = []

    for (let i = 0; i < data.length; i++) {
      const dataChar = data.charCodeAt(i)
      const keyChar = key.charCodeAt(i % key.length)
      result.push(dataChar ^ keyChar)
    }

    return Buffer.from(result).toString('base64')
  }

  /**
   * Simple decrypt (for demo)
   */
  decrypt(encrypted: string, key: string): string {
    // Would use real decryption (AES)
    // For demo, reverse XOR
    const buffer = Buffer.from(encrypted, 'base64')
    const result: string[] = []

    for (let i = 0; i < buffer.length; i++) {
      const dataByte = buffer[i]
      const keyChar = key.charCodeAt(i % key.length)
      result.push(String.fromCharCode(dataByte ^ keyChar))
    }

    return result.join('')
  }

  /**
   * Generate UUID-like ID
   */
  uuid(): string {
    const parts = [
      this.randomHex(8),
      this.randomHex(4),
      this.randomHex(4),
      this.randomHex(4),
      this.randomHex(12)
    ]

    return parts.join('-')
  }

  /**
   * Generate token
   */
  generateToken(prefix = 'token'): string {
    return `${prefix}-${this.randomHex(16)}-${Date.now()}`
  }

  /**
   * Validate token format
   */
  isValidToken(token: string): boolean {
    return /^token-[a-f0-9]+-\d+$/.test(token)
  }

  /**
   * Obfuscate data (species encoding pattern)
   */
  obfuscate(data: string): string {
    // Would use more sophisticated obfuscation
    // For demo, use base64 + reverse
    const base64 = Buffer.from(data).toString('base64')
    return base64.split('').reverse().join('')
  }

  /**
   * Deobfuscate data
   */
  deobfuscate(obfuscated: string): string {
    const base64 = obfuscated.split('').reverse().join('')
    return Buffer.from(base64, 'base64').toString()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    // No state
  }
}

// Global singleton
export const cryptoUtils = new CryptoUtils()

export default cryptoUtils