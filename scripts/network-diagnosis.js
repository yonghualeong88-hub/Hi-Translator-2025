#!/usr/bin/env node

/**
 * 网络配置诊断工具
 * 全面检查前端和后端的网络连接问题
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
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

async function checkBackendService() {
  log('\n🔍 检查后端服务状态...', 'blue');
  
  try {
    const response = await fetch('http://localhost:3001/api/test', {
      timeout: 5000
    });
    const data = await response.json();
    
    if (data.success) {
      log('✅ 后端服务正常运行', 'green');
      log(`   响应时间: ${new Date().toISOString()}`, 'green');
      return true;
    } else {
      log('❌ 后端服务响应异常', 'red');
      return false;
    }
  } catch (error) {
    log('❌ 后端服务连接失败', 'red');
    log(`   错误: ${error.message}`, 'red');
    return false;
  }
}

async function checkPortStatus() {
  log('\n🌐 检查端口状态...', 'blue');
  
  return new Promise((resolve) => {
    exec('netstat -an | findstr :3001', (error, stdout, stderr) => {
      if (stdout.includes('LISTENING')) {
        log('✅ 端口3001正在监听', 'green');
        log('   详细信息:', 'green');
        stdout.split('\n').forEach(line => {
          if (line.trim()) {
            log(`   ${line.trim()}`, 'green');
          }
        });
        resolve(true);
      } else {
        log('❌ 端口3001未在监听', 'red');
        resolve(false);
      }
    });
  });
}

async function checkLocalIP() {
  log('\n🏠 检查本地IP地址...', 'blue');
  
  return new Promise((resolve) => {
    exec('ipconfig | findstr "IPv4"', (error, stdout, stderr) => {
      if (stdout) {
        log('✅ 发现本地IP地址:', 'green');
        stdout.split('\n').forEach(line => {
          if (line.trim()) {
            log(`   ${line.trim()}`, 'green');
          }
        });
        resolve(true);
      } else {
        log('❌ 无法获取本地IP地址', 'red');
        resolve(false);
      }
    });
  });
}

async function checkFirewall() {
  log('\n🔥 检查防火墙状态...', 'blue');
  
  return new Promise((resolve) => {
    exec('netsh advfirewall show allprofiles state', (error, stdout, stderr) => {
      if (stdout) {
        log('防火墙状态:', 'yellow');
        stdout.split('\n').forEach(line => {
          if (line.trim()) {
            log(`   ${line.trim()}`, 'yellow');
          }
        });
        resolve(true);
      } else {
        log('❌ 无法检查防火墙状态', 'red');
        resolve(false);
      }
    });
  });
}

async function checkEnvironmentConfig() {
  log('\n⚙️ 检查环境配置...', 'blue');
  
  // 检查前端环境变量
  const frontendEnvPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(frontendEnvPath)) {
    const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
    log('✅ 前端环境变量文件存在', 'green');
    
    const hasApiUrl = frontendEnv.includes('EXPO_PUBLIC_API_URL');
    const hasDebugMode = frontendEnv.includes('EXPO_PUBLIC_DEBUG_MODE');
    
    if (hasApiUrl) {
      log('   ✅ EXPO_PUBLIC_API_URL 已配置', 'green');
    } else {
      log('   ❌ EXPO_PUBLIC_API_URL 未配置', 'red');
    }
    
    if (hasDebugMode) {
      log('   ✅ EXPO_PUBLIC_DEBUG_MODE 已配置', 'green');
    } else {
      log('   ❌ EXPO_PUBLIC_DEBUG_MODE 未配置', 'red');
    }
  } else {
    log('❌ 前端环境变量文件不存在', 'red');
  }
  
  // 检查后端环境变量
  const backendEnvPath = path.join(__dirname, '..', 'backend', '.env.local');
  if (fs.existsSync(backendEnvPath)) {
    const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
    log('✅ 后端环境变量文件存在', 'green');
    
    const hasGoogleTranslate = backendEnv.includes('GOOGLE_TRANSLATE_API_KEY');
    const hasGoogleVision = backendEnv.includes('GOOGLE_VISION_API_KEY');
    
    if (hasGoogleTranslate) {
      log('   ✅ GOOGLE_TRANSLATE_API_KEY 已配置', 'green');
    } else {
      log('   ❌ GOOGLE_TRANSLATE_API_KEY 未配置', 'red');
    }
    
    if (hasGoogleVision) {
      log('   ✅ GOOGLE_VISION_API_KEY 已配置', 'green');
    } else {
      log('   ❌ GOOGLE_VISION_API_KEY 未配置', 'red');
    }
  } else {
    log('❌ 后端环境变量文件不存在', 'red');
  }
}

async function testNetworkConnectivity() {
  log('\n🌍 测试网络连接...', 'blue');
  
  const testUrls = [
    { name: 'Google DNS', url: 'https://8.8.8.8' },
    { name: 'Google', url: 'https://www.google.com' },
    { name: '本地后端', url: 'http://localhost:3001' },
  ];
  
  for (const test of testUrls) {
    try {
      const startTime = Date.now();
      const response = await fetch(test.url, { 
        method: 'HEAD',
        timeout: 5000 
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        log(`   ✅ ${test.name}: 连接正常 (${responseTime}ms)`, 'green');
      } else {
        log(`   ⚠️  ${test.name}: 响应异常 (${response.status})`, 'yellow');
      }
    } catch (error) {
      log(`   ❌ ${test.name}: 连接失败 (${error.message})`, 'red');
    }
  }
}

async function checkProcessStatus() {
  log('\n🔄 检查进程状态...', 'blue');
  
  return new Promise((resolve) => {
    exec('tasklist /FI "IMAGENAME eq node.exe" /FO TABLE', (error, stdout, stderr) => {
      if (stdout && stdout.includes('node.exe')) {
        log('✅ 发现Node.js进程:', 'green');
        log(stdout, 'green');
        resolve(true);
      } else {
        log('❌ 没有发现Node.js进程', 'red');
        log('   后端服务可能没有运行', 'red');
        resolve(false);
      }
    });
  });
}

async function testApiEndpoints() {
  log('\n🧪 测试API端点...', 'blue');
  
  const endpoints = [
    { name: '测试API', url: '/api/test', method: 'GET' },
    { name: '翻译API', url: '/api/translate', method: 'POST', body: {
      texts: 'Hello',
      targetLanguage: 'zh-CN',
      isBatch: false
    }},
    { name: 'OCR API', url: '/api/ocr', method: 'POST', body: {
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }},
  ];
  
  for (const endpoint of endpoints) {
    try {
      log(`\n测试 ${endpoint.name}...`, 'yellow');
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`http://localhost:3001${endpoint.url}`, options);
      const data = await response.json();
      
      if (response.ok && data.success !== false) {
        log(`   ✅ ${endpoint.name} 正常工作`, 'green');
        if (endpoint.name === '翻译API' && data.translatedText) {
          log(`   翻译结果: ${data.translatedText}`, 'green');
        }
      } else {
        log(`   ⚠️  ${endpoint.name} 响应异常`, 'yellow');
        log(`      状态: ${response.status}`, 'yellow');
        log(`      错误: ${data.error || '未知错误'}`, 'yellow');
      }
    } catch (error) {
      log(`   ❌ ${endpoint.name} 连接失败`, 'red');
      log(`      错误: ${error.message}`, 'red');
    }
  }
}

async function generateNetworkReport() {
  log('\n📊 网络诊断报告', 'bold');
  log('================', 'bold');
  
  const backendRunning = await checkBackendService();
  const portListening = await checkPortStatus();
  const localIP = await checkLocalIP();
  const firewall = await checkFirewall();
  const processStatus = await checkProcessStatus();
  
  await checkEnvironmentConfig();
  await testNetworkConnectivity();
  await testApiEndpoints();
  
  log('\n🎯 诊断总结:', 'bold');
  log(`   后端服务: ${backendRunning ? '✅ 正常' : '❌ 异常'}`, backendRunning ? 'green' : 'red');
  log(`   端口监听: ${portListening ? '✅ 正常' : '❌ 异常'}`, portListening ? 'green' : 'red');
  log(`   本地IP: ${localIP ? '✅ 正常' : '❌ 异常'}`, localIP ? 'green' : 'red');
  log(`   进程状态: ${processStatus ? '✅ 正常' : '❌ 异常'}`, processStatus ? 'green' : 'red');
  
  if (!backendRunning || !portListening) {
    log('\n💡 建议解决方案:', 'cyan');
    log('1. 启动后端服务:', 'yellow');
    log('   cd backend && npm run dev', 'yellow');
    log('\n2. 检查端口是否被占用:', 'yellow');
    log('   netstat -an | findstr :3001', 'yellow');
    log('\n3. 重启网络服务:', 'yellow');
    log('   ipconfig /release && ipconfig /renew', 'yellow');
  }
}

async function main() {
  log('🔧 网络配置诊断工具', 'bold');
  log('==================', 'bold');
  
  await generateNetworkReport();
  
  log('\n✅ 网络诊断完成！', 'green');
}

// 运行诊断
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
