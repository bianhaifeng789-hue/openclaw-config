export declare class FileEditTool {
    private pendingEdits;
    edit(filePath: string, instruction: string): Promise<string>;
    showDiff(filePath: string): Promise<string>;
    apply(filePath: string): Promise<string>;
    revert(filePath: string): Promise<string>;
    private generateDiff;
    private simulateEdit;
    getPendingFiles(): string[];
}
//# sourceMappingURL=FileEditTool.d.ts.map