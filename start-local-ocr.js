// 启动本地 OCR 服务
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动本地 OCR 服务...');

// 检查是否已安装依赖
const fs = require('fs');
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 检查必要的依赖
const requiredDeps = ['express', 'multer', 'tesseract.js'];
const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.log('📦 安装缺失的依赖:', missingDeps.join(', '));
  
  const installProcess = spawn('npm', ['install', ...missingDeps], {
    stdio: 'inherit',
    shell: true
  });
  
  installProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ 依赖安装完成，启动 OCR 服务...');
      startOCRService();
    } else {
      console.error('❌ 依赖安装失败');
    }
  });
} else {
  console.log('✅ 所有依赖已安装，启动 OCR 服务...');
  startOCRService();
}

function startOCRService() {
  const ocrService = spawn('node', ['local-ocr-service.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  ocrService.on('close', (code) => {
    console.log(`OCR 服务退出，代码: ${code}`);
  });
  
  ocrService.on('error', (error) => {
    console.error('OCR 服务启动失败:', error);
  });
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭 OCR 服务...');
    ocrService.kill('SIGINT');
    process.exit(0);
  });
}
