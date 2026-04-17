// @ts-nocheck
class SettingsEditValidator {
    /**
     * Validate settings before edit
     */
    validateBefore(settings) {
        const errors = [];
        const warnings = [];
        for (const [key, value] of Object.entries(settings)) {
            // Check for dangerous keys
            if (this.isDangerousKey(key)) {
                errors.push({ key, message: 'Cannot modify protected setting' });
            }
            // Check for deprecated keys
            if (this.isDeprecatedKey(key)) {
                warnings.push({ key, message: 'Setting is deprecated' });
            }
            // Type validation
            const typeError = this.validateType(key, value);
            if (typeError) {
                errors.push({ key, message: typeError });
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate settings after edit
     */
    validateAfter(before, after) {
        const errors = [];
        const warnings = [];
        // Check for destructive changes
        for (const [key, beforeValue] of Object.entries(before)) {
            const afterValue = after[key];
            // Key was deleted
            if (afterValue === undefined && beforeValue !== undefined) {
                warnings.push({ key, message: 'Key was removed' });
            }
            // Value changed type
            if (afterValue !== undefined && typeof beforeValue !== typeof afterValue) {
                errors.push({ key, message: `Type changed from ${typeof beforeValue} to ${typeof afterValue}` });
            }
        }
        // Check for new keys
        for (const [key] of Object.entries(after)) {
            if (before[key] === undefined) {
                warnings.push({ key, message: 'New key added' });
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate edit with before/after context
     */
    validateEdit(context) {
        // Validate before
        const beforeResult = this.validateBefore(context.before);
        if (!beforeResult.valid) {
            return beforeResult;
        }
        // Validate after
        const afterResult = this.validateAfter(context.before, context.after);
        // Rollup errors
        const allErrors = [...beforeResult.errors, ...afterResult.errors];
        const allWarnings = [...beforeResult.warnings, ...afterResult.warnings];
        return {
            valid: allErrors.length === 0,
            errors: allErrors,
            warnings: allWarnings
        };
    }
    /**
     * Check if key is dangerous/protected
     */
    isDangerousKey(key) {
        const dangerousKeys = [
            'api_key',
            'secret',
            'password',
            'token',
            'auth',
            'permission',
            'sandbox'
        ];
        return dangerousKeys.some(dk => key.toLowerCase().includes(dk));
    }
    /**
     * Check if key is deprecated
     */
    isDeprecatedKey(key) {
        const deprecatedKeys = [
            'old_api_endpoint',
            'legacy_mode'
        ];
        return deprecatedKeys.includes(key);
    }
    /**
     * Validate type for key
     */
    validateType(key, value) {
        // String keys
        if (['model', 'provider', 'endpoint'].includes(key)) {
            if (typeof value !== 'string') {
                return `Expected string, got ${typeof value}`;
            }
        }
        // Number keys
        if (['timeout', 'max_tokens', 'temperature'].includes(key)) {
            if (typeof value !== 'number') {
                return `Expected number, got ${typeof value}`;
            }
        }
        // Boolean keys
        if (['enabled', 'debug', 'auto_mode'].includes(key)) {
            if (typeof value !== 'boolean') {
                return `Expected boolean, got ${typeof value}`;
            }
        }
        return null;
    }
    /**
     * Suppress internal write echo
     * Prevents echoing internal writes back to user
     */
    suppressInternalWriteEcho(key, source) {
        // Internal writes from system shouldn't echo
        if (source === 'internal' || source === 'system') {
            return true;
        }
        // Certain keys shouldn't echo
        const noEchoKeys = ['api_key', 'secret', 'password', 'token'];
        return noEchoKeys.some(nk => key.toLowerCase().includes(nk));
    }
    /**
     * Reset for testing
     */
    _reset() {
        // No state to reset
    }
}
// Global singleton
export const settingsEditValidator = new SettingsEditValidator();
export default settingsEditValidator;
//# sourceMappingURL=settings-edit-validate.js.map