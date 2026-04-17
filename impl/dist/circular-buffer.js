// @ts-nocheck
/**
 * Circular Buffer Pattern - 固定大小环形缓冲区
 *
 * Source: Claude Code utils/CircularBuffer.ts
 * Pattern: Fixed-size ring buffer + push overwrite oldest + newest() peek
 */
export class CircularBuffer {
    capacity;
    buffer;
    head = 0;
    tail = 0;
    count = 0;
    constructor(capacity) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);
    }
    push(item) {
        this.buffer[this.tail] = item;
        this.tail = (this.tail + 1) % this.capacity;
        if (this.count < this.capacity) {
            this.count++;
        }
        else {
            this.head = (this.head + 1) % this.capacity; // Overwrite oldest
        }
    }
    pop() {
        if (this.count === 0)
            return undefined;
        const item = this.buffer[this.head];
        this.head = (this.head + 1) % this.capacity;
        this.count--;
        return item;
    }
    newest() {
        if (this.count === 0)
            return undefined;
        const index = (this.tail - 1 + this.capacity) % this.capacity;
        return this.buffer[index];
    }
    oldest() {
        if (this.count === 0)
            return undefined;
        return this.buffer[this.head];
    }
    get length() {
        return this.count;
    }
    get isFull() {
        return this.count === this.capacity;
    }
    get isEmpty() {
        return this.count === 0;
    }
    toArray() {
        const result = [];
        for (let i = 0; i < this.count; i++) {
            result.push(this.buffer[(this.head + i) % this.capacity]);
        }
        return result;
    }
    clear() {
        this.head = 0;
        this.tail = 0;
        this.count = 0;
    }
    [Symbol.iterator]() {
        let index = 0;
        return {
            next: () => {
                if (index < this.count) {
                    const value = this.buffer[(this.head + index) % this.capacity];
                    index++;
                    return { value, done: false };
                }
                return { value: undefined, done: true };
            }
        };
    }
}
/**
 * Fixed-size circular buffer with index-based access
 */
export class IndexedCircularBuffer extends CircularBuffer {
    at(index) {
        if (index < 0 || index >= this.length)
            return undefined;
        return this.toArray()[index];
    }
    indexOf(item) {
        return this.toArray().indexOf(item);
    }
    includes(item) {
        return this.toArray().includes(item);
    }
}
export default CircularBuffer;
//# sourceMappingURL=circular-buffer.js.map