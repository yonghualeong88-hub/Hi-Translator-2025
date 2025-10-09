# 图片操作按钮功能说明

## 🎯 功能概述

新增的图片操作按钮提供了重新翻译和保存功能，让用户可以：
- **重新翻译**：对当前图片重新进行OCR识别和翻译
- **保存图片**：选择保存原图片或翻译图片到相册
- **分享图片**：通过系统分享功能分享图片

## 🚀 功能特性

### 1. 重新翻译按钮 🔄
- **功能**：重新对当前图片进行OCR识别和翻译
- **状态**：显示翻译进度，防止重复点击
- **确认**：点击前会弹出确认对话框
- **样式**：蓝色主题，带刷新图标

### 2. 保存按钮 💾
- **功能**：提供多种保存选项
- **选项**：
  - 保存原图片（无翻译覆盖层）
  - 保存翻译图片（带翻译覆盖层）
  - 分享图片
- **权限**：自动请求相册权限
- **反馈**：保存成功/失败提示
- **样式**：绿色主题，带下载图标

## 📱 界面设计

### 按钮布局
```
┌─────────────────────────────────────┐
│  [🔄 重新翻译]    [💾 保存]        │
└─────────────────────────────────────┘
```

### 样式特点
- **半透明背景**：`rgba(0, 0, 0, 0.8)`
- **圆角设计**：`borderRadius: 15`
- **阴影效果**：iOS/Android平台适配
- **响应式**：支持触摸反馈
- **状态指示**：加载动画和禁用状态

## 🔧 技术实现

### 核心组件
1. **ImageActionButtons**：主按钮组件
2. **imageSaver**：图片保存工具
3. **集成到GoogleLensCamera**：无缝集成

### 依赖库
```json
{
  "expo-media-library": "保存到相册",
  "expo-file-system": "文件系统操作", 
  "expo-sharing": "分享功能",
  "expo-image-manipulator": "图片处理"
}
```

### 权限要求
- **相册权限**：`MediaLibrary.requestPermissionsAsync()`
- **文件系统权限**：自动处理

## 📋 使用方式

### 基础使用
```typescript
<ImageActionButtons
  imageUri={capturedPhoto}
  overlays={detectedTexts}
  onRetranslate={handleRetakePhoto}
  isRetranslating={isProcessingImage}
  style={styles.actionButtons}
/>
```

### 参数说明
- `imageUri`: 当前显示的图片URI
- `overlays`: 检测到的文本数组
- `onRetranslate`: 重新翻译回调函数
- `isRetranslating`: 是否正在翻译中
- `style`: 自定义样式

## 🎨 自定义配置

### 按钮样式
```typescript
const styles = StyleSheet.create({
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
  },
  retranslateButton: {
    backgroundColor: '#007AFF', // 蓝色
  },
  saveButton: {
    backgroundColor: '#34C759', // 绿色
  },
});
```

### 保存选项
```typescript
const saveOptions = {
  quality: 0.8,        // 图片质量
  format: SaveFormat.JPEG, // 保存格式
  includeMetadata: true,   // 包含元数据
};
```

## 🔄 工作流程

### 重新翻译流程
1. 用户点击"重新翻译"按钮
2. 显示确认对话框
3. 用户确认后开始重新处理
4. 显示加载状态
5. 完成翻译后更新界面

### 保存流程
1. 用户点击"保存"按钮
2. 显示保存选项对话框
3. 用户选择保存类型
4. 请求相册权限
5. 处理并保存图片
6. 显示保存结果

## 🐛 错误处理

### 常见错误
- **权限不足**：提示用户授权相册权限
- **保存失败**：显示具体错误信息
- **分享不可用**：提示设备不支持分享

### 错误恢复
- 自动重试机制
- 用户友好的错误提示
- 降级处理方案

## 📊 性能优化

### 图片处理
- 自动压缩优化
- 格式转换
- 内存管理

### 用户体验
- 异步处理
- 进度指示
- 防重复点击

## 🔮 未来扩展

### 计划功能
- [ ] 批量保存多张图片
- [ ] 自定义保存路径
- [ ] 图片编辑功能
- [ ] 云端同步保存
- [ ] 翻译历史记录

### 技术改进
- [ ] 更好的图片合成
- [ ] 更快的处理速度
- [ ] 更小的文件大小
- [ ] 更好的错误处理
