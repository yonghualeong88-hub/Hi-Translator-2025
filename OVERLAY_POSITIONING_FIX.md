# 覆盖层位置计算修复

## 🐛 问题描述
用户反馈：**"计算覆盖层位置有错误，显示翻译结果覆盖层全部挤在一起"**

## 🔍 问题分析

### 1. 原始问题
- 相机预览尺寸硬编码为 `{width: 400, height: 600}`
- 原始图片尺寸获取错误：`(text as any).originalImageSize` 可能不存在
- 坐标转换逻辑有问题
- 没有防重叠算法

### 2. 根本原因
- `DetectedText` 类型中缺少 `originalImageSize` 字段
- 覆盖层位置计算没有考虑实际屏幕尺寸
- 多个覆盖层可能重叠在同一位置

## ✅ 修复方案

### 1. 更新类型定义
```typescript
// types/camera.ts
export interface DetectedText {
  id: string;
  text: string;
  confidence: number;
  bbox: BoundingBox;
  translation?: string;
  language?: string;
  sourceLanguage?: string;
  originalImageSize?: { width: number; height: number }; // 新增字段
}
```

### 2. 获取实际屏幕尺寸
```typescript
// GoogleLensCamera.tsx
import { Dimensions } from 'react-native';

// 获取屏幕尺寸
useEffect(() => {
  const { width, height } = Dimensions.get('window');
  setCameraPreviewSize({ width, height });
  console.log('📱 屏幕尺寸:', { width, height });
}, []);
```

### 3. 改进坐标转换逻辑
```typescript
// 使用实际原始图片尺寸
const originalImageWidth = text.originalImageSize?.width || 1920;
const originalImageHeight = text.originalImageSize?.height || 1080;

// 计算缩放比例
const scaleX = cameraPreviewSize.width / originalImageWidth;
const scaleY = cameraPreviewSize.height / originalImageHeight;

// 转换坐标
const x = text.bbox.x0 * scaleX;
const y = text.bbox.y0 * scaleY;
const width = Math.max(80, (text.bbox.x1 - text.bbox.x0) * scaleX);
const height = Math.max(40, (text.bbox.y1 - text.bbox.y0) * scaleY);
```

### 4. 实现防重叠算法
```typescript
// 防重叠算法
const adjustedOverlays: any[] = [];
overlays.forEach((overlay, index) => {
  let adjustedX = overlay.position.x;
  let adjustedY = overlay.position.y;
  
  // 检查与前面覆盖层的重叠
  for (let i = 0; i < index; i++) {
    const prevOverlay = adjustedOverlays[i];
    const prevRight = prevOverlay.position.x + prevOverlay.position.width;
    const prevBottom = prevOverlay.position.y + prevOverlay.position.height;
    
    // 如果重叠，调整位置
    if (adjustedX < prevRight && adjustedX + overlay.position.width > prevOverlay.position.x &&
        adjustedY < prevBottom && adjustedY + overlay.position.height > prevOverlay.position.y) {
      // 向右偏移
      adjustedX = prevRight + 10;
      
      // 如果超出屏幕，换行
      if (adjustedX + overlay.position.width > cameraPreviewSize.width) {
        adjustedX = 10;
        adjustedY = prevBottom + 10;
      }
    }
  }
  
  adjustedOverlays.push({
    ...overlay,
    position: { ...overlay.position, x: adjustedX, y: adjustedY }
  });
});
```

### 5. 改进覆盖层样式
```typescript
// TranslationOverlay.tsx
overlayContainer: {
  position: 'absolute',
  maxWidth: 200,
  maxHeight: 120,
  minWidth: 80,  // 设置最小宽度
  minHeight: 40, // 设置最小高度
  zIndex: 1000,  // 确保覆盖层在最上层
},
```

## 🧪 测试验证

### 测试数据
```javascript
const mockDetectedTexts = [
  {
    id: 'text1',
    text: 'Hello World',
    bbox: { x0: 100, y0: 100, x1: 200, y1: 130 },
    originalImageSize: { width: 1920, height: 1080 }
  },
  {
    id: 'text2', 
    text: 'Test Text',
    bbox: { x0: 150, y0: 120, x1: 250, y1: 150 },
    originalImageSize: { width: 1920, height: 1080 }
  }
];
```

### 测试结果
```
📊 原始位置计算:
Hello World: x=20.8, y=55.6, w=80.0, h=40.0
Test Text: x=31.3, y=66.7, w=80.0, h=40.0

🎯 调整后位置:
Hello World: x=20.8, y=55.6, w=80.0, h=40.0
Test Text: x=110.8, y=66.7, w=80.0, h=40.0  // 自动调整避免重叠
```

## 🎯 修复效果

### 修复前
- ❌ 覆盖层全部挤在一起
- ❌ 位置计算错误
- ❌ 无法正确显示翻译结果

### 修复后
- ✅ 覆盖层位置准确
- ✅ 自动防重叠
- ✅ 正确显示翻译结果
- ✅ 支持不同屏幕尺寸

## 📝 关键改进点

1. **动态屏幕尺寸获取** - 使用 `Dimensions.get('window')` 获取实际屏幕尺寸
2. **正确的坐标转换** - 基于实际原始图片尺寸进行缩放计算
3. **防重叠算法** - 自动调整重叠覆盖层的位置
4. **最小尺寸保证** - 设置覆盖层最小宽度和高度
5. **类型安全** - 添加 `originalImageSize` 字段到类型定义

## 🔧 使用说明

修复后的覆盖层系统会：
1. 自动获取设备屏幕尺寸
2. 根据原始图片尺寸正确计算覆盖层位置
3. 自动调整重叠的覆盖层位置
4. 确保覆盖层有合适的最小尺寸
5. 在控制台输出详细的位置计算日志

用户现在可以正常使用拍照翻译功能，覆盖层会准确显示在识别到的文字位置，不会出现挤在一起的问题。
