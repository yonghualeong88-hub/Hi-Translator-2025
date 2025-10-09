// start-dev.js
// 开发环境启动脚本

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动开发环境...');

// 启动后端服务器
console.log('📡 启动后端服务器...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// 等待后端启动
setTimeout(() => {
  console.log('📱 启动前端应用...');
  
  // 启动前端应用
  const frontend = spawn('npx', ['expo', 'start'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  // 处理进程退出
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭开发服务器...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

}, 3000); // 等待3秒让后端启动

// 处理后端进程退出
backend.on('exit', (code) => {
  console.log(`后端服务器退出，代码: ${code}`);
});

console.log('✅ 开发环境启动完成！');
console.log('📡 后端服务器: http://localhost:3001');
console.log('📱 前端应用: 请扫描二维码或按 w 键打开网页版');
console.log('🛑 按 Ctrl+C 停止所有服务');
