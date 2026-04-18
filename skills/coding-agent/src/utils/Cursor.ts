/**
 * Cursor position abstraction for Vim motions
 */

export class Cursor {
  private _offset: number;
  private _text: string;

  constructor(text: string, offset: number = 0) {
    this._text = text;
    this._offset = Math.max(0, Math.min(offset, text.length));
  }

  get offset(): number {
    return this._offset;
  }

  get text(): string {
    return this._text;
  }

  clone(): Cursor {
    return new Cursor(this._text, this._offset);
  }

  equals(other: Cursor): boolean {
    return this._offset === other._offset && this._text === other._text;
  }

  // Basic movements
  left(): Cursor {
    if (this._offset === 0) return this;
    return new Cursor(this._text, this._offset - 1);
  }

  right(): Cursor {
    if (this._offset >= this._text.length) return this;
    return new Cursor(this._text, this._offset + 1);
  }

  // Line-based movements
  up(): Cursor {
    const lineStart = this.getLineStart();
    const prevLineStart = this.getPreviousLineStart();
    if (prevLineStart === lineStart) return this;
    
    const col = this._offset - lineStart;
    const newOffset = Math.min(prevLineStart + col, this.getLineEndFromStart(prevLineStart));
    return new Cursor(this._text, newOffset);
  }

  down(): Cursor {
    const lineStart = this.getLineStart();
    const nextLineStart = this.getNextLineStart();
    if (nextLineStart === -1 || nextLineStart >= this._text.length) return this;
    
    const col = this._offset - lineStart;
    const nextLineEnd = this.getLineEndFromStart(nextLineStart);
    const newOffset = Math.min(nextLineStart + col, nextLineEnd);
    return new Cursor(this._text, newOffset);
  }

  upLogicalLine(): Cursor {
    return this.up();
  }

  downLogicalLine(): Cursor {
    return this.down();
  }

  // Word movements
  nextVimWord(): Cursor {
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

  prevVimWord(): Cursor {
    let pos = this._offset;
    
    // If at start, return
    if (pos === 0) return this;
    
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

  endOfVimWord(): Cursor {
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
  getLineStart(): number {
    let pos = this._offset;
    while (pos > 0 && this._text[pos - 1] !== '\n') {
      pos--;
    }
    return pos;
  }

  getLineEnd(): number {
    let pos = this._offset;
    while (pos < this._text.length && this._text[pos] !== '\n') {
      pos++;
    }
    return pos;
  }

  getPreviousLineStart(): number {
    const lineStart = this.getLineStart();
    if (lineStart === 0) return lineStart;
    
    let pos = lineStart - 1;
    while (pos > 0 && this._text[pos - 1] !== '\n') {
      pos--;
    }
    return pos;
  }

  getNextLineStart(): number {
    const lineEnd = this.getLineEnd();
    if (lineEnd >= this._text.length) return -1;
    return lineEnd + 1;
  }

  getLineEndFromStart(start: number): number {
    let pos = start;
    while (pos < this._text.length && this._text[pos] !== '\n') {
      pos++;
    }
    return pos - 1; // Not including newline
  }

  // Character helpers
  private isWordChar(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }

  private isWhitespace(char: string): boolean {
    return /[\s]/.test(char);
  }

  // Special positions
  startOfLine(): Cursor {
    return new Cursor(this._text, this.getLineStart());
  }

  endOfLine(): Cursor {
    return new Cursor(this._text, this.getLineEnd());
  }

  startOfFile(): Cursor {
    return new Cursor(this._text, 0);
  }

  endOfFile(): Cursor {
    return new Cursor(this._text, this._text.length);
  }

  // Search
  findChar(char: string, forward: boolean): Cursor {
    if (forward) {
      for (let i = this._offset + 1; i < this._text.length; i++) {
        if (this._text[i] === char) return new Cursor(this._text, i);
      }
    } else {
      for (let i = this._offset - 1; i >= 0; i--) {
        if (this._text[i] === char) return new Cursor(this._text, i);
      }
    }
    return this;
  }

  // Update text
  withText(newText: string): Cursor {
    return new Cursor(newText, Math.min(this._offset, newText.length));
  }

  // Get line info
  getLineNumber(): number {
    let count = 1;
    for (let i = 0; i < this._offset; i++) {
      if (this._text[i] === '\n') count++;
    }
    return count;
  }

  getColumn(): number {
    return this._offset - this.getLineStart();
  }
}