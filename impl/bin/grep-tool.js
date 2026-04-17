#!/usr/bin/env node
/**
 * Grep Tool - 基于 Claude Code GrepTool
 * 
 * 文件内容搜索：
 *   - 正则表达式搜索
 *   - 多文件匹配
 *   - 上下文显示
 * 
 * Usage:
 *   node grep-tool.js search <pattern> [path] [context]
 *   node grep-tool.js files <pattern> [path]
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');

const GREP_TOOL_NAME = 'Grep';

function grepSearch(pattern, searchPath = WORKSPACE, options = {}) {
  const results = [];
  const maxResults = options.maxResults || 100;
  const contextLines = options.context || 0;
  const ignorePatterns = options.ignore || ['node_modules', '.git', 'dist', '.openclaw'];
  const filePattern = options.filePattern || null;
  
  let regex;
  try {
    regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
  } catch (e) {
    return {
      error: 'invalid regex pattern',
      pattern,
      message: e.message
    };
  }
  
  function grepFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length && results.length < maxResults; i++) {
        const line = lines[i];
        
        if (regex.test(line)) {
          const result = {
            file: path.relative(searchPath, filePath),
            line: i + 1,
            content: line.trim(),
            match: line.match(regex)[0]
          };
          
          // Add context
          if (contextLines > 0) {
            result.context = {
              before: lines.slice(Math.max(0, i - contextLines), i).map(l => l.trim()),
              after: lines.slice(i + 1, i + 1 + contextLines).map(l => l.trim())
            };
          }
          
          results.push(result);
        }
      }
    } catch (e) {
      // Ignore unreadable files
    }
  }
  
  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(searchPath, fullPath);
        
        // Skip ignored patterns
        if (ignorePatterns.some(ignore => relativePath.includes(ignore))) {
          continue;
        }
        
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile()) {
          // Filter by file pattern if specified
          if (filePattern && !entry.name.match(new RegExp(filePattern))) {
            continue;
          }
          
          // Only search text files
          if (isTextFile(entry.name)) {
            grepFile(fullPath);
          }
        }
      }
    } catch (e) {
      // Ignore permission errors
    }
  }
  
  walkDir(searchPath);
  
  return {
    pattern,
    searchPath,
    results,
    count: results.length,
    truncated: results.length >= maxResults,
    options
  };
}

function isTextFile(filename) {
  const textExtensions = [
    '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt',
    '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp',
    '.sh', '.bash', '.zsh', '.yaml', '.yml', '.xml',
    '.html', '.css', '.scss', '.less', '.vue', '.svelte',
    '.env', '.config', '.conf', '.ini', '.cfg'
  ];
  
  const ext = path.extname(filename).toLowerCase();
  return textExtensions.includes(ext) || filename.startsWith('.');
}

function findFilesWithPattern(pattern, searchPath = WORKSPACE) {
  const files = [];
  const ignorePatterns = ['node_modules', '.git', 'dist'];
  
  let regex;
  try {
    regex = new RegExp(pattern, 'gi');
  } catch (e) {
    return {
      error: 'invalid pattern',
      pattern
    };
  }
  
  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(searchPath, fullPath);
        
        if (ignorePatterns.some(ignore => relativePath.includes(ignore))) {
          continue;
        }
        
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && isTextFile(entry.name)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (regex.test(content)) {
              files.push({
                file: relativePath,
                matches: (content.match(regex) || []).length,
                size: content.length
              });
            }
          } catch {
            // Ignore
          }
        }
      }
    } catch {
      // Ignore
    }
  }
  
  walkDir(searchPath);
  
  // Sort by match count
  files.sort((a, b) => b.matches - a.matches);
  
  return {
    pattern,
    searchPath,
    files,
    count: files.length,
    totalMatches: files.reduce((sum, f) => sum + f.matches, 0)
  };
}

function countOccurrences(pattern, filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = new RegExp(pattern, 'gi');
    const matches = content.match(regex) || [];
    
    return {
      file: filePath,
      pattern,
      count: matches.length,
      matches: matches.slice(0, 10)
    };
  } catch (e) {
    return {
      file: filePath,
      error: e.message
    };
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'search';
  
  switch (command) {
    case 'search':
      const pattern = args[1];
      const searchPath = args[2] || WORKSPACE;
      const context = parseInt(args[3], 10) || 0;
      if (!pattern) {
        console.log('Usage: node grep-tool.js search <pattern> [path] [context]');
        process.exit(1);
      }
      console.log(JSON.stringify(grepSearch(pattern, searchPath, { context }), null, 2));
      break;
    case 'files':
      const filesPattern = args[1];
      const filesPath = args[2] || WORKSPACE;
      if (!filesPattern) {
        console.log('Usage: node grep-tool.js files <pattern> [path]');
        process.exit(1);
      }
      console.log(JSON.stringify(findFilesWithPattern(filesPattern, filesPath), null, 2));
      break;
    case 'count':
      const countPattern = args[1];
      const countFile = args[2];
      if (!countPattern || !countFile) {
        console.log('Usage: node grep-tool.js count <pattern> <file>');
        process.exit(1);
      }
      console.log(JSON.stringify(countOccurrences(countPattern, countFile), null, 2));
      break;
    default:
      console.log('Usage: node grep-tool.js [search|files|count]');
      process.exit(1);
  }
}

main();

module.exports = {
  grepSearch,
  findFilesWithPattern,
  countOccurrences,
  isTextFile,
  GREP_TOOL_NAME
};