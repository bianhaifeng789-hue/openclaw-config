// @ts-nocheck
/**
 * XDG Base Directory Pattern - XDG基础目录
 *
 * Source: Claude Code utils/xdg.ts + utils/systemDirectories.ts
 * Pattern: XDG_CONFIG_HOME + XDG_DATA_HOME + XDG_CACHE_HOME + fallback paths
 */
class XDGBaseDirectory {
    env = process.env;
    /**
     * Get XDG_CONFIG_HOME
     */
    getConfigHome() {
        return this.env.XDG_CONFIG_HOME ?? `${this.getHome()}/.config`;
    }
    /**
     * Get XDG_DATA_HOME
     */
    getDataHome() {
        return this.env.XDG_DATA_HOME ?? `${this.getHome()}/.local/share`;
    }
    /**
     * Get XDG_CACHE_HOME
     */
    getCacheHome() {
        return this.env.XDG_CACHE_HOME ?? `${this.getHome()}/.cache`;
    }
    /**
     * Get XDG_STATE_HOME
     */
    getStateHome() {
        return this.env.XDG_STATE_HOME ?? `${this.getHome()}/.local/state`;
    }
    /**
     * Get XDG_RUNTIME_DIR
     */
    getRuntimeDir() {
        return this.env.XDG_RUNTIME_DIR ?? null;
    }
    /**
     * Get XDG_CONFIG_DIRS
     */
    getConfigDirs() {
        const dirs = this.env.XDG_CONFIG_DIRS ?? '/etc/xdg';
        return dirs.split(':').filter(d => d.length > 0);
    }
    /**
     * Get XDG_DATA_DIRS
     */
    getDataDirs() {
        const dirs = this.env.XDG_DATA_DIRS ?? '/usr/local/share:/usr/share';
        return dirs.split(':').filter(d => d.length > 0);
    }
    /**
     * Get home directory
     */
    getHome() {
        return this.env.HOME ?? this.env.USERPROFILE ?? '/tmp';
    }
    /**
     * Get application-specific config path
     */
    getAppConfigPath(appName) {
        return `${this.getConfigHome()}/${appName}`;
    }
    /**
     * Get application-specific data path
     */
    getAppDataPath(appName) {
        return `${this.getDataHome()}/${appName}`;
    }
    /**
     * Get application-specific cache path
     */
    getAppCachePath(appName) {
        return `${this.getCacheHome()}/${appName}`;
    }
    /**
     * Get application-specific state path
     */
    getAppStatePath(appName) {
        return `${this.getStateHome()}/${appName}`;
    }
    /**
     * Find config file in XDG_CONFIG_DIRS
     */
    findConfigFile(filename) {
        // Check config home first
        const configHome = `${this.getConfigHome()}/${filename}`;
        // Would check if file exists
        // For demo, return config home path
        return configHome;
        // Then check config dirs
        for (const dir of this.getConfigDirs()) {
            const path = `${dir}/${filename}`;
            // Would check if file exists
        }
        return null;
    }
    /**
     * Find data file in XDG_DATA_DIRS
     */
    findDataFile(filename) {
        // Check data home first
        const dataHome = `${this.getDataHome()}/${filename}`;
        return dataHome;
        // Then check data dirs
        for (const dir of this.getDataDirs()) {
            const path = `${dir}/${filename}`;
            // Would check if file exists
        }
        return null;
    }
    /**
     * Get all XDG paths
     */
    getAllPaths() {
        return {
            configHome: this.getConfigHome(),
            dataHome: this.getDataHome(),
            cacheHome: this.getCacheHome(),
            stateHome: this.getStateHome(),
            runtimeDir: this.getRuntimeDir(),
            configDirs: this.getConfigDirs(),
            dataDirs: this.getDataDirs()
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.env = process.env;
    }
}
// Global singleton
export const xdgBaseDirectory = new XDGBaseDirectory();
export default xdgBaseDirectory;
//# sourceMappingURL=xdg-base-directory.js.map