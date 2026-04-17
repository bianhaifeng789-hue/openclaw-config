// @ts-nocheck
class AttributionService {
    attributions = new Map();
    commitAttributions = new Map();
    attributionCounter = 0;
    /**
     * Create attribution
     */
    createAttribution(authors, coAuthors, messageId) {
        const id = `attr-${++this.attributionCounter}-${Date.now()}`;
        const attribution = {
            id,
            authors,
            coAuthors: coAuthors ?? [],
            timestamp: Date.now(),
            messageId
        };
        this.attributions.set(id, attribution);
        return attribution;
    }
    /**
     * Add co-author
     */
    addCoAuthor(attributionId, name, email) {
        const attribution = this.attributions.get(attributionId);
        if (!attribution)
            return false;
        attribution.coAuthors.push({ name, email });
        return true;
    }
    /**
     * Get attribution
     */
    getAttribution(id) {
        return this.attributions.get(id);
    }
    /**
     * Format attribution for commit
     */
    formatForCommit(attribution) {
        const lines = [];
        // Primary author
        if (attribution.authors.length > 0) {
            const primary = attribution.authors[0];
            lines.push(`Author: ${primary.name} <${primary.email}>`);
        }
        // Co-authors
        for (const coAuthor of attribution.coAuthors) {
            lines.push(`Co-authored-by: ${coAuthor.name} <${coAuthor.email}>`);
        }
        return lines.join('\n');
    }
    /**
     * Link to commit
     */
    linkToCommit(attributionId, commitHash) {
        const attribution = this.attributions.get(attributionId);
        if (!attribution)
            return null;
        const commitAttribution = {
            commitHash,
            attribution,
            verified: false
        };
        this.commitAttributions.set(commitHash, commitAttribution);
        return commitAttribution;
    }
    /**
     * Verify commit attribution
     */
    verifyCommit(commitHash) {
        const commitAttribution = this.commitAttributions.get(commitHash);
        if (!commitAttribution)
            return false;
        // Would verify against git commit
        commitAttribution.verified = true;
        return true;
    }
    /**
     * Get commit attribution
     */
    getCommitAttribution(commitHash) {
        return this.commitAttributions.get(commitHash);
    }
    /**
     * Get attributions by author
     */
    getByAuthor(email) {
        return Array.from(this.attributions.values())
            .filter(a => a.authors.some(au => au.email === email) || a.coAuthors.some(ca => ca.email === email));
    }
    /**
     * Get stats
     */
    getStats() {
        const attributions = Array.from(this.attributions.values());
        const authors = new Set(attributions.flatMap(a => a.authors.map(au => au.email)));
        const coAuthors = new Set(attributions.flatMap(a => a.coAuthors.map(ca => ca.email)));
        const verified = Array.from(this.commitAttributions.values()).filter(ca => ca.verified).length;
        return {
            totalAttributions: this.attributions.size,
            commitAttributions: this.commitAttributions.size,
            verifiedCommits: verified,
            totalAuthors: authors.size,
            totalCoAuthors: coAuthors.size
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.attributions.clear();
        this.commitAttributions.clear();
        this.attributionCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const attributionService = new AttributionService();
export default attributionService;
//# sourceMappingURL=attribution-service.js.map