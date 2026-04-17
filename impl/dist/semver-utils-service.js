// @ts-nocheck
class SemverUtilsService {
    comparisons = [];
    /**
     * Parse version
     */
    parse(version) {
        const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?(?:\+([a-zA-Z0-9.]+))?$/);
        if (!match)
            return null;
        return {
            major: parseInt(match[1]),
            minor: parseInt(match[2]),
            patch: parseInt(match[3]),
            prerelease: match[4],
            build: match[5]
        };
    }
    /**
     * Compare versions
     */
    compare(a, b) {
        const infoA = this.parse(a);
        const infoB = this.parse(b);
        if (!infoA || !infoB)
            return 0;
        let result = infoA.major - infoB.major;
        if (result !== 0) {
            this.comparisons.push({ a, b, result });
            return Math.sign(result);
        }
        result = infoA.minor - infoB.minor;
        if (result !== 0) {
            this.comparisons.push({ a, b, result });
            return Math.sign(result);
        }
        result = infoA.patch - infoB.patch;
        if (result !== 0) {
            this.comparisons.push({ a, b, result });
            return Math.sign(result);
        }
        // Prerelease comparison
        if (infoA.prerelease && !infoB.prerelease) {
            this.comparisons.push({ a, b, result: -1 });
            return -1;
        }
        if (!infoA.prerelease && infoB.prerelease) {
            this.comparisons.push({ a, b, result: 1 });
            return 1;
        }
        this.comparisons.push({ a, b, result: 0 });
        return 0;
    }
    /**
     * Greater than
     */
    gt(a, b) {
        return this.compare(a, b) > 0;
    }
    /**
     * Less than
     */
    lt(a, b) {
        return this.compare(a, b) < 0;
    }
    /**
     * Equal
     */
    eq(a, b) {
        return this.compare(a, b) === 0;
    }
    /**
     * Greater or equal
     */
    gte(a, b) {
        return this.compare(a, b) >= 0;
    }
    /**
     * Less or equal
     */
    lte(a, b) {
        return this.compare(a, b) <= 0;
    }
    /**
     * Is valid
     */
    isValid(version) {
        return this.parse(version) !== null;
    }
    /**
     * Increment major
     */
    incrementMajor(version) {
        const info = this.parse(version);
        if (!info)
            return version;
        return `${info.major + 1}.0.0`;
    }
    /**
     * Increment minor
     */
    incrementMinor(version) {
        const info = this.parse(version);
        if (!info)
            return version;
        return `${info.major}.${info.minor + 1}.0`;
    }
    /**
     * Increment patch
     */
    incrementPatch(version) {
        const info = this.parse(version);
        if (!info)
            return version;
        return `${info.major}.${info.minor}.${info.patch + 1}`;
    }
    /**
     * Get comparisons
     */
    getComparisons() {
        return [...this.comparisons];
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            comparisonsCount: this.comparisons.length,
            greaterCount: this.comparisons.filter(c => c.result > 0).length,
            lessCount: this.comparisons.filter(c => c.result < 0).length,
            equalCount: this.comparisons.filter(c => c.result === 0).length
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.comparisons = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const semverUtilsService = new SemverUtilsService();
export default semverUtilsService;
//# sourceMappingURL=semver-utils-service.js.map