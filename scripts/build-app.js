#!/usr/bin/env node

/**
 * 应用构建脚本
 * 自动检查并构建应用
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 应用构建脚本');
console.log('==============');

// 检查原生模块
const checkNativeModules = () => {
  console.log('\n🔍 检查原生模块...');
  try {
    execSync('node scripts/check-native-modules.js', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ 原生模块检查失败');
    return false;
  }
};

// 检查EAS CLI
const checkEASCLI = () => {
  console.log('\n📦 检查EAS CLI...');
  try {
    execSync('eas --version', { stdio: 'pipe' });
    console.log('✅ EAS CLI已安装');
    return true;
  } catch (error) {
    console.log('❌ EAS CLI未安装');
    return false;
  }
};

// 安装EAS CLI
const installEASCLI = () => {
  console.log('\n📥 安装EAS CLI...');
  try {
    execSync('npm install -g @expo/eas-cli', { stdio: 'inherit' });
    console.log('✅ EAS CLI安装成功');
    return true;
  } catch (error) {
    console.error('❌ EAS CLI安装失败');
    return false;
  }
};

// 配置EAS Build
const configureEASBuild = () => {
  console.log('\n⚙️  配置EAS Build...');
  try {
    execSync('eas build:configure', { stdio: 'inherit' });
    console.log('✅ EAS Build配置成功');
    return true;
  } catch (error) {
    console.error('❌ EAS Build配置失败');
    return false;
  }
};

// 构建应用
const buildApp = (platform, profile = 'development') => {
  console.log(`\n🔨 构建${platform}应用 (${profile}模式)...`);
  try {
    const command = `eas build --platform ${platform} --profile ${profile}`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${platform}应用构建成功`);
    return true;
  } catch (error) {
    console.error(`❌ ${platform}应用构建失败`);
    return false;
  }
};

// 本地构建
const buildLocal = (platform) => {
  console.log(`\n🔨 本地构建${platform}应用...`);
  try {
    // 生成原生项目
    console.log('📁 生成原生项目...');
    execSync('npx expo prebuild', { stdio: 'inherit' });
    
    // 构建
    const command = platform === 'ios' ? 'npx expo run:ios' : 'npx expo run:android';
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${platform}应用本地构建成功`);
    return true;
  } catch (error) {
    console.error(`❌ ${platform}应用本地构建失败`);
    return false;
  }
};

// 主函数
const main = async () => {
  const args = process.argv.slice(2);
  const platform = args[0] || 'ios';
  const profile = args[1] || 'development';
  const useLocal = args.includes('--local');
  
  console.log(`目标平台: ${platform}`);
  console.log(`构建模式: ${profile}`);
  console.log(`构建方式: ${useLocal ? '本地构建' : 'EAS Build'}`);
  
  // 检查原生模块
  if (!checkNativeModules()) {
    console.log('\n❌ 请先解决原生模块问题');
    process.exit(1);
  }
  
  if (useLocal) {
    // 本地构建
    if (!buildLocal(platform)) {
      process.exit(1);
    }
  } else {
    // EAS Build
    if (!checkEASCLI()) {
      if (!installEASCLI()) {
        console.log('\n💡 建议使用本地构建: node scripts/build-app.js ios development --local');
        process.exit(1);
      }
    }
    
    if (!configureEASBuild()) {
      process.exit(1);
    }
    
    if (!buildApp(platform, profile)) {
      process.exit(1);
    }
  }
  
  console.log('\n🎉 构建完成！');
};

// 显示帮助信息
const showHelp = () => {
  console.log(`
使用方法:
  node scripts/build-app.js [平台] [模式] [选项]

参数:
  平台: ios, android (默认: ios)
  模式: development, production (默认: development)
  选项: --local (使用本地构建)

示例:
  node scripts/build-app.js ios development
  node scripts/build-app.js android production
  node scripts/build-app.js ios development --local
  node scripts/build-app.js android --local

注意:
  - EAS Build需要Expo账户和网络连接
  - 本地构建需要相应的开发环境 (Xcode/Android Studio)
  - 首次构建可能需要较长时间
`);
};

// 检查参数
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 运行主函数
main().catch(error => {
  console.error('❌ 构建过程中出现错误:', error.message);
  process.exit(1);
});

