/**
 * Vim Types - Simplified for coding-agent
 */
export const defaultVimState = {
    mode: 'normal',
    count: 1,
    pendingOperator: null,
    pendingTextObjScope: null,
    visualStart: null,
};
export function createInitialVimState() {
    return defaultVimState;
}
//# sourceMappingURL=types.js.map