#!/usr/bin/env node
/**
 * Web Fetch Tool - 基于 Claude Code WebFetchTool
 * 
 * Web 内容抓取：
 *   - 抓取网页内容
 *   - 提取结构化信息
 *   - 支持多种格式
 * 
 * Usage:
 *   node web-fetch-tool.js fetch <url> [format]
 *   node web-fetch-tool.js extract <url> <selector>
 *   node web-fetch-tool.js history
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'web-fetch');
const HISTORY_FILE = path.join(STATE_DIR, 'fetch-history.json');

const WEB_FETCH_TOOL_NAME = 'WebFetch';

function loadFetchHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return { fetches: [], totalFetches: 0 };
  }
  
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return { fetches: [], totalFetches: 0 };
  }
}

function saveFetchHistory(history) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function fetchUrl(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const request = client.get(url, {
      timeout,
      headers: {
        'User-Agent': 'OpenClaw/2026.4 WebFetchTool'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', chunk => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: data,
          size: data.length
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function performFetch(url, format = 'text') {
  try {
    const response = await fetchUrl(url);
    
    let content = response.body;
    
    // Format conversion
    if (format === 'json') {
      try {
        content = JSON.parse(response.body);
      } catch {
        content = { raw: response.body };
      }
    }
    
    const fetchRecord = {
      id: `fetch_${Date.now()}`,
      url,
      format,
      status: response.status,
      size: response.size,
      contentType: response.headers['content-type'],
      fetchedAt: Date.now()
    };
    
    // Add to history
    const history = loadFetchHistory();
    history.fetches.push(fetchRecord);
    history.totalFetches++;
    
    // Keep only last 50 fetches
    if (history.fetches.length > 50) {
      history.fetches = history.fetches.slice(-50);
    }
    
    saveFetchHistory(history);
    
    return {
      success: true,
      fetch: fetchRecord,
      content: content.slice(0, 5000), // Truncate for display
      fullSize: content.length,
      note: 'Content truncated for display'
    };
  } catch (error) {
    return {
      success: false,
      url,
      error: error.message
    };
  }
}

async function extractFromUrl(url, selector) {
  try {
    const response = await fetchUrl(url);
    
    // Simple extraction (would use proper HTML parser in real implementation)
    const html = response.body;
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)</title>/i);
    const title = titleMatch ? titleMatch[1] : 'No title';
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"[^>]*>/i);
    const description = descMatch ? descMatch[1] : '';
    
    // Extract headings
    const headings = html.match(/<h[1-6][^>]*>([^<]+)</h[1-6]>/gi) || [];
    
    return {
      success: true,
      url,
      extracted: {
        title,
        description,
        headings: headings.map(h => h.replace(/<[^>]+>/g, '').trim())
      },
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      url,
      error: error.message
    };
  }
}

function getFetchHistory(limit = 20) {
  const history = loadFetchHistory();
  
  return {
    fetches: history.fetches.slice(-limit),
    total: history.fetches.length,
    recentUrls: history.fetches.slice(-10).map(f => f.url)
  };
}

function getFetchStats() {
  const history = loadFetchHistory();
  
  const avgSize = history.fetches.length > 0
    ? history.fetches.reduce((sum, f) => sum + f.size, 0) / history.fetches.length
    : 0;
  
  const successRate = history.fetches.length > 0
    ? history.fetches.filter(f => f.status >= 200 && f.status < 300).length / history.fetches.length * 100
    : 0;
  
  return {
    totalFetches: history.totalFetches,
    avgSize: Math.round(avgSize),
    successRate: successRate.toFixed(1) + '%',
    recentCount: history.fetches.slice(-10).length
  };
}

function clearFetchHistory() {
  const history = { fetches: [], totalFetches: 0 };
  saveFetchHistory(history);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'history';
  
  switch (command) {
    case 'fetch':
      const url = args[1];
      const format = args[2] || 'text';
      if (!url) {
        console.log('Usage: node web-fetch-tool.js fetch <url> [format]');
        process.exit(1);
      }
      performFetch(url, format).then(result => {
        console.log(JSON.stringify(result, null, 2));
      });
      break;
    case 'extract':
      const extractUrl = args[1];
      const selector = args[2] || 'title';
      if (!extractUrl) {
        console.log('Usage: node web-fetch-tool.js extract <url> [selector]');
        process.exit(1);
      }
      extractFromUrl(extractUrl, selector).then(result => {
        console.log(JSON.stringify(result, null, 2));
      });
      break;
    case 'history':
      const limit = parseInt(args[1], 10) || 20;
      console.log(JSON.stringify(getFetchHistory(limit), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getFetchStats(), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearFetchHistory(), null, 2));
      break;
    default:
      console.log('Usage: node web-fetch-tool.js [fetch|extract|history|stats|clear]');
      process.exit(1);
  }
}

main();

module.exports = {
  performFetch,
  extractFromUrl,
  getFetchHistory,
  getFetchStats,
  WEB_FETCH_TOOL_NAME
};