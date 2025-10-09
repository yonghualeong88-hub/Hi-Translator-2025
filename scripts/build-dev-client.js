#!/usr/bin/env node

/**
 * 构建 Expo Dev Client 开发环境
 * 用于支持 react-native-vision-camera 等原生模块
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建 Expo Dev Client 开发环境...\n');

// 检查是否已执行 prebuild
const androidDir = path.join(process.cwd(), 'android');
if (!fs.existsSync(androidDir)) {
  console.log('❌ 未找到 android 目录，请先执行: npx expo prebuild');
  process.exit(1);
}

console.log('✅ 检测到 Android 原生代码已生成');

// 检查依赖
console.log('\n📦 检查依赖...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'react-native-vision-camera',
    'react-native-reanimated'
  ];
  
  const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log(`❌ 缺少依赖: ${missingDeps.join(', ')}`);
    console.log('请运行: npm install ' + missingDeps.join(' '));
    process.exit(1);
  }
  
  console.log('✅ 所有依赖已安装');
} catch (error) {
  console.log('❌ 无法读取 package.json:', error.message);
  process.exit(1);
}

// 构建开发客户端
console.log('\n🔨 构建 Android 开发客户端...');
try {
  execSync('npx expo run:android', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('\n✅ Android 开发客户端构建完成！');
} catch (error) {
  console.log('\n❌ 构建失败:', error.message);
  console.log('\n🔧 故障排除:');
  console.log('1. 确保 Android Studio 和 SDK 已正确安装');
  console.log('2. 确保设备已连接或模拟器已启动');
  console.log('3. 检查 Android 权限配置');
  process.exit(1);
}

console.log('\n🎉 Expo Dev Client 开发环境设置完成！');
console.log('\n📱 下一步:');
console.log('1. 在设备上安装刚构建的开发客户端');
console.log('2. 运行: npx expo start --dev-client');
console.log('3. 扫描二维码或输入开发服务器地址');
console.log('4. 测试 Vision Camera 功能');

console.log('\n🔍 测试 Vision Camera:');
console.log('- 打开相机页面');
console.log('- 检查是否显示 "没有可用的相机设备" 错误');
console.log('- 如果正常，说明 Vision Camera 已成功集成');


