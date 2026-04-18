---
name: uploads-inject
description: "Middleware to inject uploaded files information into agent context. Reads file metadata from message additional_kwargs and prepends an <uploaded_files> block with document outline, size, and usage guidance. Use when [uploads inject] is needed."
---

# Uploads Inject Skill

## Overview

When users upload files:
- **Extract metadata** (filename, size, path)
- **Generate document outline** from converted Markdown
- **Inject context** before agent execution

## File Metadata Format

```xml
<uploaded_files>
The following files were uploaded in this message:

- report.pdf (245.3 KB)
  Path: /mnt/user-data/uploads/report.pdf
  Document outline (use `read_file` with line ranges to read sections):
    L1: Executive Summary
    L15: Introduction
    L45: Analysis
    L78: Conclusions
    ... (showing first 5 headings)

To work with these files:
- Read from the file first — use the outline line numbers
- Use `grep` to search for keywords
- Use `glob` to find files by name pattern
- Only fall back to web search if content is insufficient
</uploaded_files>
```

## Outline Extraction

1. **Converted Markdown** - PDF → MD via pymupdf4llm or MarkItDown
2. **Heading detection** - Extract `{title, line}` pairs
3. **Preview fallback** - First 5 non-empty lines if no headings

## Historical Files

- Scan uploads directory for previous files
- Exclude new filenames from historical list
- Attach outline to historical files too

## Integration Points

1. **before_agent** - Inject before execution
2. **Prepend to HumanMessage** - Add context to user message
3. **Preserve additional_kwargs** - Keep frontend metadata

## State Schema

```javascript
{
  uploaded_files: [
    {
      filename: "report.pdf",
      size: 245000,
      path: "/mnt/user-data/uploads/report.pdf",
      extension: ".pdf",
      outline: [{title: "Executive Summary", line: 1}],
      outline_preview: ["First line of document..."]
    }
  ]
}
```

## Implementation Script

See `impl/bin/uploads-injector.js` for Node.js implementation.

## OpenClaw Integration

Integrates with:
- File upload handling
- Document processing pipeline
- Context window management

## Status

- ✅ Skill documentation created
- 🔜 Implementation script pending