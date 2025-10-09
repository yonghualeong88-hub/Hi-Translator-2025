#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始设置 Expo 开发构建...\n');

// 检查必要工具
function checkRequirements() {
  console.log('📋 检查系统要求...');
  
  try {
    // 检查 Expo CLI
    execSync('expo --version', { stdio: 'pipe' });
    console.log('✅ Expo CLI 已安装');
  } catch (error) {
    console.log('❌ Expo CLI 未安装，请运行: npm install -g @expo/cli');
    process.exit(1);
  }

  // 检查 Android 开发环境（如果存在 android 目录）
  if (fs.existsSync('android')) {
    try {
      execSync('java -version', { stdio: 'pipe' });
      console.log('✅ Java 已安装');
    } catch (error) {
      console.log('⚠️  Java 未安装，Android 构建将失败');
    }
  }

  // 检查 iOS 开发环境（如果存在 ios 目录）
  if (fs.existsSync('ios')) {
    try {
      execSync('xcodebuild -version', { stdio: 'pipe' });
      console.log('✅ Xcode 已安装');
    } catch (error) {
      console.log('⚠️  Xcode 未安装，iOS 构建将失败');
    }
  }
}

// 清理并重新安装依赖
function cleanAndInstall() {
  console.log('\n🧹 清理并重新安装依赖...');
  
  try {
    // 删除 node_modules 和 package-lock.json
    if (fs.existsSync('node_modules')) {
      console.log('删除 node_modules...');
      fs.rmSync('node_modules', { recursive: true, force: true });
    }
    
    if (fs.existsSync('package-lock.json')) {
      console.log('删除 package-lock.json...');
      fs.unlinkSync('package-lock.json');
    }

    // 重新安装依赖
    console.log('重新安装依赖...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('✅ 依赖安装完成');
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
    process.exit(1);
  }
}

// 预构建项目
function prebuildProject() {
  console.log('\n🔨 预构建项目...');
  
  try {
    // 删除现有的原生目录
    if (fs.existsSync('android')) {
      console.log('删除现有 Android 目录...');
      fs.rmSync('android', { recursive: true, force: true });
    }
    
    if (fs.existsSync('ios')) {
      console.log('删除现有 iOS 目录...');
      fs.rmSync('ios', { recursive: true, force: true });
    }

    // 运行预构建
    console.log('运行 Expo 预构建...');
    execSync('npx expo prebuild --clean', { stdio: 'inherit' });
    
    console.log('✅ 预构建完成');
  } catch (error) {
    console.error('❌ 预构建失败:', error.message);
    process.exit(1);
  }
}

// 安装原生依赖
function installNativeDependencies() {
  console.log('\n📱 安装原生依赖...');
  
  // Android
  if (fs.existsSync('android')) {
    try {
      console.log('安装 Android 依赖...');
      execSync('cd android && ./gradlew clean', { stdio: 'inherit' });
      console.log('✅ Android 依赖安装完成');
    } catch (error) {
      console.error('❌ Android 依赖安装失败:', error.message);
    }
  }

  // iOS
  if (fs.existsSync('ios')) {
    try {
      console.log('安装 iOS 依赖...');
      execSync('cd ios && pod install', { stdio: 'inherit' });
      console.log('✅ iOS 依赖安装完成');
    } catch (error) {
      console.error('❌ iOS 依赖安装失败:', error.message);
    }
  }
}

// 创建启动脚本
function createStartScripts() {
  console.log('\n📝 创建启动脚本...');
  
  const startScripts = {
    'start:dev': 'expo start --dev-client',
    'start:dev:android': 'expo start --dev-client --android',
    'start:dev:ios': 'expo start --dev-client --ios',
    'build:dev:android': 'expo run:android',
    'build:dev:ios': 'expo run:ios'
  };

  // 更新 package.json
  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    ...startScripts
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ 启动脚本已添加到 package.json');
}

// 主函数
async function main() {
  try {
    checkRequirements();
    cleanAndInstall();
    prebuildProject();
    installNativeDependencies();
    createStartScripts();
    
    console.log('\n🎉 Expo 开发构建设置完成！');
    console.log('\n📖 使用方法:');
    console.log('  • 启动开发服务器: npm run start:dev');
    console.log('  • 在 Android 上运行: npm run build:dev:android');
    console.log('  • 在 iOS 上运行: npm run build:dev:ios');
    console.log('  • 启动并连接 Android: npm run start:dev:android');
    console.log('  • 启动并连接 iOS: npm run start:dev:ios');
    
    console.log('\n⚠️  注意事项:');
    console.log('  • 首次构建可能需要较长时间');
    console.log('  • 确保设备/模拟器已连接');
    console.log('  • 如果遇到问题，请检查原生依赖是否正确安装');
    
  } catch (error) {
    console.error('\n❌ 设置失败:', error.message);
    process.exit(1);
  }
}

main();
