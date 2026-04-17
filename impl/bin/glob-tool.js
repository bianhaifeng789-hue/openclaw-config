#!/usr/bin/env node
/**
 * Glob Tool - 基于 Claude Code GlobTool
 * 
 * 文件模式匹配：
 *   - Glob 模式搜索
 *   - 文件过滤
 *   - 目录遍历
 * 
 * Usage:
 *   node glob-tool.js search <pattern> [path]
 *   node glob-tool.js list <path> [pattern]
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');

const GLOB_TOOL_NAME = 'Glob';

function globToRegex(pattern) {
  // Convert glob pattern to regex
  let regex = pattern
    .replace(/\*\*/g, '.*')      // ** matches any path
    .replace(/\*/g, '[^/]*')     // * matches any filename (no path separator)
    .replace(/\?/g, '.')         // ? matches single character
    .replace(/\./g, '\\.')       // Escape dots
    .replace(/\//g, '/');
  
  return new RegExp(`^${regex}$`);
}

function matchGlob(pattern, filePath) {
  const regex = globToRegex(pattern);
  return regex.test(filePath);
}

function searchFiles(pattern, searchPath = WORKSPACE, options = {}) {
  const results = [];
  const maxResults = options.maxResults || 1000;
  const ignorePatterns = options.ignore || ['node_modules', '.git', 'dist'];
  
  function walkDir(dir, depth = 0) {
    if (depth > 10) return; // Max depth
    if (results.length >= maxResults) return;
    
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
          walkDir(fullPath, depth + 1);
        } else if (entry.isFile()) {
          if (matchGlob(pattern, relativePath) || matchGlob(pattern, entry.name)) {
            results.push({
              path: fullPath,
              relativePath,
              name: entry.name,
              extension: path.extname(entry.name),
              size: fs.statSync(fullPath).size,
              mtime: fs.statSync(fullPath).mtimeMs
            });
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

function listDirectory(dirPath, pattern = '*') {
  if (!fs.existsSync(dirPath)) {
    return {
      error: 'directory not found',
      path: dirPath
    };
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  const results = entries
    .filter(entry => matchGlob(pattern, entry.name))
    .map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, entry.name),
      extension: entry.isFile() ? path.extname(entry.name) : null
    }));
  
  return {
    path: dirPath,
    pattern,
    results,
    count: results.length,
    directories: results.filter(r => r.type === 'directory').length,
    files: results.filter(r => r.type === 'file').length
  };
}

function getFileStats(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      error: 'file not found',
      path: filePath
    };
  }
  
  const stat = fs.statSync(filePath);
  
  return {
    path: filePath,
    exists: true,
    size: stat.size,
    isDirectory: stat.isDirectory(),
    isFile: stat.isFile(),
    mtime: stat.mtimeMs,
    ctime: stat.ctimeMs,
    extension: path.extname(filePath),
    basename: path.basename(filePath),
    dirname: path.dirname(filePath)
  };
}

function findSimilarFiles(filePath, searchPath = WORKSPACE) {
  const basename = path.basename(filePath);
  const extension = path.extname(filePath);
  
  const pattern = extension ? `*${extension}` : basename;
  
  return searchFiles(pattern, searchPath, { maxResults: 20 });
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'search':
      const pattern = args[1] || '*';
      const searchPath = args[2] || WORKSPACE;
      console.log(JSON.stringify(searchFiles(pattern, searchPath), null, 2));
      break;
    case 'list':
      const listPath = args[1] || WORKSPACE;
      const listPattern = args[2] || '*';
      console.log(JSON.stringify(listDirectory(listPath, listPattern), null, 2));
      break;
    case 'stat':
      const statPath = args[1];
      if (!statPath) {
        console.log('Usage: node glob-tool.js stat <filePath>');
        process.exit(1);
      }
      console.log(JSON.stringify(getFileStats(statPath), null, 2));
      break;
    case 'similar':
      const similarPath = args[1];
      if (!similarPath) {
        console.log('Usage: node glob-tool.js similar <filePath>');
        process.exit(1);
      }
      console.log(JSON.stringify(findSimilarFiles(similarPath), null, 2));
      break;
    default:
      console.log('Usage: node glob-tool.js [search|list|stat|similar]');
      process.exit(1);
  }
}

main();

module.exports = {
  searchFiles,
  listDirectory,
  getFileStats,
  matchGlob,
  globToRegex,
  GLOB_TOOL_NAME
};