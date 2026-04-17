// @ts-nocheck
/**
 * Platform Utils Pattern - 平台检测工具
 *
 * Source: Claude Code utils/platform.ts + utils/envUtils.ts
 * Pattern: isMac/Windows/Linux + isCI + isDocker + platform-specific paths
 */
class PlatformUtils {
    platform = process.platform;
    env = process.env;
    /**
     * Is macOS
     */
    isMac() {
        return this.platform === 'darwin';
    }
    /**
     * Is Windows
     */
    isWindows() {
        return this.platform === 'win32';
    }
    /**
     * Is Linux
     */
    isLinux() {
        return this.platform === 'linux';
    }
    /**
     * Is CI environment
     */
    isCI() {
        return Boolean(this.env.CI ||
            this.env.GITHUB_ACTIONS ||
            this.env.GITLAB_CI ||
            this.env.CIRCLECI ||
            this.env.JENKINS_URL ||
            this.env.TRAVIS ||
            this.env.APPVEYOR ||
            this.env.BUILDKITE ||
            this.env.TF_BUILD);
    }
    /**
     * Is Docker container
     */
    isDocker() {
        // Check for .dockerenv file or DOCKER_HOST
        return Boolean(this.env.DOCKER_HOST ||
            this.env.DOCKER_CONTAINER);
    }
    /**
     * Is WSL (Windows Subsystem for Linux)
     */
    isWSL() {
        return Boolean(this.env.WSL_DISTRO_NAME ||
            this.env.WSLENV);
    }
    /**
     * Is TTY (interactive terminal)
     */
    isTTY() {
        return process.stdout.isTTY ?? false;
    }
    /**
     * Is debug mode
     */
    isDebug() {
        return Boolean(this.env.DEBUG ||
            this.env.NODE_DEBUG);
    }
    /**
     * Is production mode
     */
    isProduction() {
        return this.env.NODE_ENV === 'production';
    }
    /**
     * Is development mode
     */
    isDevelopment() {
        return this.env.NODE_ENV === 'development' || this.env.NODE_ENV === 'test';
    }
    /**
     * Is test mode
     */
    isTest() {
        return this.env.NODE_ENV === 'test';
    }
    /**
     * Get platform name
     */
    getPlatformName() {
        switch (this.platform) {
            case 'darwin': return 'mac';
            case 'win32': return 'windows';
            case 'linux': return 'linux';
            default: return 'unknown';
        }
    }
    /**
     * Get shell path
     */
    getShellPath() {
        if (this.isWindows()) {
            return this.env.COMSPEC ?? 'cmd.exe';
        }
        return this.env.SHELL ?? '/bin/sh';
    }
    /**
     * Get home directory
     */
    getHome() {
        if (this.isWindows()) {
            return this.env.USERPROFILE ?? this.env.HOME ?? 'C:\\Users';
        }
        return this.env.HOME ?? '/tmp';
    }
    /**
     * Get temp directory
     */
    getTempDir() {
        if (this.isWindows()) {
            return this.env.TEMP ?? this.env.TMP ?? 'C:\\Temp';
        }
        return '/tmp';
    }
    /**
     * Get path separator
     */
    getPathSeparator() {
        return this.isWindows() ? '\\' : '/';
    }
    /**
     * Get line ending
     */
    getLineEnding() {
        return this.isWindows() ? '\r\n' : '\n';
    }
    /**
     * Get all platform info
     */
    getInfo() {
        return {
            platform: this.platform,
            platformName: this.getPlatformName(),
            isMac: this.isMac(),
            isWindows: this.isWindows(),
            isLinux: this.isLinux(),
            isCI: this.isCI(),
            isDocker: this.isDocker(),
            isWSL: this.isWSL(),
            isTTY: this.isTTY(),
            isDebug: this.isDebug(),
            isProduction: this.isProduction(),
            nodeVersion: process.version,
            arch: process.arch,
            shell: this.getShellPath(),
            home: this.getHome(),
            tempDir: this.getTempDir()
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.platform = process.platform;
        this.env = process.env;
    }
}
// Global singleton
export const platformUtils = new PlatformUtils();
export default platformUtils;
//# sourceMappingURL=platform-utils.js.map