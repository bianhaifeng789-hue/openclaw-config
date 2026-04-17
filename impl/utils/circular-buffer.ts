// @ts-nocheck

/**
 * Circular Buffer Pattern - 固定大小环形缓冲区
 * 
 * Source: Claude Code utils/CircularBuffer.ts
 * Pattern: Fixed-size ring buffer + push overwrite oldest + newest() peek
 */

export class CircularBuffer<T> {
  private buffer: T[]
  private head: number = 0
  private tail: number = 0
  private count: number = 0

  constructor(private capacity: number) {
    this.buffer = new Array<T>(capacity)
  }

  push(item: T): void {
    this.buffer[this.tail] = item
    this.tail = (this.tail + 1) % this.capacity
    if (this.count < this.capacity) {
      this.count++
    } else {
      this.head = (this.head + 1) % this.capacity // Overwrite oldest
    }
  }

  pop(): T | undefined {
    if (this.count === 0) return undefined
    const item = this.buffer[this.head]
    this.head = (this.head + 1) % this.capacity
    this.count--
    return item
  }

  newest(): T | undefined {
    if (this.count === 0) return undefined
    const index = (this.tail - 1 + this.capacity) % this.capacity
    return this.buffer[index]
  }

  oldest(): T | undefined {
    if (this.count === 0) return undefined
    return this.buffer[this.head]
  }

  get length(): number {
    return this.count
  }

  get isFull(): boolean {
    return this.count === this.capacity
  }

  get isEmpty(): boolean {
    return this.count === 0
  }

  toArray(): T[] {
    const result: T[] = []
    for (let i = 0; i < this.count; i++) {
      result.push(this.buffer[(this.head + i) % this.capacity]!)
    }
    return result
  }

  clear(): void {
    this.head = 0
    this.tail = 0
    this.count = 0
  }

  [Symbol.iterator](): Iterator<T> {
    let index = 0
    return {
      next: (): IteratorResult<T> => {
        if (index < this.count) {
          const value = this.buffer[(this.head + index) % this.capacity]!
          index++
          return { value, done: false }
        }
        return { value: undefined as any, done: true }
      }
    }
  }
}

/**
 * Fixed-size circular buffer with index-based access
 */
export class IndexedCircularBuffer<T> extends CircularBuffer<T> {
  at(index: number): T | undefined {
    if (index < 0 || index >= this.length) return undefined
    return this.toArray()[index]
  }

  indexOf(item: T): number {
    return this.toArray().indexOf(item)
  }

  includes(item: T): boolean {
    return this.toArray().includes(item)
  }
}

export default CircularBuffer