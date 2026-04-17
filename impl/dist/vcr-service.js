// @ts-nocheck
class VCRService {
    cassettes = new Map();
    currentCassette = null;
    mode = 'disabled';
    recordingCounter = 0;
    /**
     * Start recording
     */
    startRecording(cassetteName) {
        this.mode = 'record';
        this.currentCassette = {
            name: cassetteName,
            recordings: [],
            createdAt: Date.now()
        };
    }
    /**
     * Stop recording
     */
    stopRecording() {
        if (!this.currentCassette)
            return null;
        this.cassettes.set(this.currentCassette.name, this.currentCassette);
        const cassette = this.currentCassette;
        this.currentCassette = null;
        this.mode = 'disabled';
        return cassette;
    }
    /**
     * Load cassette for playback
     */
    loadCassette(name) {
        const cassette = this.cassettes.get(name);
        if (!cassette)
            return false;
        this.currentCassette = cassette;
        this.mode = 'playback';
        return true;
    }
    /**
     * Eject cassette
     */
    eject() {
        this.currentCassette = null;
        this.mode = 'disabled';
    }
    /**
     * Record request/response
     */
    record(request, response) {
        if (this.mode !== 'record' || !this.currentCassette)
            return;
        const recording = {
            request,
            response,
            timestamp: Date.now()
        };
        this.currentCassette.recordings.push(recording);
        this.recordingCounter++;
    }
    /**
     * Find matching recording
     */
    findRecording(request) {
        if (this.mode !== 'playback' || !this.currentCassette)
            return undefined;
        return this.currentCassette.recordings.find(r => r.request.method === request.method &&
            r.request.url === request.url);
    }
    /**
     * Get cassette
     */
    getCassette(name) {
        return this.cassettes.get(name);
    }
    /**
     * Get all cassettes
     */
    getAllCassettes() {
        return Array.from(this.cassettes.values());
    }
    /**
     * Delete cassette
     */
    deleteCassette(name) {
        return this.cassettes.delete(name);
    }
    /**
     * Get mode
     */
    getMode() {
        return this.mode;
    }
    /**
     * Get stats
     */
    getStats() {
        const totalRecordings = Array.from(this.cassettes.values())
            .reduce((sum, c) => sum + c.recordings.length, 0);
        return {
            cassetteCount: this.cassettes.size,
            totalRecordings,
            currentMode: this.mode,
            currentCassette: this.currentCassette?.name ?? null
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.cassettes.clear();
        this.currentCassette = null;
        this.mode = 'disabled';
        this.recordingCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const vcrService = new VCRService();
export default vcrService;
//# sourceMappingURL=vcr-service.js.map