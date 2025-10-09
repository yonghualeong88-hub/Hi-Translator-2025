#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动后端服务...');
console.log('📍 后端地址: http://localhost:3001');
console.log('🔧 API端点: /api/expand-phrase');
console.log('');

// 切换到backend目录并启动服务
const backendPath = path.join(__dirname, 'backend');
const child = spawn('npm', ['run', 'dev'], {
  cwd: backendPath,
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('❌ 启动后端服务失败:', error);
});

child.on('close', (code) => {
  console.log(`\n🔚 后端服务已停止，退出码: ${code}`);
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 正在停止后端服务...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在停止后端服务...');
  child.kill('SIGTERM');
});
