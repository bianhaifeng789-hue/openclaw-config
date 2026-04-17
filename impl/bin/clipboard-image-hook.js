#!/usr/bin/env node
/**
 * Clipboard Image Hook - 基于 Claude Code useClipboardImageHint
 * 
 * 剪贴板图片：
 *   - 图片检测
 *   - 图片粘贴处理
 *   - 图片状态
 * 
 * Usage:
 *   node clipboard-image-hook.js detect
 *   node clipboard-image-hook.js paste <path>
 *   node clipboard-image-hook.js status
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'clipboard-image');
const STATE_FILE = path.join(STATE_DIR, 'clipboard-image-state.json');
const IMAGES_DIR = path.join(STATE_DIR, 'images');

function loadClipboardImageState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      detectedImages: [],
      pastedImages: [],
      stats: {
        totalDetected: 0,
        totalPasted: 0,
        avgImageSize: 0
      }
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {
      detectedImages: [],
      pastedImages: [],
      stats: {
        totalDetected: 0,
        totalPasted: 0,
        avgImageSize: 0
      }
    };
  }
}

function saveClipboardImageState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function detectClipboardImage() {
  // In real implementation, would use clipboard API
  const detected = {
    detected: true,
    hasImage: true,
    format: 'png',
    timestamp: Date.now(),
    simulated: true,
    note: 'In real implementation, would check system clipboard for image data'
  };
  
  const state = loadClipboardImageState();
  state.detectedImages.push(detected);
  state.stats.totalDetected++;
  
  if (state.detectedImages.length > 20) {
    state.detectedImages = state.detectedImages.slice(-20);
  }
  
  saveClipboardImageState(state);
  
  return detected;
}

function pasteClipboardImage(imagePath) {
  const state = loadClipboardImageState();
  
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  
  const imageStats = {
    pasted: true,
    sourcePath: imagePath,
    pastedAt: Date.now(),
    pastedImageId: `img_${Date.now()}`
  };
  
  // Check if source exists
  if (fs.existsSync(imagePath)) {
    const stats = fs.statSync(imagePath);
    imageStats.size = stats.size;
    imageStats.exists = true;
    
    // Copy to images dir
    const destPath = path.join(IMAGES_DIR, `${imageStats.pastedImageId}.png`);
    fs.copyFileSync(imagePath, destPath);
    imageStats.destPath = destPath;
    
    // Update avg size
    const pastedWithSize = state.pastedImages.filter(i => i.size);
    const totalSize = pastedWithSize.reduce((sum, i) => sum + i.size, 0);
    state.stats.avgImageSize = totalSize / pastedWithSize.length;
  } else {
    imageStats.exists = false;
    imageStats.error = 'source file not found';
  }
  
  state.pastedImages.push(imageStats);
  state.stats.totalPasted++;
  
  if (state.pastedImages.length > 20) {
    state.pastedImages = state.pastedImages.slice(-20);
  }
  
  saveClipboardImageState(state);
  
  return imageStats;
}

function getClipboardImageStatus() {
  const state = loadClipboardImageState();
  
  return {
    stats: state.stats,
    recentDetected: state.detectedImages.slice(-5),
    recentPasted: state.pastedImages.slice(-5)
  };
}

function getPastedImages(limit = 20) {
  const state = loadClipboardImageState();
  
  return {
    images: state.pastedImages.slice(-limit),
    total: state.pastedImages.length,
    stats: state.stats
  };
}

function clearPastedImages() {
  const state = loadClipboardImageState();
  
  // Delete stored images
  if (fs.existsSync(IMAGES_DIR)) {
    const files = fs.readdirSync(IMAGES_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(IMAGES_DIR, file));
    }
  }
  
  state.pastedImages = [];
  state.stats.totalPasted = 0;
  state.stats.avgImageSize = 0;
  
  saveClipboardImageState(state);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function getClipboardImageStats() {
  const state = loadClipboardImageState();
  
  return {
    totalDetected: state.stats.totalDetected,
    totalPasted: state.stats.totalPasted,
    avgImageSize: Math.round(state.stats.avgImageSize),
    detectedCount: state.detectedImages.length,
    pastedCount: state.pastedImages.length
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'detect':
      console.log(JSON.stringify(detectClipboardImage(), null, 2));
      break;
    case 'paste':
      const pastePath = args[1];
      if (!pastePath) {
        console.log('Usage: node clipboard-image-hook.js paste <imagePath>');
        process.exit(1);
      }
      console.log(JSON.stringify(pasteClipboardImage(pastePath), null, 2));
      break;
    case 'status':
      console.log(JSON.stringify(getClipboardImageStatus(), null, 2));
      break;
    case 'history':
      const histLimit = parseInt(args[1], 10) || 20;
      console.log(JSON.stringify(getPastedImages(histLimit), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearPastedImages(), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getClipboardImageStats(), null, 2));
      break;
    default:
      console.log('Usage: node clipboard-image-hook.js [detect|paste|status|history|clear|stats]');
      process.exit(1);
  }
}

main();

module.exports = {
  detectClipboardImage,
  pasteClipboardImage,
  getClipboardImageStatus,
  getPastedImages,
  clearPastedImages,
  getClipboardImageStats
};