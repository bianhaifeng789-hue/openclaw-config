import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createTwoFilesPatch } from 'diff';
import type { PendingEdit } from '../types.js';

export class FileEditTool {
  private pendingEdits: Map<string, PendingEdit> = new Map();

  async edit(filePath: string, instruction: string): Promise<string> {
    if (!existsSync(filePath)) {
      return `Error: File ${filePath} does not exist`;
    }

    try {
      const originalContent = readFileSync(filePath, 'utf-8');
      
      // Simulate edit - in full implementation, this would call LLM
      const newContent = this.simulateEdit(originalContent, instruction);

      const pendingEdit: PendingEdit = {
        filePath,
        originalContent,
        newContent,
        instruction,
      };

      this.pendingEdits.set(filePath, pendingEdit);

      const diff = this.generateDiff(filePath, originalContent, newContent);
      
      return `Proposed changes to ${filePath}:\n\n${diff}\n\nUse /apply ${filePath} to apply or /revert ${filePath} to discard.`;
    } catch (error) {
      return `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async showDiff(filePath: string): Promise<string> {
    const pending = this.pendingEdits.get(filePath);
    if (!pending) {
      return `No pending edits for ${filePath}`;
    }

    return this.generateDiff(filePath, pending.originalContent, pending.newContent);
  }

  async apply(filePath: string): Promise<string> {
    const pending = this.pendingEdits.get(filePath);
    if (!pending) {
      return `No pending edits for ${filePath}`;
    }

    try {
      writeFileSync(filePath, pending.newContent, 'utf-8');
      this.pendingEdits.delete(filePath);
      return `Applied changes to ${filePath}`;
    } catch (error) {
      return `Error applying changes: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async revert(filePath: string): Promise<string> {
    const pending = this.pendingEdits.get(filePath);
    if (!pending) {
      return `No pending edits for ${filePath}`;
    }

    this.pendingEdits.delete(filePath);
    return `Reverted changes to ${filePath}`;
  }

  private generateDiff(filePath: string, oldContent: string, newContent: string): string {
    return createTwoFilesPatch(
      `a/${filePath}`,
      `b/${filePath}`,
      oldContent,
      newContent,
      'original',
      'modified'
    );
  }

  private simulateEdit(content: string, instruction: string): string {
    const lines = content.split('\n');
    
    if (instruction.toLowerCase().includes('add comment')) {
      lines.unshift(`// Edited: ${instruction}`);
    } else if (instruction.toLowerCase().includes('fix')) {
      lines.push(`// TODO: ${instruction}`);
    }
    
    return lines.join('\n');
  }

  getPendingFiles(): string[] {
    return Array.from(this.pendingEdits.keys());
  }
}