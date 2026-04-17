// @ts-nocheck

/**
 * Image Resizer Pattern - 图片压缩
 * 
 * Source: Claude Code utils/imageResizer.ts
 * Pattern: image resize + compression + max dimensions + quality
 */

interface ResizeConfig {
  maxWidth: number
  maxHeight: number
  quality: number
  format: 'jpeg' | 'png' | 'webp'
}

interface ResizeResult {
  width: number
  height: number
  sizeBytes: number
  format: string
  ratio: number
}

class ImageResizer {
  private config: ResizeConfig = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'jpeg'
  }

  private resizeHistory: ResizeResult[] = []

  /**
   * Resize image
   */
  async resize(input: Buffer | string): Promise<{ buffer: Buffer; result: ResizeResult }> {
    // Would use sharp or similar library
    // For demo, simulate resize
    const originalSize = input.length

    // Calculate dimensions
    const width = Math.min(this.config.maxWidth, 800)
    const height = Math.min(this.config.maxHeight, 600)

    // Simulate compression
    const compressionRatio = this.config.quality
    const newSize = Math.floor(originalSize * compressionRatio * 0.5)

    const result: ResizeResult = {
      width,
      height,
      sizeBytes: newSize,
      format: this.config.format,
      ratio: newSize / originalSize
    }

    this.resizeHistory.push(result)

    // Return placeholder buffer
    return {
      buffer: Buffer.from('resized-image-placeholder'),
      result
    }
  }

  /**
   * Resize to max dimensions
   */
  resizeToMax(width: number, height: number): { width: number; height: number } {
    const aspectRatio = width / height

    let newWidth = width
    let newHeight = height

    if (newWidth > this.config.maxWidth) {
      newWidth = this.config.maxWidth
      newHeight = Math.floor(newWidth / aspectRatio)
    }

    if (newHeight > this.config.maxHeight) {
      newHeight = this.config.maxHeight
      newWidth = Math.floor(newHeight * aspectRatio)
    }

    return { width: newWidth, height: newHeight }
  }

  /**
   * Check if needs resize
   */
  needsResize(width: number, height: number): boolean {
    return width > this.config.maxWidth || height > this.config.maxHeight
  }

  /**
   * Set config
   */
  setConfig(config: Partial<ResizeConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get config
   */
  getConfig(): ResizeConfig {
    return { ...this.config }
  }

  /**
   * Get history
   */
  getHistory(): ResizeResult[] {
    return [...this.resizeHistory]
  }

  /**
   * Get stats
   */
  getStats(): {
    totalResized: number
    averageRatio: number
    averageSizeBytes: number
  } {
    const total = this.resizeHistory.length
    const avgRatio = total > 0
      ? this.resizeHistory.reduce((sum, r) => sum + r.ratio, 0) / total
      : 0
    const avgSize = total > 0
      ? this.resizeHistory.reduce((sum, r) => sum + r.sizeBytes, 0) / total
      : 0

    return { totalResized: total, averageRatio: avgRatio, averageSizeBytes: avgSize }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.resizeHistory = []
    this.config = {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      format: 'jpeg'
    }
  }
}

// Global singleton
export const imageResizer = new ImageResizer()

export default imageResizer