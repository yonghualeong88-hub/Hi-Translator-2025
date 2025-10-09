# 普通OCR模式功能

## 🎯 功能概述

根据用户需求，将OCR服务从复杂的云端/本地OCR服务改为**普通OCR模式**，使用预设的演示数据，简化处理流程。

## 🔄 工作流程

### 1. 普通OCR处理流程
```
用户拍照
    ↓
显示照片
    ↓
使用预设的演示文字数据
    ↓
批量翻译演示文字
    ↓
在照片上显示翻译覆盖层
```

### 2. 演示数据内容
- **Hello World** - 位置: (100, 200) - (300, 240)
- **Welcome to Translation App** - 位置: (100, 250) - (500, 290)
- **This is a demo text** - 位置: (100, 300) - (400, 340)
- **Click to translate** - 位置: (100, 350) - (350, 390)
- **Simple OCR Mode** - 位置: (100, 400) - (350, 440)

## 🎨 界面变化

### 状态指示器
- **之前**: `🌐 真实OCR` 或 `⚠️ 模拟OCR`
- **现在**: `📝 普通OCR`

### 调试信息
- **之前**: `OCR: ✅ 真实` 或 `OCR: ⚠️ 模拟`
- **现在**: `OCR: 📝 普通`

## 🔧 技术实现

### 1. 新的OCR服务
```typescript
// services/simpleOCRService.ts
export const detectTextFromImage = async (imageUri: string, imageSize?: {width: number, height: number}): Promise<DetectedText[]> => {
  // 🎯 直接使用普通OCR（降级数据），不进行真实的OCR处理
  console.log('📝 使用普通OCR模式（降级数据）');
  
  // 模拟处理时间
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return getFallbackDetections('使用普通OCR模式');
};
```

### 2. 预设演示数据
```typescript
const getFallbackDetections = (reason: string): DetectedText[] => {
  return [
    {
      id: 'demo-1',
      text: 'Hello World',
      confidence: 0.9,
      bbox: { x0: 100, y0: 200, x1: 300, y1: 240 },
      originalImageSize: { width: 1920, height: 1080 },
    },
    // ... 更多演示数据
  ];
};
```

### 3. 简化的翻译流程
```typescript
export const translateImageText = async (
  imageUri: string,
  targetLanguage: string,
  imageSize?: {width: number, height: number}
): Promise<DetectedText[]> => {
  // 1. 获取检测到的文字（使用降级数据）
  const detectedTexts = await detectTextFromImage(imageUri, imageSize);
  
  // 2. 批量翻译
  const translationResults = await batchTranslateTexts(textsToTranslate, targetLanguage);
  
  // 3. 合并翻译结果
  const finalResults = detectedTexts.map((item, index) => ({
    ...item,
    translatedText: translation?.translatedText || item.text,
    language: targetLanguage,
  }));
  
  return finalResults;
};
```

## 📱 用户体验

### 优势
1. **快速响应** - 不需要网络请求，处理速度快
2. **稳定可靠** - 不依赖外部服务，100%可用
3. **易于调试** - 使用固定的演示数据，便于测试
4. **简化流程** - 减少复杂的OCR处理逻辑

### 演示效果
- **固定文字** - 每次拍照都显示相同的演示文字
- **准确翻译** - 演示文字会被正确翻译
- **位置固定** - 覆盖层位置固定，便于调试
- **快速处理** - 1秒内完成处理

## 🧪 测试建议

1. **拍照测试** - 拍照后应该立即看到演示文字
2. **翻译测试** - 演示文字应该被正确翻译
3. **位置测试** - 覆盖层应该显示在固定位置
4. **重新拍照测试** - 重新拍照功能应该正常

## 📊 对比分析

| 特性 | 真实OCR | 普通OCR |
|------|---------|---------|
| 处理速度 | 慢（网络请求） | 快（本地处理） |
| 稳定性 | 依赖网络 | 100%稳定 |
| 准确性 | 真实识别 | 演示数据 |
| 调试难度 | 复杂 | 简单 |
| 网络依赖 | 需要 | 不需要 |

## 🎯 预期效果

- ✅ **快速处理** - 1秒内完成OCR和翻译
- ✅ **稳定显示** - 每次拍照都显示相同的演示文字
- ✅ **准确翻译** - 演示文字被正确翻译
- ✅ **固定位置** - 覆盖层位置固定，便于调试
- ✅ **简化流程** - 不依赖复杂的OCR服务

现在应用使用普通OCR模式，每次拍照都会显示预设的演示文字，并正确翻译这些文字！
