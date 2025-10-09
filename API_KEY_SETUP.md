# API Key 配置指南

## 🔑 Google Translation API Key 配置

### 问题
当前出现错误：`Method doesn't allow unregistered callers (callers without established identity)`

这是因为没有配置有效的 Google Translation API Key。

### 解决方案

#### 方案1：配置 Google Translation API Key（推荐）

1. **获取 API Key**
   - 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - 创建新项目或选择现有项目
   - 启用 "Cloud Translation API"
   - 创建 API Key

2. **配置环境变量**
   ```bash
   # 在项目根目录创建 .env 文件
   EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY=your_actual_api_key_here
   EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_vision_api_key_here
   ```

3. **重启应用**
   ```bash
   npm start -- --clear
   ```

#### 方案2：使用现有翻译服务（当前实现）

系统已经自动回退到现有的翻译服务，无需额外配置。

### 当前状态

✅ **自动回退机制已实现**
- 如果 Google API Key 未配置 → 使用现有翻译服务
- 如果 Google API Key 无效 → 自动回退到现有翻译服务
- 如果翻译失败 → 显示原文作为 fallback

### 测试

现在可以正常使用翻译功能，系统会：
1. 尝试使用 Google Translation API（如果配置了 Key）
2. 自动回退到现有翻译服务
3. 确保翻译功能正常工作

### 日志输出

查看控制台日志：
- `⚠️ 未配置Google Translate API Key，使用现有翻译服务`
- `🔄 Google API Key无效，回退到现有翻译服务`
- `✅ 现有翻译服务完成`
