// @ts-nocheck
class AutoUpdater {
    currentVersion = '1.0.0';
    updateInfo = null;
    progress = null;
    autoCheckEnabled = true;
    lastCheckTime = 0;
    /**
     * Set current version
     */
    setCurrentVersion(version) {
        this.currentVersion = version;
    }
    /**
     * Check for update
     */
    async checkForUpdate() {
        this.progress = { status: 'checking', progress: 0, message: 'Checking for updates...' };
        // Would check against update server
        // For demo, simulate
        const latestVersion = '1.0.1';
        const hasUpdate = latestVersion !== this.currentVersion;
        const info = {
            currentVersion: this.currentVersion,
            latestVersion,
            hasUpdate,
            releaseNotes: hasUpdate ? 'Bug fixes and improvements' : undefined,
            downloadUrl: hasUpdate ? 'https://updates.example.com/latest' : undefined,
            publishedAt: Date.now()
        };
        this.updateInfo = info;
        this.lastCheckTime = Date.now();
        this.progress = { status: 'checking', progress: 100, message: 'Check complete' };
        return info;
    }
    /**
     * Download update
     */
    async downloadUpdate() {
        if (!this.updateInfo?.hasUpdate)
            return false;
        this.progress = { status: 'downloading', progress: 0, message: 'Downloading...' };
        // Simulate download progress
        for (let i = 0; i <= 100; i += 10) {
            this.progress = { status: 'downloading', progress: i, message: `Downloading ${i}%` };
            await this.delay(100);
        }
        return true;
    }
    /**
     * Install update
     */
    async installUpdate() {
        if (!this.updateInfo?.hasUpdate)
            return false;
        this.progress = { status: 'installing', progress: 0, message: 'Installing...' };
        // Simulate install
        await this.delay(500);
        this.progress = { status: 'complete', progress: 100, message: 'Update installed' };
        this.currentVersion = this.updateInfo.latestVersion;
        return true;
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get update info
     */
    getUpdateInfo() {
        return this.updateInfo;
    }
    /**
     * Get progress
     */
    getProgress() {
        return this.progress;
    }
    /**
     * Get current version
     */
    getCurrentVersion() {
        return this.currentVersion;
    }
    /**
     * Get last check time
     */
    getLastCheckTime() {
        return this.lastCheckTime;
    }
    /**
     * Enable/disable auto check
     */
    setAutoCheck(enabled) {
        this.autoCheckEnabled = enabled;
    }
    /**
     * Is auto check enabled
     */
    isAutoCheckEnabled() {
        return this.autoCheckEnabled;
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            currentVersion: this.currentVersion,
            lastCheckTime: this.lastCheckTime,
            autoCheckEnabled: this.autoCheckEnabled,
            updateAvailable: this.updateInfo?.hasUpdate ?? false
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.currentVersion = '1.0.0';
        this.updateInfo = null;
        this.progress = null;
        this.autoCheckEnabled = true;
        this.lastCheckTime = 0;
    }
}
// Global singleton
export const autoUpdater = new AutoUpdater();
export default autoUpdater;
//# sourceMappingURL=auto-updater.js.map