# 构建指南 - 包含原生模块的版本

## 🎯 概述

由于应用使用了`react-native-view-shot`原生模块来实现截图功能，需要构建包含原生代码的版本才能在真机上运行。

## 📱 支持的平台

- **iOS** - 需要Xcode和iOS开发环境
- **Android** - 需要Android Studio和Android开发环境

## 🛠 构建步骤

### 方法1：使用EAS Build（推荐）

#### 1. 安装EAS CLI
```bash
npm install -g @expo/eas-cli
```

#### 2. 登录Expo账户
```bash
eas login
```

#### 3. 配置EAS Build
```bash
eas build:configure
```

#### 4. 构建开发版本
```bash
# iOS开发版本
eas build --platform ios --profile development

# Android开发版本
eas build --platform android --profile development
```

#### 5. 构建生产版本
```bash
# iOS生产版本
eas build --platform ios --profile production

# Android生产版本
eas build --platform android --profile production
```

### 方法2：本地构建

#### iOS构建

1. **生成iOS项目**
```bash
npx expo prebuild --platform ios
```

2. **安装依赖**
```bash
cd ios && pod install && cd ..
```

3. **构建项目**
```bash
npx expo run:ios
```

#### Android构建

1. **生成Android项目**
```bash
npx expo prebuild --platform android
```

2. **构建项目**
```bash
npx expo run:android
```

## 🔧 配置要求

### iOS配置

确保`app.json`中包含以下配置：

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.hltransslater.app"
    },
    "plugins": [
      "expo-media-library",
      "react-native-vision-camera"
    ]
  }
}
```

### Android配置

确保`app.json`中包含以下配置：

```json
{
  "expo": {
    "android": {
      "package": "com.hltransslater.app",
      "permissions": [
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

## 📦 依赖包说明

### 核心依赖
- `expo-media-library` - 相册访问
- `expo-sharing` - 图片分享
- `expo-image-manipulator` - 图片处理
- `react-native-view-shot` - 截图功能（原生模块）

### 原生模块说明
`react-native-view-shot`需要原生代码支持，因此：
- 在Expo Go中无法运行
- 需要构建包含原生代码的版本
- 支持iOS和Android平台

## 🚀 功能特性

### 截图保存功能
- **真正的翻译图片**：保存带有翻译覆盖层的完整图片
- **高质量输出**：支持自定义质量和格式
- **跨平台兼容**：iOS和Android都支持

### 保存选项
1. **仅原图片** - 保存拍摄的原始照片
2. **仅翻译图片** - 保存带有翻译覆盖层的图片
3. **同时保存两种** - 一次性保存原图和翻译图
4. **分享图片** - 分享到其他应用

## 🔍 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清理缓存
npx expo prebuild --clean

# 重新安装依赖
rm -rf node_modules && npm install
```

#### 2. 原生模块错误
```bash
# 确保原生模块已正确链接
npx expo install --fix
```

#### 3. 权限问题
- 确保在`app.json`中配置了正确的权限
- 检查设备设置中的应用权限

### 调试技巧

#### 1. 查看构建日志
```bash
eas build:list
eas build:view [BUILD_ID]
```

#### 2. 本地调试
```bash
# 启用详细日志
npx expo run:ios --verbose
npx expo run:android --verbose
```

## 📋 构建检查清单

### 构建前检查
- [ ] 所有依赖包已安装
- [ ] 权限配置正确
- [ ] 原生模块配置完整
- [ ] 测试脚本通过

### 构建后检查
- [ ] 应用正常启动
- [ ] 相机功能正常
- [ ] 保存功能正常
- [ ] 截图功能正常
- [ ] 权限请求正常

## 🎯 性能优化

### 构建优化
- 使用`--profile production`进行生产构建
- 启用代码压缩和优化
- 配置适当的图片质量

### 运行时优化
- 合理设置截图质量
- 异步处理保存操作
- 适当的错误处理

## 📱 测试建议

### 真机测试
1. 在iOS和Android设备上测试
2. 测试不同屏幕尺寸
3. 测试不同权限状态
4. 测试网络连接情况

### 功能测试
1. 拍照功能
2. 翻译功能
3. 保存功能
4. 分享功能
5. 截图功能

## 🔮 未来扩展

### 可能的改进
1. **云构建**：使用EAS Build进行云端构建
2. **自动化**：集成CI/CD流程
3. **分发**：自动分发到应用商店
4. **监控**：集成错误监控和分析

---

**注意**：由于使用了原生模块，此应用无法在Expo Go中运行，必须构建包含原生代码的版本。

