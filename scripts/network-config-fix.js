#!/usr/bin/env node

/**
 * 网络配置修复工具
 * 自动检测和修复WiFi切换后的网络配置问题
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getCurrentIPAddress() {
  return new Promise((resolve) => {
    exec('ipconfig | findstr "IPv4"', (error, stdout, stderr) => {
      if (stdout) {
        const lines = stdout.split('\n');
        const ipv4Lines = lines.filter(line => line.includes('IPv4'));
        
        if (ipv4Lines.length > 0) {
          // 获取第一个IPv4地址（通常是WiFi的）
          const ipMatch = ipv4Lines[0].match(/(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch) {
            resolve(ipMatch[1]);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
}

function checkCurrentConfig() {
  log('\n📋 检查当前网络配置...', 'blue');
  
  const frontendEnvPath = path.join(__dirname, '..', '.env.local');
  const backendEnvPath = path.join(__dirname, '..', 'backend', '.env.local');
  
  if (fs.existsSync(frontendEnvPath)) {
    const content = fs.readFileSync(frontendEnvPath, 'utf8');
    log('✅ 前端环境变量文件存在', 'green');
    
    const apiUrlMatch = content.match(/EXPO_PUBLIC_API_URL=(.+)/);
    if (apiUrlMatch) {
      log(`   当前API URL: ${apiUrlMatch[1]}`, 'yellow');
    }
  } else {
    log('❌ 前端环境变量文件不存在', 'red');
  }
  
  if (fs.existsSync(backendEnvPath)) {
    log('✅ 后端环境变量文件存在', 'green');
  } else {
    log('❌ 后端环境变量文件不存在', 'red');
  }
}

function updateNetworkConfig(newIP) {
  log('\n🔧 更新网络配置...', 'blue');
  
  const frontendEnvPath = path.join(__dirname, '..', '.env.local');
  
  if (fs.existsSync(frontendEnvPath)) {
    let content = fs.readFileSync(frontendEnvPath, 'utf8');
    
    // 更新API URL
    const oldApiUrl = content.match(/EXPO_PUBLIC_API_URL=(.+)/);
    if (oldApiUrl) {
      const newApiUrl = `http://${newIP}:3001`;
      content = content.replace(/EXPO_PUBLIC_API_URL=.+/, `EXPO_PUBLIC_API_URL=${newApiUrl}`);
      
      fs.writeFileSync(frontendEnvPath, content);
      log(`✅ 已更新API URL: ${oldApiUrl[1]} → ${newApiUrl}`, 'green');
    } else {
      // 如果没有找到，添加新的配置
      content += `\nEXPO_PUBLIC_API_URL=http://${newIP}:3001\n`;
      fs.writeFileSync(frontendEnvPath, content);
      log(`✅ 已添加API URL: http://${newIP}:3001`, 'green');
    }
  } else {
    // 创建新的环境变量文件
    const content = `# 请在此处添加您的 OPENAI_API_KEY
# OPENAI_API_KEY=your_api_key_here
EXPO_PUBLIC_API_URL=http://${newIP}:3001
EXPO_PUBLIC_DEBUG_MODE=true
`;
    fs.writeFileSync(frontendEnvPath, content);
    log(`✅ 已创建前端环境变量文件，API URL: http://${newIP}:3001`, 'green');
  }
}

function checkBackendStatus() {
  return new Promise((resolve) => {
    log('\n🔍 检查后端服务状态...', 'blue');
    
    exec('netstat -an | findstr :3001', (error, stdout, stderr) => {
      if (stdout && stdout.includes('LISTENING')) {
        log('✅ 后端服务正在运行 (端口3001)', 'green');
        resolve(true);
      } else {
        log('❌ 后端服务未运行 (端口3001)', 'red');
        resolve(false);
      }
    });
  });
}

function testNetworkConnectivity(ip) {
  return new Promise((resolve) => {
    log(`\n🌐 测试网络连接 (${ip}:3001)...`, 'blue');
    
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    fetch(`http://${ip}:3001/api/test`, { timeout: 5000 })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          log(`✅ 网络连接正常 (${ip}:3001)`, 'green');
          resolve(true);
        } else {
          log(`❌ 网络连接异常 (${ip}:3001)`, 'red');
          resolve(false);
        }
      })
      .catch(error => {
        log(`❌ 网络连接失败 (${ip}:3001): ${error.message}`, 'red');
        resolve(false);
      });
  });
}

function generateQRCode(ip) {
  log('\n📱 生成手机连接二维码...', 'blue');
  
  const qrUrl = `http://${ip}:3001`;
  log(`   二维码内容: ${qrUrl}`, 'cyan');
  log(`   手机浏览器访问: ${qrUrl}`, 'cyan');
  log(`   手机应用API地址: ${qrUrl}`, 'cyan');
  
  // 生成简单的ASCII二维码（需要qrcode包）
  log('\n   扫描此二维码或手动输入地址:', 'yellow');
  log(`   ${qrUrl}`, 'magenta');
}

async function main() {
  log('🌐 网络配置修复工具', 'bold');
  log('==================', 'bold');
  
  // 1. 获取当前IP地址
  const currentIP = await getCurrentIPAddress();
  if (!currentIP) {
    log('❌ 无法获取当前IP地址', 'red');
    return;
  }
  
  log(`\n📍 当前IP地址: ${currentIP}`, 'green');
  
  // 2. 检查当前配置
  checkCurrentConfig();
  
  // 3. 检查后端服务
  const backendRunning = await checkBackendStatus();
  
  if (!backendRunning) {
    log('\n💡 后端服务未运行，请先启动后端服务:', 'cyan');
    log('   cd backend && npm run dev', 'yellow');
    return;
  }
  
  // 4. 测试网络连接
  const localhostConnectivity = await testNetworkConnectivity('localhost');
  const ipConnectivity = await testNetworkConnectivity(currentIP);
  
  // 5. 更新配置
  if (ipConnectivity) {
    updateNetworkConfig(currentIP);
    
    // 6. 生成连接信息
    generateQRCode(currentIP);
    
    log('\n🎉 网络配置修复完成！', 'green');
    log('\n📝 下一步操作:', 'cyan');
    log('1. 重启前端应用以加载新的网络配置', 'yellow');
    log('2. 在手机上使用新的IP地址连接', 'yellow');
    log('3. 确保手机和电脑在同一WiFi网络下', 'yellow');
  } else {
    log('\n❌ 网络连接测试失败', 'red');
    log('\n💡 可能的解决方案:', 'cyan');
    log('1. 检查防火墙设置', 'yellow');
    log('2. 确保后端服务正在运行', 'yellow');
    log('3. 检查WiFi网络连接', 'yellow');
    log('4. 尝试重启网络适配器', 'yellow');
  }
}

// 运行修复
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
