// @ts-nocheck

/**
 * Content Array Pattern - 内容数组
 * 
 * Source: Claude Code utils/contentArray.ts
 * Pattern: content array + content management + multi-content + content handling
 */

interface ContentArrayItem {
  id: string
  type: 'text' | 'image' | 'file' | 'code'
  content: string
  metadata?: Record<string, any>
  addedAt: number
}

class ContentArrayService {
  private contents: ContentArrayItem[] = []
  private contentCounter = 0

  /**
   * Add content
   */
  add(type: ContentArrayItem['type'], content: string, metadata?: Record<string, any>): ContentArrayItem {
    const id = `content-${++this.contentCounter}-${Date.now()}`

    const item: ContentArrayItem = {
      id,
      type,
      content,
      metadata,
      addedAt: Date.now()
    }

    this.contents.push(item)

    return item
  }

  /**
   * Add text
   */
  addText(content: string): ContentArrayItem {
    return this.add('text', content)
  }

  /**
   * Add image
   */
  addImage(content: string, metadata?: Record<string, any>): ContentArrayItem {
    return this.add('image', content, metadata)
  }

  /**
   * Add file
   */
  addFile(content: string, metadata?: Record<string, any>): ContentArrayItem {
    return this.add('file', content, metadata)
  }

  /**
   * Add code
   */
  addCode(content: string, metadata?: Record<string, any>): ContentArrayItem {
    return this.add('code', content, metadata)
  }

  /**
   * Get content
   */
  get(id: string): ContentArrayItem | undefined {
    return this.contents.find(c => c.id === id)
  }

  /**
   * Get by type
   */
  getByType(type: ContentArrayItem['type']): ContentArrayItem[] {
    return this.contents.filter(c => c.type === type)
  }

  /**
   * Get all contents
   */
  getAll(): ContentArrayItem[] {
    return [...this.contents]
  }

  /**
   * Get recent
   */
  getRecent(count: number = 10): ContentArrayItem[] {
    return this.contents.slice(-count)
  }

  /**
   * Remove content
   */
  remove(id: string): boolean {
    const index = this.contents.findIndex(c => c.id === id)
    if (index === -1) return false

    this.contents.splice(index, 1)

    return true
  }

  /**
   * Clear by type
   */
  clearByType(type: ContentArrayItem['type']): number {
    const toRemove = this.getByType(type)
    this.contents = this.contents.filter(c => c.type !== type)

    return toRemove.length
  }

  /**
   * Get stats
   */
  getStats(): {
    contentsCount: number
    byType: Record<ContentArrayItem['type'], number>
    averageContentSize: number
    totalSize: number
  } {
    const byType: Record<ContentArrayItem['type'], number> = {
      text: 0, image: 0, file: 0, code: 0
    }

    for (const content of this.contents) {
      byType[content.type]++
    }

    const totalSize = this.contents.reduce((sum, c) => sum + c.content.length, 0)
    const avgSize = this.contents.length > 0 ? totalSize / this.contents.length : 0

    return {
      contentsCount: this.contents.length,
      byType,
      averageContentSize: avgSize,
      totalSize: totalSize
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.contents = []
    this.contentCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const contentArrayService = new ContentArrayService()

export default contentArrayService