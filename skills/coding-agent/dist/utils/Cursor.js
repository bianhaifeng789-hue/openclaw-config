/**
 * Cursor position abstraction for Vim motions
 */
export class Cursor {
    _offset;
    _text;
    constructor(text, offset = 0) {
        this._text = text;
        this._offset = Math.max(0, Math.min(offset, text.length));
    }
    get offset() {
        return this._offset;
    }
    get text() {
        return this._text;
    }
    clone() {
        return new Cursor(this._text, this._offset);
    }
    equals(other) {
        return this._offset === other._offset && this._text === other._text;
    }
    // Basic movements
    left() {
        if (this._offset === 0)
            return this;
        return new Cursor(this._text, this._offset - 1);
    }
    right() {
        if (this._offset >= this._text.length)
            return this;
        return new Cursor(this._text, this._offset + 1);
    }
    // Line-based movements
    up() {
        const lineStart = this.getLineStart();
        const prevLineStart = this.getPreviousLineStart();
        if (prevLineStart === lineStart)
            return this;
        const col = this._offset - lineStart;
        const newOffset = Math.min(prevLineStart + col, this.getLineEndFromStart(prevLineStart));
        return new Cursor(this._text, newOffset);
    }
    down() {
        const lineStart = this.getLineStart();
        const nextLineStart = this.getNextLineStart();
        if (nextLineStart === -1 || nextLineStart >= this._text.length)
            return this;
        const col = this._offset - lineStart;
        const nextLineEnd = this.getLineEndFromStart(nextLineStart);
        const newOffset = Math.min(nextLineStart + col, nextLineEnd);
        return new Cursor(this._text, newOffset);
    }
    upLogicalLine() {
        return this.up();
    }
    downLogicalLine() {
        return this.down();
    }
    // Word movements
    nextVimWord() {
        let pos = this._offset;
        // Skip current word
        while (pos < this._text.length && this.isWordChar(this._text[pos])) {
            pos++;
        }
        // Skip whitespace
        while (pos < this._text.length && this.isWhitespace(this._text[pos])) {
            pos++;
        }
        return new Cursor(this._text, pos);
    }
    prevVimWord() {
        let pos = this._offset;
        // If at start, return
        if (pos === 0)
            return this;
        // Skip whitespace backwards
        while (pos > 0 && this.isWhitespace(this._text[pos - 1])) {
            pos--;
        }
        // Skip word backwards
        while (pos > 0 && this.isWordChar(this._text[pos - 1])) {
            pos--;
        }
        return new Cursor(this._text, pos);
    }
    endOfVimWord() {
        let pos = this._offset;
        // If already at end of word, go to next word end
        if (pos < this._text.length && !this.isWhitespace(this._text[pos]) &&
            (pos + 1 >= this._text.length || this.isWhitespace(this._text[pos + 1]))) {
            pos++;
        }
        // Skip whitespace
        while (pos < this._text.length && this.isWhitespace(this._text[pos])) {
            pos++;
        }
        // Move to end of word
        while (pos < this._text.length && !this.isWhitespace(this._text[pos]) &&
            (pos + 1 < this._text.length && !this.isWhitespace(this._text[pos + 1]))) {
            pos++;
        }
        return new Cursor(this._text, Math.min(pos, this._text.length - 1));
    }
    // Line helpers
    getLineStart() {
        let pos = this._offset;
        while (pos > 0 && this._text[pos - 1] !== '\n') {
            pos--;
        }
        return pos;
    }
    getLineEnd() {
        let pos = this._offset;
        while (pos < this._text.length && this._text[pos] !== '\n') {
            pos++;
        }
        return pos;
    }
    getPreviousLineStart() {
        const lineStart = this.getLineStart();
        if (lineStart === 0)
            return lineStart;
        let pos = lineStart - 1;
        while (pos > 0 && this._text[pos - 1] !== '\n') {
            pos--;
        }
        return pos;
    }
    getNextLineStart() {
        const lineEnd = this.getLineEnd();
        if (lineEnd >= this._text.length)
            return -1;
        return lineEnd + 1;
    }
    getLineEndFromStart(start) {
        let pos = start;
        while (pos < this._text.length && this._text[pos] !== '\n') {
            pos++;
        }
        return pos - 1; // Not including newline
    }
    // Character helpers
    isWordChar(char) {
        return /[a-zA-Z0-9_]/.test(char);
    }
    isWhitespace(char) {
        return /[\s]/.test(char);
    }
    // Special positions
    startOfLine() {
        return new Cursor(this._text, this.getLineStart());
    }
    endOfLine() {
        return new Cursor(this._text, this.getLineEnd());
    }
    startOfFile() {
        return new Cursor(this._text, 0);
    }
    endOfFile() {
        return new Cursor(this._text, this._text.length);
    }
    // Search
    findChar(char, forward) {
        if (forward) {
            for (let i = this._offset + 1; i < this._text.length; i++) {
                if (this._text[i] === char)
                    return new Cursor(this._text, i);
            }
        }
        else {
            for (let i = this._offset - 1; i >= 0; i--) {
                if (this._text[i] === char)
                    return new Cursor(this._text, i);
            }
        }
        return this;
    }
    // Update text
    withText(newText) {
        return new Cursor(newText, Math.min(this._offset, newText.length));
    }
    // Get line info
    getLineNumber() {
        let count = 1;
        for (let i = 0; i < this._offset; i++) {
            if (this._text[i] === '\n')
                count++;
        }
        return count;
    }
    getColumn() {
        return this._offset - this.getLineStart();
    }
}
//# sourceMappingURL=Cursor.js.map