#!/usr/bin/env node
/**
 * Coding Agent - Interactive coding assistant
 */

import React from 'react';
import { render } from 'ink';
import { App } from './components/App.js';
import { GitService } from './services/GitService.js';
import { FileEditTool } from './tools/FileEditTool.js';
import { CostTracker, globalCostTracker } from './services/CostTracker.js';

// Start the TUI
console.log('🤖 Coding Agent starting...');
console.log('Available commands: /commit, /review, /doctor, /edit, /status, /help');

// Run the app
render(React.createElement(App, { gitService: new GitService(), fileEditTool: new FileEditTool() }));

// Export for use as library
export { GitService } from './services/GitService.js';
export { FileEditTool } from './tools/FileEditTool.js';
export { CostTracker, globalCostTracker } from './services/CostTracker.js';
export { CommitCommand } from './commands/commit.js';
export { ReviewCommand } from './commands/review.js';
export { DoctorCommand } from './commands/doctor.js';
export { Cursor } from './utils/Cursor.js';
export { createLSPServerManager, type LSPServerManager } from './services/lsp/LSPServerManager.js';
export { resolveMotion } from './vim/motions.js';
export { executeDelete, executeChange, executeYank, executeOperatorTextObj, type OperatorContext } from './vim/operators.js';
export { findTextObject } from './vim/textObjects.js';
export { processKey, type VimTransitionContext } from './vim/transitions.js';
export type { VimState, VimMode, Operator, TextObjScope, RecordedChange } from './vim/types.js';
export { defaultVimState, createInitialVimState } from './vim/types.js';