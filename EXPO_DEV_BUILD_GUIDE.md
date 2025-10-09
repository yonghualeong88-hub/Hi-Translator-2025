# Expo 开发构建设置指南

## 概述

本指南将帮助你从 Expo 托管工作流迁移到开发构建工作流，以支持 `@react-native-community/netinfo` 等原生模块。

## 前置要求

### 系统要求
- Node.js 18+ 
- Expo CLI 最新版本
- Android Studio (Android 开发)
- Xcode (iOS 开发，仅 macOS)

### 检查工具安装
```bash
# 检查 Node.js 版本
node --version

# 检查 Expo CLI
expo --version

# 检查 Java (Android)
java -version

# 检查 Xcode (iOS, macOS only)
xcodebuild -version
```

## 快速设置

### 1. 运行自动设置脚本
```bash
node scripts/setup-dev-build.js
```

### 2. 手动设置（如果自动脚本失败）

#### 步骤 1: 清理项目
```bash
# 删除 node_modules 和锁定文件
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install
```

#### 步骤 2: 预构建项目
```bash
# 清理并预构建
npx expo prebuild --clean
```

#### 步骤 3: 安装原生依赖

**Android:**
```bash
cd android
./gradlew clean
cd ..
```

**iOS (macOS only):**
```bash
cd ios
pod install
cd ..
```

## 运行应用

### 开发模式
```bash
# 启动开发服务器
npm run start:dev

# 启动并连接 Android
npm run start:dev:android

# 启动并连接 iOS
npm run start:dev:ios
```

### 构建并运行
```bash
# Android
npm run build:dev:android

# iOS
npm run build:dev:ios
```

## 故障排除

### 常见问题

#### 1. NetInfo 仍然报错
**解决方案:**
- 确保 `app.json` 中已添加 `"@react-native-community/netinfo"` 插件
- 重新运行预构建: `npx expo prebuild --clean`
- 清理并重新构建项目

#### 2. Android 构建失败
**检查项:**
- Java 版本 (推荐 JDK 17)
- Android SDK 版本
- Gradle 版本兼容性

**解决方案:**
```bash
cd android
./gradlew clean
./gradlew build
```

#### 3. iOS 构建失败
**检查项:**
- Xcode 版本
- CocoaPods 版本
- iOS 部署目标

**解决方案:**
```bash
cd ios
pod deintegrate
pod install
```

#### 4. 依赖冲突
**解决方案:**
```bash
# 清理所有缓存
npx expo install --fix
npm run clean
```

### 调试技巧

#### 1. 检查原生模块链接
```bash
# 检查已安装的原生模块
npx expo install --check
```

#### 2. 查看构建日志
```bash
# Android 详细日志
npm run build:dev:android -- --verbose

# iOS 详细日志  
npm run build:dev:ios -- --verbose
```

#### 3. 重置 Metro 缓存
```bash
npx expo start --clear
```

## 项目结构变化

设置完成后，你的项目将包含：

```
project/
├── android/          # Android 原生代码
├── ios/              # iOS 原生代码  
├── app/              # Expo Router 应用代码
├── components/       # React Native 组件
├── services/         # 业务逻辑
└── ...
```

## 开发工作流

### 日常开发
1. 启动开发服务器: `npm run start:dev`
2. 在设备/模拟器上运行应用
3. 代码更改会自动热重载

### 添加新的原生模块
1. 安装模块: `npm install <module-name>`
2. 如果模块需要原生配置，添加到 `app.json` 的 plugins 数组
3. 重新预构建: `npx expo prebuild --clean`
4. 重新构建应用

### 发布构建
```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

## 注意事项

1. **首次构建时间长**: 预构建和首次编译可能需要 10-30 分钟
2. **设备连接**: 确保设备或模拟器已正确连接
3. **原生代码**: 现在可以修改 `android/` 和 `ios/` 目录中的原生代码
4. **插件配置**: 所有原生模块都需要在 `app.json` 中配置

## 回滚到托管工作流

如果遇到问题需要回滚：

```bash
# 删除原生目录
rm -rf android ios

# 恢复 app.json (移除原生插件)
# 重新安装依赖
npm install
```

## 支持

如果遇到问题：
1. 查看 [Expo 开发构建文档](https://docs.expo.dev/development/build/)
2. 检查 [NetInfo 文档](https://github.com/react-native-netinfo/react-native-netinfo)
3. 查看项目的 GitHub Issues
