/**
 * Cursor position abstraction for Vim motions
 */
export declare class Cursor {
    private _offset;
    private _text;
    constructor(text: string, offset?: number);
    get offset(): number;
    get text(): string;
    clone(): Cursor;
    equals(other: Cursor): boolean;
    left(): Cursor;
    right(): Cursor;
    up(): Cursor;
    down(): Cursor;
    upLogicalLine(): Cursor;
    downLogicalLine(): Cursor;
    nextVimWord(): Cursor;
    prevVimWord(): Cursor;
    endOfVimWord(): Cursor;
    getLineStart(): number;
    getLineEnd(): number;
    getPreviousLineStart(): number;
    getNextLineStart(): number;
    getLineEndFromStart(start: number): number;
    private isWordChar;
    private isWhitespace;
    startOfLine(): Cursor;
    endOfLine(): Cursor;
    startOfFile(): Cursor;
    endOfFile(): Cursor;
    findChar(char: string, forward: boolean): Cursor;
    withText(newText: string): Cursor;
    getLineNumber(): number;
    getColumn(): number;
}
//# sourceMappingURL=Cursor.d.ts.map