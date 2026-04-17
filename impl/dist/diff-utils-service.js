// @ts-nocheck
class DiffUtilsService {
    diffs = [];
    /**
     * Diff strings
     */
    diffStrings(oldStr, newStr) {
        const oldLines = oldStr.split('\n');
        const newLines = newStr.split('\n');
        const result = {
            additions: 0,
            deletions: 0,
            modifications: 0,
            unchanged: 0,
            changes: [],
            timestamp: Date.now()
        };
        const maxLen = Math.max(oldLines.length, newLines.length);
        for (let i = 0; i < maxLen; i++) {
            const oldLine = oldLines[i];
            const newLine = newLines[i];
            if (oldLine === undefined) {
                result.additions++;
                result.changes.push({ type: 'addition', new: newLine });
            }
            else if (newLine === undefined) {
                result.deletions++;
                result.changes.push({ type: 'deletion', old: oldLine });
            }
            else if (oldLine === newLine) {
                result.unchanged++;
            }
            else {
                result.modifications++;
                result.changes.push({ type: 'modification', old: oldLine, new: newLine });
            }
        }
        this.diffs.push(result);
        return result;
    }
    /**
     * Diff objects
     */
    diffObjects(oldObj, newObj) {
        const result = {
            additions: 0,
            deletions: 0,
            modifications: 0,
            unchanged: 0,
            changes: [],
            timestamp: Date.now()
        };
        const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
        for (const key of allKeys) {
            const oldVal = oldObj[key];
            const newVal = newObj[key];
            if (oldVal === undefined) {
                result.additions++;
                result.changes.push({ type: 'addition', new: { key, value: newVal } });
            }
            else if (newVal === undefined) {
                result.deletions++;
                result.changes.push({ type: 'deletion', old: { key, value: oldVal } });
            }
            else if (oldVal === newVal) {
                result.unchanged++;
            }
            else {
                result.modifications++;
                result.changes.push({ type: 'modification', old: { key, value: oldVal }, new: { key, value: newVal } });
            }
        }
        this.diffs.push(result);
        return result;
    }
    /**
     * Diff arrays
     */
    diffArrays(oldArr, newArr) {
        const result = {
            additions: newArr.length - oldArr.length,
            deletions: 0,
            modifications: 0,
            unchanged: 0,
            changes: [],
            timestamp: Date.now()
        };
        if (result.additions < 0) {
            result.deletions = -result.additions;
            result.additions = 0;
        }
        const minLen = Math.min(oldArr.length, newArr.length);
        for (let i = 0; i < minLen; i++) {
            if (oldArr[i] === newArr[i]) {
                result.unchanged++;
            }
            else {
                result.modifications++;
                result.changes.push({ type: 'modification', old: oldArr[i], new: newArr[i] });
            }
        }
        this.diffs.push(result);
        return result;
    }
    /**
     * Get diffs
     */
    getDiffs() {
        return [...this.diffs];
    }
    /**
     * Get recent diffs
     */
    getRecent(count = 10) {
        return this.diffs.slice(-count);
    }
    /**
     * Get stats
     */
    getStats() {
        const avgChanges = this.diffs.length > 0
            ? this.diffs.reduce((sum, d) => sum + d.additions + d.deletions + d.modifications, 0) / this.diffs.length
            : 0;
        return {
            diffsCount: this.diffs.length,
            totalAdditions: this.diffs.reduce((sum, d) => sum + d.additions, 0),
            totalDeletions: this.diffs.reduce((sum, d) => sum + d.deletions, 0),
            totalModifications: this.diffs.reduce((sum, d) => sum + d.modifications, 0),
            averageChanges: avgChanges
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.diffs = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const diffUtilsService = new DiffUtilsService();
export default diffUtilsService;
//# sourceMappingURL=diff-utils-service.js.map