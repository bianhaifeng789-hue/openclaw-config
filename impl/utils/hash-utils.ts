// @ts-nocheck

/**
 * Hash Utils Pattern - 哈希工具
 * 
 * Source: Claude Code utils/hash.ts
 * Pattern: djb2 hash + murmurhash + consistent hashing + stable hash
 */

class HashUtils {
  /**
   * DJB2 hash (simple, fast)
   */
  djb2(str: string): number {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i) // hash * 33 + c
    }
    return hash & hash // Convert to 32-bit integer
  }

  /**
   * DJB2 hash as hex string
   */
  djb2Hex(str: string): string {
    return this.djb2(str).toString(16)
  }

  /**
   * Simple hash (for caching keys)
   */
  simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `hash-${hash.toString(16)}`
  }

  /**
   * MurmurHash3-like (simplified)
   */
  murmurLike(str: string, seed = 0): number {
    const c1 = 0xcc9e2d51
    const c2 = 0x1b873593

    let h1 = seed
    const length = str.length

    for (let i = 0; i < length; i++) {
      let k1 = str.charCodeAt(i)

      k1 = Math.imul(k1, c1)
      k1 = (k1 << 15) | (k1 >>> 17)
      k1 = Math.imul(k1, c2)

      h1 ^= k1
      h1 = (h1 << 13) | (h1 >>> 19)
      h1 = Math.imul(h1, 5) + 0xe6546b64
    }

    h1 ^= length
    h1 ^= h1 >>> 16
    h1 = Math.imul(h1, 0x85ebca6b)
    h1 ^= h1 >>> 13
    h1 = Math.imul(h1, 0xc2b2ae35)
    h1 ^= h1 >>> 16

    return h1 >>> 0
  }

  /**
   * Hash object (stable, deterministic)
   */
  hashObject(obj: Record<string, any>): string {
    const sorted = this.sortObject(obj)
    const str = JSON.stringify(sorted)
    return this.simpleHash(str)
  }

  /**
   * Sort object keys for stable hash
   */
  private sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {}
    const keys = Object.keys(obj).sort()

    for (const key of keys) {
      const value = obj[key]
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sorted[key] = this.sortObject(value)
      } else {
        sorted[key] = value
      }
    }

    return sorted
  }

  /**
   * Consistent hash (for distributed systems)
   * Maps key to bucket in range [0, buckets)
   */
  consistentHash(key: string, buckets: number): number {
    const hash = this.murmurLike(key)
    return Math.abs(hash) % buckets
  }

  /**
   * Hash with collision detection
   */
  hashWithCollision(str: string, existingHashes: Set<string>): string {
    let hash = this.djb2Hex(str)
    let suffix = 0

    while (existingHashes.has(hash)) {
      suffix++
      hash = this.djb2Hex(str + suffix.toString())
    }

    return hash
  }

  /**
   * Checksum for data integrity
   */
  checksum(data: string | Buffer): string {
    const str = typeof data === 'string' ? data : data.toString('utf8')
    return this.djb2Hex(str)
  }

  /**
   * Verify checksum
   */
  verifyChecksum(data: string | Buffer, expectedChecksum: string): boolean {
    return this.checksum(data) === expectedChecksum
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    // No state
  }
}

// Global singleton
export const hashUtils = new HashUtils()

export default hashUtils