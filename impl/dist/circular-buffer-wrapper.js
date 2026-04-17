// @ts-nocheck
/**
 * Circular Buffer Singleton - 包装CircularBuffer类为单例
 */
import { CircularBuffer } from './circular-buffer';
// 创建默认实例 (容量100)
const buffer = new CircularBuffer(100);
// 包装方法
export const circularBuffer = {
    write: (data) => buffer.push(data),
    read: () => buffer.toArray(),
    getNewest: () => buffer.newest(),
    getOldest: () => buffer.oldest(),
    clear: () => buffer.clear(),
    size: () => buffer.length,
    setMaxSize: (size) => { },
    getStats: () => ({
        itemsCount: buffer.length,
        capacity: buffer.capacity,
    }),
    _reset: () => buffer.clear(),
};
export { CircularBuffer };
export default circularBuffer;
//# sourceMappingURL=circular-buffer-wrapper.js.map