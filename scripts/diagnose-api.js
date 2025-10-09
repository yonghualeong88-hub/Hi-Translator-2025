#!/usr/bin/env node

/**
 * API连接诊断工具
 * 帮助诊断前端和后端API连接问题
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkBackendStatus() {
  log('\n🔍 检查后端服务状态...', 'blue');
  
  try {
    const response = await fetch('http://localhost:3001/api/test');
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

async function checkEnvironmentVariables() {
  log('\n🔧 检查环境变量配置...', 'blue');
  
  const frontendEnv = {
    'EXPO_PUBLIC_API_URL': process.env.EXPO_PUBLIC_API_URL,
    'EXPO_PUBLIC_DEBUG_MODE': process.env.EXPO_PUBLIC_DEBUG_MODE,
  };
  
  log('前端环境变量:', 'yellow');
  Object.entries(frontendEnv).forEach(([key, value]) => {
    if (value) {
      log(`   ✅ ${key}: ${value}`, 'green');
    } else {
      log(`   ❌ ${key}: 未设置`, 'red');
    }
  });
  
  // 检查后端环境变量（需要读取文件）
  const fs = require('fs');
  const path = require('path');
  
  try {
    const backendEnvPath = path.join(__dirname, '..', 'backend', '.env.local');
    if (fs.existsSync(backendEnvPath)) {
      const backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
      log('\n后端环境变量:', 'yellow');
      
      const hasGoogleTranslate = backendEnvContent.includes('GOOGLE_TRANSLATE_API_KEY');
      const hasGoogleVision = backendEnvContent.includes('GOOGLE_VISION_API_KEY');
      
      if (hasGoogleTranslate) {
        log('   ✅ GOOGLE_TRANSLATE_API_KEY: 已设置', 'green');
      } else {
        log('   ❌ GOOGLE_TRANSLATE_API_KEY: 未设置', 'red');
      }
      
      if (hasGoogleVision) {
        log('   ✅ GOOGLE_VISION_API_KEY: 已设置', 'green');
      } else {
        log('   ❌ GOOGLE_VISION_API_KEY: 未设置', 'red');
      }
    } else {
      log('   ❌ 后端环境变量文件不存在', 'red');
    }
  } catch (error) {
    log(`   ❌ 读取后端环境变量失败: ${error.message}`, 'red');
  }
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
  ];
  
  for (const endpoint of endpoints) {
    try {
      log(`\n测试 ${endpoint.name}...`, 'yellow');
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`http://localhost:3001${endpoint.url}`, options);
      const data = await response.json();
      
      if (response.ok && data.success) {
        log(`   ✅ ${endpoint.name} 正常工作`, 'green');
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

async function checkNetworkConfiguration() {
  log('\n🌐 检查网络配置...', 'blue');
  
  // 检查端口占用
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('netstat -an | findstr :3001', (error, stdout, stderr) => {
      if (stdout.includes('LISTENING')) {
        log('✅ 端口3001正在监听', 'green');
        log(`   详细信息: ${stdout.trim()}`, 'green');
      } else {
        log('❌ 端口3001未在监听', 'red');
      }
      resolve();
    });
  });
}

async function generateRecommendations() {
  log('\n💡 修复建议:', 'blue');
  
  log('1. 确保后端服务正在运行:', 'yellow');
  log('   cd backend && npm run dev', 'yellow');
  
  log('\n2. 检查环境变量配置:', 'yellow');
  log('   前端: 确保 .env.local 包含 EXPO_PUBLIC_API_URL=http://localhost:3001', 'yellow');
  log('   后端: 确保 backend/.env.local 包含 Google API 密钥', 'yellow');
  
  log('\n3. 如果使用移动设备:', 'yellow');
  log('   确保设备和开发机器在同一WiFi网络', 'yellow');
  log('   使用设备的本地IP地址而不是localhost', 'yellow');
  
  log('\n4. 重启服务:', 'yellow');
  log('   修改环境变量后需要重启前端和后端服务', 'yellow');
}

async function main() {
  log('🔧 API连接诊断工具', 'bold');
  log('==================', 'bold');
  
  // 设置环境变量
  process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3001';
  process.env.EXPO_PUBLIC_DEBUG_MODE = 'true';
  
  await checkBackendStatus();
  await checkEnvironmentVariables();
  await checkNetworkConfiguration();
  await testApiEndpoints();
  await generateRecommendations();
  
  log('\n✅ 诊断完成！', 'green');
}

// 运行诊断
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
