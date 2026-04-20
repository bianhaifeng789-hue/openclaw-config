#!/usr/bin/env node
/**
 * Google Play自动安装器
 * 
 * 功能：
 * 1. 通过ADB打开Google Play应用详情页面
 * 2. 自动定位安装按钮
 * 3. 模拟点击安装
 * 4. 等待安装完成
 * 5. 验证安装成功
 * 6. 从已安装应用提取 APK / split APK
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function resolveAdbPath() {
  const candidates = [
    process.env.ADB_PATH,
    path.join(process.env.HOME || '', 'android-sdk/platform-tools/adb'),
    path.join(process.env.HOME || '', 'Library/Android/sdk/platform-tools/adb'),
    path.join(process.env.HOME || '', '.local/bin/adb'),
    'adb'
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      execSync(`${candidate} version`, { timeout: 10000, encoding: 'utf-8', stdio: 'pipe' });
      return candidate;
    } catch (_) {}
  }

  return candidates[candidates.length - 1] || 'adb';
}

const ADB_PATH = resolveAdbPath();

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

// 执行ADB命令
function adb(deviceId, command) {
  const cmd = deviceId ? `${ADB_PATH} -s ${deviceId} ${command}` : `${ADB_PATH} ${command}`;
  try {
    return execSync(cmd, { timeout: 30000, encoding: 'utf-8' });
  } catch (e) {
    return { error: e.message, stderr: e.stderr?.toString() };
  }
}

// 检查ADB是否可用
function checkADB() {
  try {
    const result = execSync(`${ADB_PATH} version`, { timeout: 10000, encoding: 'utf-8' });
    return { available: true, version: result.split('\n')[0], adbPath: ADB_PATH };
  } catch (e) {
    return { available: false, adbPath: ADB_PATH };
  }
}

// 获取连接的设备
function getDevices() {
  const result = adb(null, 'devices -l');
  if (result.error) return [];
  
  const lines = result.split('\n').slice(1);
  return lines.filter(l => l.includes('device') && !l.includes('List of'))
    .map(l => {
      const parts = l.split(/\s+/);
      return {
        id: parts[0],
        model: parts[3]?.replace('model:', '') || 'unknown',
        product: parts[2]?.replace('product:', '') || 'unknown'
      };
    });
}

function getTargetDevice(deviceId = null) {
  const devices = getDevices();
  if (devices.length === 0) {
    return { error: '未找到连接的设备' };
  }
  const device = deviceId ? devices.find(d => d.id === deviceId) : devices[0];
  if (!device) {
    return { error: `未找到设备 ${deviceId}` };
  }
  return { device, devices };
}

// 检查应用是否已安装
function isInstalled(deviceId, packageId) {
  const result = adb(deviceId, `shell pm list packages ${shellQuote(packageId)}`);
  if (result.error) return false;
  return result && result.includes(packageId);
}

function getPackagePaths(deviceId, packageId) {
  const result = adb(deviceId, `shell pm path ${shellQuote(packageId)}`);
  if (result.error || !result.trim()) return [];
  return result
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^package:/, ''));
}

function pullPackage(deviceId, packageId, outputDir) {
  const packagePaths = getPackagePaths(deviceId, packageId);
  if (packagePaths.length === 0) {
    return { success: false, error: '应用未安装或无法获取 APK 路径', packagePaths: [] };
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const pulled = [];

  for (const remotePath of packagePaths) {
    const filename = path.basename(remotePath);
    const localPath = path.join(outputDir, filename);
    const result = adb(deviceId, `pull ${shellQuote(remotePath)} ${shellQuote(localPath)}`);
    if (result.error) {
      return { success: false, error: `拉取失败: ${remotePath}`, detail: result.stderr || result.error, packagePaths, pulled };
    }
    pulled.push({ remotePath, localPath });
  }

  return { success: true, packagePaths, pulled, outputDir };
}

// 打开Google Play应用详情页面
function openPlayStore(deviceId, packageId) {
  const result = adb(deviceId, `shell am start -a android.intent.action.VIEW -d 'market://details?id=${packageId}'`);
  return typeof result === 'string' && result.includes('Starting:');
}

// 获取屏幕分辨率
function getScreenSize(deviceId) {
  const result = adb(deviceId, 'shell wm size');
  const match = typeof result === 'string' ? result.match(/Physical size: (\d+)x(\d+)/) : null;
  if (match) {
    return { width: parseInt(match[1]), height: parseInt(match[2]) };
  }
  return { width: 1080, height: 2424 };
}

// 尝试点击安装按钮（多位置策略）
function tryClickInstall(deviceId, screenSize) {
  const { width, height } = screenSize;
  
  const INSTALL_BUTTON_COORDINATES = [
    { x: 813, y: 1374, desc: '中间偏右（确认）' },
    { x: 843, y: 827, desc: '右上角' },
    { x: 684, y: 1734, desc: '中下方' },
    { x: 724, y: 1443, desc: '中间偏左（误点）' },
    { x: Math.floor(width * 0.5), y: Math.floor(height * 0.5), desc: '屏幕中间' },
    { x: Math.floor(width * 0.85), y: Math.floor(height * 0.98), desc: '底部右侧' },
  ];
  
  for (const pos of INSTALL_BUTTON_COORDINATES) {
    console.log(`尝试点击 (${pos.x}, ${pos.y}) - ${pos.desc}`);
    adb(deviceId, `shell input tap ${pos.x} ${pos.y}`);
    execSync('sleep 3');
    
    const window = adb(deviceId, 'shell dumpsys window displays | grep mCurrentFocus');
    if (!window.error && (window.includes('Install') || window.includes('Confirm') || window.includes('download'))) {
      console.log('✅ 检测到安装流程启动');
      return true;
    }
    
    const activity = adb(deviceId, 'shell dumpsys activity activities | grep mResumedActivity');
    if (!activity.error && activity.includes('Install')) {
      console.log('✅ 检测到安装Activity');
      return true;
    }
  }
  
  console.log('尝试向下滚动寻找安装按钮...');
  adb(deviceId, `shell input swipe ${Math.floor(width * 0.5)} ${Math.floor(height * 0.7)} ${Math.floor(width * 0.5)} ${Math.floor(height * 0.3)} 500`);
  execSync('sleep 2');
  
  const positionsAfterScroll = INSTALL_BUTTON_COORDINATES.slice(0, 3);
  
  for (const pos of positionsAfterScroll) {
    console.log(`滚动后尝试 (${pos.x}, ${pos.y})`);
    adb(deviceId, `shell input tap ${pos.x} ${pos.y}`);
    execSync('sleep 3');
    
    const window = adb(deviceId, 'shell dumpsys window displays | grep mCurrentFocus');
    if (!window.error && (window.includes('Install') || window.includes('download'))) {
      console.log('✅ 滚动后找到安装按钮');
      return true;
    }
  }
  
  return false;
}

// 等待安装完成
function waitForInstall(deviceId, packageId, timeout = 120000) {
  const startTime = Date.now();
  const checkInterval = 10000;
  
  while (Date.now() - startTime < timeout) {
    if (isInstalled(deviceId, packageId)) {
      return true;
    }
    execSync(`sleep ${checkInterval / 1000}`);
    console.log('等待安装...');
  }
  
  return false;
}

// 主安装流程
async function install(packageId, deviceId = null) {
  console.log(`\n📱 Google Play自动安装器`);
  console.log(`应用: ${packageId}`);
  
  const adbCheck = checkADB();
  if (!adbCheck.available) {
    console.log('❌ ADB未安装');
    console.log(`当前探测路径: ${adbCheck.adbPath}`);
    return { success: false, error: 'ADB未安装' };
  }
  console.log(`✅ ADB: ${adbCheck.version}`);
  console.log(`✅ ADB路径: ${adbCheck.adbPath}`);
  
  const target = getTargetDevice(deviceId);
  if (target.error) {
    console.log(`❌ ${target.error}`);
    return { success: false, error: target.error };
  }
  const device = target.device;
  console.log(`✅ 设备: ${device.model} (${device.id})`);
  
  if (isInstalled(device.id, packageId)) {
    console.log('✅ 应用已安装');
    return { success: true, installed: true, message: '应用已安装' };
  }
  
  console.log('打开Google Play...');
  if (!openPlayStore(device.id, packageId)) {
    console.log('❌ 无法打开Google Play');
    return { success: false, error: '无法打开Google Play' };
  }
  
  execSync('sleep 8');
  console.log('✅ Google Play已打开');
  
  const screenSize = getScreenSize(device.id);
  console.log(`屏幕: ${screenSize.width}x${screenSize.height}`);
  
  console.log('\n尝试点击安装按钮...');
  const clicked = tryClickInstall(device.id, screenSize);
  
  if (!clicked) {
    console.log('⚠️ 未能自动点击安装按钮');
    console.log('请手动在手机上点击安装');
    return { success: false, error: '未能点击安装按钮', manual: true };
  }
  
  console.log('\n等待安装完成...');
  const installed = waitForInstall(device.id, packageId);
  
  if (installed) {
    console.log('✅ 安装成功！');
    return { success: true, installed: true };
  } else {
    console.log('⚠️ 安装超时，请手动确认');
    return { success: false, error: '安装超时', manual: true };
  }
}

// CLI入口
const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === 'install') {
  const packageId = args[1];
  const deviceId = args[2];
  
  if (!packageId) {
    console.log('❌ 请提供应用包名');
    console.log('用法: node google-play-installer.js install <package_id> [device_id]');
    process.exit(1);
  }
  
  install(packageId, deviceId)
    .then(result => {
      if (result.success) {
        console.log('\n🎉 完成！');
      } else {
        console.log('\n❌ 失败:', result.error);
      }
    })
    .catch(e => console.error('错误:', e));
} else if (cmd === 'devices') {
  const devices = getDevices();
  console.log('连接的设备:');
  devices.forEach(d => console.log(`  - ${d.model} (${d.id})`));
} else if (cmd === 'check') {
  const packageId = args[1];
  const deviceId = args[2];
  
  if (!packageId) {
    console.log('❌ 请提供应用包名');
    process.exit(1);
  }
  
  const target = getTargetDevice(deviceId);
  if (target.error) {
    console.log(`❌ ${target.error}`);
    process.exit(1);
  }
  
  const installed = isInstalled(target.device.id, packageId);
  console.log(`${packageId}: ${installed ? '已安装' : '未安装'}`);
} else if (cmd === 'pull') {
  const packageId = args[1];
  const outputDir = args[2];
  const deviceId = args[3];

  if (!packageId) {
    console.log('❌ 请提供应用包名');
    console.log('用法: node google-play-installer.js pull <package_id> [output_dir] [device_id]');
    process.exit(1);
  }

  const target = getTargetDevice(deviceId);
  if (target.error) {
    console.log(`❌ ${target.error}`);
    process.exit(1);
  }

  const outDir = outputDir || path.join(process.cwd(), 'artifacts', packageId);
  const result = pullPackage(target.device.id, packageId, outDir);
  if (!result.success) {
    console.log(`❌ ${result.error}`);
    if (result.detail) console.log(result.detail);
    process.exit(1);
  }

  console.log(`✅ 已拉取 ${result.pulled.length} 个 APK 文件到 ${result.outputDir}`);
  result.pulled.forEach(item => console.log(`  - ${item.remotePath} -> ${item.localPath}`));
} else if (cmd === 'paths') {
  const packageId = args[1];
  const deviceId = args[2];

  if (!packageId) {
    console.log('❌ 请提供应用包名');
    console.log('用法: node google-play-installer.js paths <package_id> [device_id]');
    process.exit(1);
  }

  const target = getTargetDevice(deviceId);
  if (target.error) {
    console.log(`❌ ${target.error}`);
    process.exit(1);
  }

  const packagePaths = getPackagePaths(target.device.id, packageId);
  if (packagePaths.length === 0) {
    console.log('未找到 APK 路径');
    process.exit(1);
  }

  packagePaths.forEach(p => console.log(p));
} else {
  console.log(`
用法:
  node google-play-installer.js install <package_id> [device_id]          # 打开 Play 并尝试自动安装
  node google-play-installer.js devices                                   # 查看设备
  node google-play-installer.js check <package_id> [device_id]            # 检查是否已安装
  node google-play-installer.js paths <package_id> [device_id]            # 输出设备内 APK 路径
  node google-play-installer.js pull <package_id> [output_dir] [device_id]# 拉取 base/split APK
  
示例:
  node google-play-installer.js install com.wordconnect.cash.game
  node google-play-installer.js check com.wordconnect.cash.game 56101JEBF10414
  node google-play-installer.js pull com.wordconnect.cash.game artifacts/com.wordconnect.cash.game 56101JEBF10414
`);
}

module.exports = { install, getDevices, isInstalled, getPackagePaths, pullPackage, checkADB, ADB_PATH };
