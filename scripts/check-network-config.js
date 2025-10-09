// 网络配置检查脚本
const os = require('os');
const { exec } = require('child_process');

function getNetworkInfo() {
  console.log('🌐 网络配置检查\n');
  
  // 获取网络接口信息
  const interfaces = os.networkInterfaces();
  
  console.log('📱 电脑网络配置:');
  console.log('='.repeat(50));
  
  Object.keys(interfaces).forEach(name => {
    const iface = interfaces[name];
    iface.forEach(addr => {
      if (addr.family === 'IPv4' && !addr.internal) {
        console.log(`网络接口: ${name}`);
        console.log(`IP 地址: ${addr.address}`);
        console.log(`子网掩码: ${addr.netmask}`);
        console.log(`MAC 地址: ${addr.mac}`);
        console.log('');
      }
    });
  });
  
  // 检查后端服务器状态
  console.log('🖥️  后端服务器状态:');
  console.log('='.repeat(50));
  
  checkBackendServer();
  
  // 提供手机访问地址
  console.log('📱 手机访问地址:');
  console.log('='.repeat(50));
  
  Object.keys(interfaces).forEach(name => {
    const iface = interfaces[name];
    iface.forEach(addr => {
      if (addr.family === 'IPv4' && !addr.internal) {
        console.log(`相机翻译页面: http://${addr.address}:3000/camera-translate`);
        console.log(`OCR 测试页面: http://${addr.address}:3000/ocr-test`);
        console.log(`后端 API: http://${addr.address}:3001/api/test`);
        console.log('');
      }
    });
  });
  
  console.log('📋 使用说明:');
  console.log('='.repeat(50));
  console.log('1. 确保手机和电脑连接在同一个 WiFi 网络');
  console.log('2. 在手机浏览器中访问上述地址');
  console.log('3. 如果无法访问，请检查防火墙设置');
  console.log('4. 相机功能需要 HTTPS 或 localhost 环境');
  console.log('');
  
  console.log('🔧 故障排除:');
  console.log('='.repeat(50));
  console.log('• 如果手机无法访问，请检查 Windows 防火墙');
  console.log('• 确保后端服务器正在运行: cd backend && npm run dev');
  console.log('• 确保前端服务器正在运行: npm run dev');
  console.log('• 相机功能在手机浏览器中可能需要 HTTPS');
}

function checkBackendServer() {
  const { exec } = require('child_process');
  
  exec('netstat -an | findstr 3001', (error, stdout, stderr) => {
    if (stdout.includes('3001')) {
      console.log('✅ 后端服务器正在运行 (端口 3001)');
    } else {
      console.log('❌ 后端服务器未运行');
      console.log('请运行: cd backend && npm run dev');
    }
    
    exec('netstat -an | findstr 3000', (error, stdout, stderr) => {
      if (stdout.includes('3000')) {
        console.log('✅ 前端服务器正在运行 (端口 3000)');
      } else {
        console.log('❌ 前端服务器未运行');
        console.log('请运行: npm run dev');
      }
      console.log('');
    });
  });
}

// 运行检查
getNetworkInfo();
