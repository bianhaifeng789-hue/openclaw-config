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
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

const ADB_PATH = process.env.ADB_PATH || path.join(process.env.HOME, '.local/bin/adb');

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
    return { available: true, version: result.split('\n')[1] };
  } catch (e) {
    return { available: false };
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

// 检查应用是否已安装
function isInstalled(deviceId, packageId) {
  const result = adb(deviceId, `shell pm list packages | grep ${packageId}`);
  if (result.error) return false;
  return result && result.includes(packageId);
}

// 打开Google Play应用详情页面
function openPlayStore(deviceId, packageId) {
  const result = adb(deviceId, `shell am start -a android.intent.action.VIEW -d 'market://details?id=${packageId}'`);
  return result.includes('Starting:');
}

// 获取屏幕分辨率
function getScreenSize(deviceId) {
  const result = adb(deviceId, 'shell wm size');
  const match = result.match(/Physical size: (\d+)x(\d+)/);
  if (match) {
    return { width: parseInt(match[1]), height: parseInt(match[2]) };
  }
  return { width: 1080, height: 2424 }; // Pixel 9a默认
}

// 尝试点击安装按钮（多位置策略）
function tryClickInstall(deviceId, screenSize) {
  const { width, height } = screenSize;
  
  // Google Play常见布局的安装按钮位置（基于Pixel 9a 1080x2424测试）
  // ⚠️ 已通过用户点击确认：安装按钮在屏幕中间偏右 (813, 1374)
  // 第一次点击 (724, 1443) 是误点，第二次点击 (813, 1374) 才是安装按钮
  
  const INSTALL_BUTTON_COORDINATES = [
    // 优先：屏幕中间偏右（用户确认的安装按钮位置）
    { x: 813, y: 1374, desc: '中间偏右（确认）' },
    // 其他可能位置
    { x: 843, y: 827, desc: '右上角' },
    { x: 684, y: 1734, desc: '中下方' },
    { x: 724, y: 1443, desc: '中间偏左（误点）' },
    { x: Math.floor(width * 0.5), y: Math.floor(height * 0.5), desc: '屏幕中间' },
    { x: Math.floor(width * 0.85), y: Math.floor(height * 0.98), desc: '底部右侧' },
  ];
  
  for (const pos of INSTALL_BUTTON_COORDINATES) {
    console.log(`尝试点击 (${pos.x}, ${pos.y}) - ${pos.desc}`);
    adb(deviceId, `shell input tap ${pos.x} ${pos.y}`);
    
    // 等待3秒（缩短等待时间以加快尝试速度）
    execSync('sleep 3');
    
    // 检查是否有安装确认对话框
    const window = adb(deviceId, 'shell dumpsys window displays | grep mCurrentFocus');
    if (!window.error && (window.includes('Install') || window.includes('Confirm') || window.includes('download'))) {
      console.log('✅ 检测到安装流程启动');
      return true;
    }
    
    // 检查当前Activity
    const activity = adb(deviceId, 'shell dumpsys activity activities | grep mResumedActivity');
    if (!activity.error && activity.includes('Install')) {
      console.log('✅ 检测到安装Activity');
      return true;
    }
  }
  
  // 尝试滚动后再次寻找
  console.log('尝试向下滚动寻找安装按钮...');
  adb(deviceId, `shell input swipe ${Math.floor(width * 0.5)} ${Math.floor(height * 0.7)} ${Math.floor(width * 0.5)} ${Math.floor(height * 0.3)} 500`);
  execSync('sleep 2');
  
  // 滚动后再次尝试
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
  
  // 1. 检查ADB
  const adbCheck = checkADB();
  if (!adbCheck.available) {
    console.log('❌ ADB未安装');
    console.log('请运行: brew install android-platform-tools');
    return { success: false, error: 'ADB未安装' };
  }
  console.log(`✅ ADB: ${adbCheck.version}`);
  
  // 2. 获取设备
  const devices = getDevices();
  if (devices.length === 0) {
    console.log('❌ 未找到连接的设备');
    return { success: false, error: '未找到设备' };
  }
  
  const device = deviceId ? devices.find(d => d.id === deviceId) : devices[0];
  if (!device) {
    console.log(`❌ 未找到设备 ${deviceId}`);
    return { success: false, error: '设备未找到' };
  }
  console.log(`✅ 设备: ${device.model} (${device.id})`);
  
  // 3. 检查是否已安装
  if (isInstalled(device.id, packageId)) {
    console.log('✅ 应用已安装');
    return { success: true, installed: true, message: '应用已安装' };
  }
  
  // 4. 打开Google Play
  console.log('打开Google Play...');
  if (!openPlayStore(device.id, packageId)) {
    console.log('❌ 无法打开Google Play');
    return { success: false, error: '无法打开Google Play' };
  }
  
  // 等待页面加载
  execSync('sleep 8');
  console.log('✅ Google Play已打开');
  
  // 5. 获取屏幕尺寸
  const screenSize = getScreenSize(device.id);
  console.log(`屏幕: ${screenSize.width}x${screenSize.height}`);
  
  // 6. 尝试点击安装
  console.log('\n尝试点击安装按钮...');
  const clicked = tryClickInstall(device.id, screenSize);
  
  if (!clicked) {
    console.log('⚠️ 未能自动点击安装按钮');
    console.log('请手动在手机上点击安装');
    return { success: false, error: '未能点击安装按钮', manual: true };
  }
  
  // 7. 等待安装完成
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
  
  const devices = getDevices();
  if (devices.length === 0) {
    console.log('❌ 未找到设备');
    process.exit(1);
  }
  
  const device = deviceId ? devices.find(d => d.id === deviceId) : devices[0];
  const installed = isInstalled(device.id, packageId);
  console.log(`${packageId}: ${installed ? '已安装' : '未安装'}`);
} else {
  console.log(`
用法:
  node google-play-installer.js install <package_id> [device_id]  # 安装应用
  node google-play-installer.js devices                            # 查看设备
  node google-play-installer.js check <package_id> [device_id]    # 检查是否已安装
  
示例:
  node google-play-installer.js install com.wordconnect.cash.game
  node google-play-installer.js install com.wordconnect.cash.game 56101JEBF10414
`);
}

module.exports = { install, getDevices, isInstalled };