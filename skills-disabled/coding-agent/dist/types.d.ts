export interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    staged: string[];
    unstaged: string[];
    untracked: string[];
}
export interface CommitInfo {
    hash: string;
    message: string;
    author: string;
    date: string;
}
export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    type?: 'text' | 'tool' | 'error';
}
export interface FileEditInput {
    file_path: string;
    old_string: string;
    new_string: string;
    replace_all?: boolean;
}
export interface PendingEdit {
    filePath: string;
    originalContent: string;
    newContent: string;
    instruction: string;
}
//# sourceMappingURL=types.d.ts.map