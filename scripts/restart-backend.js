#!/usr/bin/env node

/**
 * 后端服务重启脚本
 * 自动重启后端服务以加载新的环境变量和代码更改
 */

const { exec, spawn } = require('child_process');
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

function killNodeProcesses() {
  return new Promise((resolve) => {
    log('🛑 停止现有的Node.js进程...', 'yellow');
    
    exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout, stderr) => {
      if (stdout && stdout.includes('node.exe')) {
        log('   发现Node.js进程，正在停止...', 'yellow');
        
        // 杀死所有node.exe进程
        exec('taskkill /F /IM node.exe', (error2, stdout2, stderr2) => {
          if (error2) {
            log('   ⚠️  停止进程时出现警告，但继续执行', 'yellow');
          } else {
            log('   ✅ Node.js进程已停止', 'green');
          }
          
          // 等待2秒确保进程完全停止
          setTimeout(resolve, 2000);
        });
      } else {
        log('   ✅ 没有发现Node.js进程', 'green');
        resolve();
      }
    });
  });
}

function startBackendService() {
  return new Promise((resolve, reject) => {
    log('🚀 启动后端服务...', 'blue');
    
    const backendPath = path.join(__dirname, '..', 'backend');
    
    // 检查backend目录是否存在
    if (!fs.existsSync(backendPath)) {
      log('❌ 后端目录不存在', 'red');
      reject(new Error('Backend directory not found'));
      return;
    }
    
    // 检查package.json是否存在
    const packageJsonPath = path.join(backendPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      log('❌ 后端package.json不存在', 'red');
      reject(new Error('Backend package.json not found'));
      return;
    }
    
    log(`   工作目录: ${backendPath}`, 'blue');
    log('   启动命令: npm run dev', 'blue');
    
    // 启动后端服务
    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: backendPath,
      stdio: 'pipe',
      shell: true
    });
    
    let hasStarted = false;
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      log(`   [后端] ${output.trim()}`, 'green');
      
      // 检查是否启动成功
      if (output.includes('ready') || output.includes('started') || output.includes('listening')) {
        if (!hasStarted) {
          hasStarted = true;
          log('✅ 后端服务启动成功！', 'green');
          resolve(backendProcess);
        }
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      log(`   [后端错误] ${output.trim()}`, 'red');
    });
    
    backendProcess.on('error', (error) => {
      log(`❌ 启动后端服务失败: ${error.message}`, 'red');
      reject(error);
    });
    
    backendProcess.on('exit', (code) => {
      if (code !== 0) {
        log(`❌ 后端服务异常退出，代码: ${code}`, 'red');
      }
    });
    
    // 设置超时
    setTimeout(() => {
      if (!hasStarted) {
        log('⚠️  后端服务启动超时，但进程可能仍在运行', 'yellow');
        resolve(backendProcess);
      }
    }, 10000);
  });
}

async function testBackendConnection() {
  log('\n🧪 测试后端连接...', 'blue');
  
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  
  // 等待服务启动
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const response = await fetch('http://localhost:3001/api/test', {
      timeout: 5000
    });
    const data = await response.json();
    
    if (data.success) {
      log('✅ 后端连接测试成功', 'green');
      log(`   响应: ${JSON.stringify(data, null, 2)}`, 'green');
      return true;
    } else {
      log('❌ 后端连接测试失败', 'red');
      return false;
    }
  } catch (error) {
    log('❌ 后端连接测试失败', 'red');
    log(`   错误: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🔄 后端服务重启工具', 'bold');
  log('==================', 'bold');
  
  try {
    // 1. 停止现有进程
    await killNodeProcesses();
    
    // 2. 启动后端服务
    const backendProcess = await startBackendService();
    
    // 3. 测试连接
    const connectionTest = await testBackendConnection();
    
    if (connectionTest) {
      log('\n🎉 后端服务重启成功！', 'green');
      log('   服务地址: http://localhost:3001', 'green');
      log('   测试API: http://localhost:3001/api/test', 'green');
      log('\n💡 现在可以测试语音翻译功能了', 'cyan');
    } else {
      log('\n⚠️  后端服务可能未完全启动，请手动检查', 'yellow');
    }
    
    // 保持进程运行
    log('\n📝 后端服务正在运行中...', 'blue');
    log('   按 Ctrl+C 停止服务', 'blue');
    
    // 处理退出信号
    process.on('SIGINT', () => {
      log('\n🛑 正在停止后端服务...', 'yellow');
      if (backendProcess) {
        backendProcess.kill();
      }
      process.exit(0);
    });
    
  } catch (error) {
    log(`\n❌ 重启失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 运行重启
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };