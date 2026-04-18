import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createTwoFilesPatch } from 'diff';
export class FileEditTool {
    pendingEdits = new Map();
    async edit(filePath, instruction) {
        if (!existsSync(filePath)) {
            return `Error: File ${filePath} does not exist`;
        }
        try {
            const originalContent = readFileSync(filePath, 'utf-8');
            // Simulate edit - in full implementation, this would call LLM
            const newContent = this.simulateEdit(originalContent, instruction);
            const pendingEdit = {
                filePath,
                originalContent,
                newContent,
                instruction,
            };
            this.pendingEdits.set(filePath, pendingEdit);
            const diff = this.generateDiff(filePath, originalContent, newContent);
            return `Proposed changes to ${filePath}:\n\n${diff}\n\nUse /apply ${filePath} to apply or /revert ${filePath} to discard.`;
        }
        catch (error) {
            return `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
    async showDiff(filePath) {
        const pending = this.pendingEdits.get(filePath);
        if (!pending) {
            return `No pending edits for ${filePath}`;
        }
        return this.generateDiff(filePath, pending.originalContent, pending.newContent);
    }
    async apply(filePath) {
        const pending = this.pendingEdits.get(filePath);
        if (!pending) {
            return `No pending edits for ${filePath}`;
        }
        try {
            writeFileSync(filePath, pending.newContent, 'utf-8');
            this.pendingEdits.delete(filePath);
            return `Applied changes to ${filePath}`;
        }
        catch (error) {
            return `Error applying changes: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
    async revert(filePath) {
        const pending = this.pendingEdits.get(filePath);
        if (!pending) {
            return `No pending edits for ${filePath}`;
        }
        this.pendingEdits.delete(filePath);
        return `Reverted changes to ${filePath}`;
    }
    generateDiff(filePath, oldContent, newContent) {
        return createTwoFilesPatch(`a/${filePath}`, `b/${filePath}`, oldContent, newContent, 'original', 'modified');
    }
    simulateEdit(content, instruction) {
        const lines = content.split('\n');
        if (instruction.toLowerCase().includes('add comment')) {
            lines.unshift(`// Edited: ${instruction}`);
        }
        else if (instruction.toLowerCase().includes('fix')) {
            lines.push(`// TODO: ${instruction}`);
        }
        return lines.join('\n');
    }
    getPendingFiles() {
        return Array.from(this.pendingEdits.keys());
    }
}
//# sourceMappingURL=FileEditTool.js.map