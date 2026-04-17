#!/usr/bin/env node
/**
 * Magic Docs Service - 基于 Claude Code MagicDocs
 * 
 * Magic Docs 检测：
 *   - 扫描 # MAGIC DOC: 标记
 *   - 自动文档生成
 *   - 文档状态追踪
 * 
 * Usage:
 *   node magic-docs.js scan [path]
 *   node magic-docs.js list
 *   node magic-docs.js generate <file>
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'magic-docs');
const STATE_FILE = path.join(STATE_DIR, 'magic-docs-state.json');

const MAGIC_DOC_MARKER = '# MAGIC DOC:';
const MAGIC_DOC_IGNORE = ['node_modules', '.git', 'dist', '.openclaw'];

function loadMagicDocsState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      markersFound: [],
      lastScanAt: null,
      totalScans: 0,
      generatedDocs: []
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {
      markersFound: [],
      lastScanAt: null,
      totalScans: 0,
      generatedDocs: []
    };
  }
}

function saveMagicDocsState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function scanForMagicDocs(scanPath = WORKSPACE) {
  const markers = [];
  
  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(scanPath, fullPath);
        
        // Skip ignored directories
        if (MAGIC_DOC_IGNORE.some(ignore => relativePath.includes(ignore))) {
          continue;
        }
        
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && isTextFile(entry.name)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              
              if (line.includes(MAGIC_DOC_MARKER)) {
                const markerText = line.split(MAGIC_DOC_MARKER)[1]?.trim() || '';
                
                markers.push({
                  file: relativePath,
                  line: i + 1,
                  markerText,
                  fullPath,
                  timestamp: Date.now()
                });
              }
            }
          } catch {
            // Ignore unreadable files
          }
        }
      }
    } catch {
      // Ignore permission errors
    }
  }
  
  walkDir(scanPath);
  
  // Update state
  const state = loadMagicDocsState();
  state.markersFound = markers;
  state.lastScanAt = Date.now();
  state.totalScans++;
  saveMagicDocsState(state);
  
  return {
    scanPath,
    markersFound: markers.length,
    markers,
    lastScanAt: state.lastScanAt,
    scanCount: state.totalScans
  };
}

function isTextFile(filename) {
  const textExtensions = [
    '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt',
    '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp',
    '.sh', '.bash', '.zsh', '.yaml', '.yml', '.xml',
    '.html', '.css', '.scss', '.less'
  ];
  
  const ext = path.extname(filename).toLowerCase();
  return textExtensions.includes(ext);
}

function listMagicDocs() {
  const state = loadMagicDocsState();
  
  return {
    markers: state.markersFound,
    count: state.markersFound.length,
    lastScanAt: state.lastScanAt,
    files: state.markersFound.map(m => m.file)
  };
}

function generateDocFromMarker(marker) {
  const state = loadMagicDocsState();
  
  // Find the marker
  const foundMarker = state.markersFound.find(m => 
    m.file === marker.file && m.line === marker.line
  );
  
  if (!foundMarker) {
    return {
      generated: false,
      error: 'marker not found',
      marker
    };
  }
  
  // Read the file content
  try {
    const content = fs.readFileSync(foundMarker.fullPath, 'utf8');
    const lines = content.split('\n');
    
    // Extract context around the marker
    const startLine = Math.max(0, foundMarker.line - 5);
    const endLine = Math.min(lines.length, foundMarker.line + 20);
    
    const context = lines.slice(startLine, endLine).join('\n');
    
    // Generate documentation
    const doc = {
      sourceFile: foundMarker.file,
      sourceLine: foundMarker.line,
      markerText: foundMarker.markerText,
      context,
      generatedAt: Date.now(),
      docId: `doc_${Date.now()}_${foundMarker.file.replace(/[^a-zA-Z0-9]/g, '_')}`
    };
    
    state.generatedDocs.push(doc);
    saveMagicDocsState(state);
    
    return {
      generated: true,
      doc,
      marker: foundMarker
    };
  } catch (error) {
    return {
      generated: false,
      error: error.message,
      marker: foundMarker
    };
  }
}

function getGeneratedDocs(limit = 20) {
  const state = loadMagicDocsState();
  
  return {
    docs: state.generatedDocs.slice(-limit),
    total: state.generatedDocs.length,
    lastGenerated: state.generatedDocs.length > 0 
      ? state.generatedDocs[state.generatedDocs.length - 1] 
      : null
  };
}

function getMagicDocsStats() {
  const state = loadMagicDocsState();
  
  const filesWithMarkers = new Set(state.markersFound.map(m => m.file));
  
  return {
    totalScans: state.totalScans,
    totalMarkers: state.markersFound.length,
    filesWithMarkers: filesWithMarkers.size,
    generatedDocs: state.generatedDocs.length,
    lastScanAt: state.lastScanAt
  };
}

function clearMagicDocsState() {
  const state = {
    markersFound: [],
    lastScanAt: null,
    totalScans: 0,
    generatedDocs: []
  };
  
  saveMagicDocsState(state);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'scan':
      const scanPath = args[1] || WORKSPACE;
      console.log(JSON.stringify(scanForMagicDocs(scanPath), null, 2));
      break;
    case 'list':
      console.log(JSON.stringify(listMagicDocs(), null, 2));
      break;
    case 'generate':
      const genFile = args[1];
      const genLine = parseInt(args[2], 10);
      if (!genFile || !genLine) {
        console.log('Usage: node magic-docs.js generate <file> <line>');
        process.exit(1);
      }
      console.log(JSON.stringify(generateDocFromMarker({ file: genFile, line: genLine }), null, 2));
      break;
    case 'generated':
      const genLimit = parseInt(args[1], 10) || 20;
      console.log(JSON.stringify(getGeneratedDocs(genLimit), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getMagicDocsStats(), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearMagicDocsState(), null, 2));
      break;
    default:
      console.log('Usage: node magic-docs.js [scan|list|generate|generated|stats|clear]');
      process.exit(1);
  }
}

main();

module.exports = {
  scanForMagicDocs,
  listMagicDocs,
  generateDocFromMarker,
  getGeneratedDocs,
  getMagicDocsStats,
  MAGIC_DOC_MARKER
};