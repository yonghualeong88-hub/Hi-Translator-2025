#!/usr/bin/env node

/**
 * 环境变量调试工具
 * 专门检查环境变量加载问题
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironmentFile(filePath, description) {
  log(`\n📁 检查 ${description}...`, 'blue');
  
  if (!fs.existsSync(filePath)) {
    log(`❌ 文件不存在: ${filePath}`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  log(`✅ 文件存在: ${filePath}`, 'green');
  log(`   文件大小: ${content.length} 字节`, 'green');
  
  // 分析环境变量
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  log(`   环境变量数量: ${lines.length}`, 'green');
  
  lines.forEach((line, index) => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    
    if (key && value) {
      const maskedValue = value.length > 10 ? 
        value.substring(0, 10) + '...' : 
        value;
      log(`   ${index + 1}. ${key.trim()}: ${maskedValue}`, 'green');
    } else {
      log(`   ${index + 1}. 无效格式: ${line}`, 'red');
    }
  });
  
  return true;
}

function checkBackendEnvironmentLoading() {
  log('\n🔧 检查后端环境变量加载...', 'blue');
  
  // 检查后端是否使用 dotenv
  const backendPackagePath = path.join(__dirname, '..', 'backend', 'package.json');
  if (fs.existsSync(backendPackagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
    const hasDotenv = packageJson.dependencies && packageJson.dependencies.dotenv;
    
    if (hasDotenv) {
      log('✅ 后端已安装 dotenv 包', 'green');
    } else {
      log('❌ 后端未安装 dotenv 包', 'red');
      log('   建议: npm install dotenv', 'yellow');
    }
  }
  
  // 检查后端代码是否加载环境变量
  const backendApiPath = path.join(__dirname, '..', 'backend', 'pages', 'api', 'translate.ts');
  if (fs.existsSync(backendApiPath)) {
    const apiContent = fs.readFileSync(backendApiPath, 'utf8');
    
    if (apiContent.includes('process.env.GOOGLE_TRANSLATE_API_KEY')) {
      log('✅ 后端代码正确使用环境变量', 'green');
    } else {
      log('❌ 后端代码未使用环境变量', 'red');
    }
    
    if (apiContent.includes('require(\'dotenv\')') || apiContent.includes('import \'dotenv\'')) {
      log('✅ 后端代码加载了 dotenv', 'green');
    } else {
      log('❌ 后端代码未加载 dotenv', 'red');
      log('   建议: 在文件顶部添加 require(\'dotenv\').config()', 'yellow');
    }
  }
}

function checkFrontendEnvironmentLoading() {
  log('\n📱 检查前端环境变量加载...', 'blue');
  
  // 检查前端环境配置
  const frontendEnvPath = path.join(__dirname, '..', 'config', 'environment.ts');
  if (fs.existsSync(frontendEnvPath)) {
    const envContent = fs.readFileSync(frontendEnvPath, 'utf8');
    
    if (envContent.includes('process.env.EXPO_PUBLIC_API_URL')) {
      log('✅ 前端代码正确使用环境变量', 'green');
    } else {
      log('❌ 前端代码未使用环境变量', 'red');
    }
  }
  
  // 检查 app.json 或 app.config.js
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const appConfigPath = path.join(__dirname, '..', 'app.config.js');
  
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    if (appJson.expo && appJson.expo.extra) {
      log('✅ app.json 包含 extra 配置', 'green');
    } else {
      log('❌ app.json 缺少 extra 配置', 'red');
    }
  }
  
  if (fs.existsSync(appConfigPath)) {
    log('✅ 发现 app.config.js', 'green');
  }
}

function generateEnvironmentReport() {
  log('\n📊 环境变量诊断报告', 'bold');
  log('==================', 'bold');
  
  // 检查前端环境变量
  const frontendEnvPath = path.join(__dirname, '..', '.env.local');
  checkEnvironmentFile(frontendEnvPath, '前端环境变量文件');
  
  // 检查后端环境变量
  const backendEnvPath = path.join(__dirname, '..', 'backend', '.env.local');
  checkEnvironmentFile(backendEnvPath, '后端环境变量文件');
  
  // 检查环境变量加载
  checkBackendEnvironmentLoading();
  checkFrontendEnvironmentLoading();
  
  log('\n💡 环境变量问题解决方案:', 'cyan');
  log('1. 确保后端服务重启以加载新环境变量', 'yellow');
  log('2. 检查后端代码是否正确加载 dotenv', 'yellow');
  log('3. 验证环境变量文件格式正确', 'yellow');
  log('4. 确保环境变量名称拼写正确', 'yellow');
}

async function main() {
  log('🔧 环境变量调试工具', 'bold');
  log('==================', 'bold');
  
  generateEnvironmentReport();
  
  log('\n✅ 环境变量诊断完成！', 'green');
}

// 运行诊断
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
