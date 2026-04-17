// @ts-nocheck
/**
 * Array Utils Pattern - 数组工具
 *
 * Source: Claude Code utils/array.ts
 * Pattern: array utils + array helpers + array operations + array manipulation
 */
class ArrayUtilsService {
    operations = [];
    /**
     * Unique
     */
    unique(arr) {
        const result = [...new Set(arr)];
        this.operations.push({ type: 'unique', inputSize: arr.length, outputSize: result.length });
        return result;
    }
    /**
     * Flatten
     */
    flatten(arr) {
        const result = arr.flat(Infinity);
        this.operations.push({ type: 'flatten', inputSize: arr.length, outputSize: result.length });
        return result;
    }
    /**
     * Chunk
     */
    chunk(arr, size) {
        const result = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        this.operations.push({ type: 'chunk', inputSize: arr.length, outputSize: result.length });
        return result;
    }
    /**
     * Shuffle
     */
    shuffle(arr) {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))[result[i], result[j]] = [result[j], result[i]];
        }
        this.operations.push({ type: 'shuffle', inputSize: arr.length, outputSize: result.length });
        return result;
    }
    /**
     * Group by
     */
    groupBy(arr, keyFn) {
        const result = {};
        for (const item of arr) {
            const key = keyFn(item);
            result[key] = result[key] ?? [];
            result[key].push(item);
        }
        this.operations.push({ type: 'groupBy', inputSize: arr.length, outputSize: Object.keys(result).length });
        return result;
    }
    /**
     * Partition
     */
    partition(arr, predicate) {
        const pass = [];
        const fail = [];
        for (const item of arr) {
            if (predicate(item))
                pass.push(item);
            else
                fail.push(item);
        }
        this.operations.push({ type: 'partition', inputSize: arr.length, outputSize: pass.length + fail.length });
        return [pass, fail];
    }
    /**
     * Intersect
     */
    intersect(arr1, arr2) {
        const set2 = new Set(arr2);
        const result = arr1.filter(item => set2.has(item));
        this.operations.push({ type: 'intersect', inputSize: arr1.length + arr2.length, outputSize: result.length });
        return result;
    }
    /**
     * Difference
     */
    difference(arr1, arr2) {
        const set2 = new Set(arr2);
        const result = arr1.filter(item => !set2.has(item));
        this.operations.push({ type: 'difference', inputSize: arr1.length + arr2.length, outputSize: result.length });
        return result;
    }
    /**
     * Get operations
     */
    getOperations() {
        return [...this.operations];
    }
    /**
     * Get stats
     */
    getStats() {
        const byType = {};
        for (const op of this.operations) {
            byType[op.type] = (byType[op.type] ?? 0) + 1;
        }
        const avgInput = this.operations.length > 0
            ? this.operations.reduce((sum, op) => sum + op.inputSize, 0) / this.operations.length
            : 0;
        const avgOutput = this.operations.length > 0
            ? this.operations.reduce((sum, op) => sum + op.outputSize, 0) / this.operations.length
            : 0;
        return {
            operationsCount: this.operations.length,
            byType,
            averageInputSize: avgInput,
            averageOutputSize: avgOutput
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.operations = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const arrayUtilsService = new ArrayUtilsService();
export default arrayUtilsService;
//# sourceMappingURL=array-utils-service.js.map