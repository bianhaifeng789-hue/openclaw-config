// @ts-nocheck
class TeammateInheritedFlags {
    config = {
        passThrough: [
            '--model',
            '--temperature',
            '--max-tokens',
            '--debug',
            '--verbose',
            '--reasoning',
            '--auto'
        ],
        override: new Map([
            // Teammate-specific overrides
            ['--auto', 'true'], // Teammates inherit auto mode
            ['--reasoning', 'true'] // Teammates always use reasoning
        ]),
        filter: [
            // Flags not passed to teammate
            '--help',
            '--version',
            '--status',
            '--init'
        ]
    };
    /**
     * Get inherited flags for teammate process
     */
    getInheritedFlags() {
        const flags = [];
        // Get current process argv
        const currentFlags = this.parseProcessArgv();
        // Apply pass-through
        for (const flag of this.config.passThrough) {
            const value = currentFlags.get(flag);
            if (value !== undefined) {
                // Check override
                const overrideValue = this.config.override.get(flag);
                if (overrideValue !== undefined) {
                    flags.push(flag, overrideValue);
                }
                else {
                    flags.push(flag, value);
                }
            }
        }
        // Add mandatory teammate flags
        flags.push('--teammate');
        flags.push('--no-prompt'); // Teammates don't prompt user
        return flags;
    }
    /**
     * Parse process.argv into flag map
     */
    parseProcessArgv() {
        const flags = new Map();
        const argv = process.argv.slice(2); // Skip node and script
        for (let i = 0; i < argv.length; i++) {
            const arg = argv[i];
            if (arg.startsWith('--')) {
                // Flag with value
                if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
                    flags.set(arg, argv[i + 1]);
                    i++; // Skip value
                }
                else {
                    // Boolean flag
                    flags.set(arg, 'true');
                }
            }
        }
        return flags;
    }
    /**
     * Add pass-through flag
     */
    addPassThrough(flag) {
        this.config.passThrough.push(flag);
    }
    /**
     * Add override for flag
     */
    addOverride(flag, value) {
        this.config.override.set(flag, value);
    }
    /**
     * Add filter flag
     */
    addFilter(flag) {
        this.config.filter.push(flag);
    }
    /**
     * Check if flag should be passed
     */
    shouldPass(flag) {
        return this.config.passThrough.includes(flag) && !this.config.filter.includes(flag);
    }
    /**
     * Get override value
     */
    getOverride(flag) {
        return this.config.override.get(flag);
    }
    /**
     * Get all config
     */
    getConfig() {
        return {
            passThrough: [...this.config.passThrough],
            override: new Map(this.config.override),
            filter: [...this.config.filter]
        };
    }
    /**
     * Set config
     */
    setConfig(config) {
        if (config.passThrough)
            this.config.passThrough = config.passThrough;
        if (config.override)
            this.config.override = config.override;
        if (config.filter)
            this.config.filter = config.filter;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.config = {
            passThrough: [
                '--model',
                '--temperature',
                '--max-tokens',
                '--debug',
                '--verbose',
                '--reasoning',
                '--auto'
            ],
            override: new Map([
                ['--auto', 'true'],
                ['--reasoning', 'true']
            ]),
            filter: [
                '--help',
                '--version',
                '--status',
                '--init'
            ]
        };
    }
}
// Global singleton
export const teammateInheritedFlags = new TeammateInheritedFlags();
export default teammateInheritedFlags;
//# sourceMappingURL=teammate-inherited-flags.js.map