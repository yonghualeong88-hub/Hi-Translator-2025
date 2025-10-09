# 环境变量配置指南

## 🔐 安全配置

### 1. 创建环境变量文件

在项目根目录创建 `.env` 文件：

```bash
# 复制模板文件
cp .env.example .env
```

### 2. 必需的环境变量

```bash
# Google Translate API Key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here

# Google Vision API Key (用于 OCR)
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# API 基础 URL
TRANSLATE_API_URL=https://translation.googleapis.com/language/translate/v2
VISION_API_URL=https://vision.googleapis.com/v1/images:annotate

# 应用环境
NODE_ENV=development
```

### 3. 获取 API 密钥

#### Google Translate API
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Translation API
4. 创建 API 密钥
5. 将密钥添加到 `.env` 文件

#### Google Vision API
1. 在同一个 Google Cloud 项目中
2. 启用 Vision API
3. 使用相同的 API 密钥或创建新的

### 4. 安全最佳实践

#### ✅ 正确做法
```typescript
// 使用环境变量
const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

// 检查环境变量是否存在
if (!apiKey) {
  throw new Error('GOOGLE_TRANSLATE_API_KEY is not set');
}
```

#### ❌ 错误做法
```typescript
// 硬编码 API 密钥
const apiKey = "AIzaSyCeCIv8U7ofcoOu-hOAkY18qQRJkc9ZICw";

// 在代码中直接写密钥
const config = {
  apiKey: "your-secret-key-here"
};
```

### 5. 生产环境配置

#### 使用环境变量
```bash
# 设置环境变量
export GOOGLE_TRANSLATE_API_KEY=your_production_key
export NODE_ENV=production
```

#### 使用 Docker
```dockerfile
# Dockerfile
ENV GOOGLE_TRANSLATE_API_KEY=your_production_key
ENV NODE_ENV=production
```

#### 使用云服务
- **Vercel**: 在项目设置中添加环境变量
- **Netlify**: 在站点设置中添加环境变量
- **AWS**: 使用 AWS Secrets Manager
- **Azure**: 使用 Azure Key Vault

### 6. 安全检查

运行安全检查工具：

```bash
# 检查项目中的安全问题
npm run security-check

# 在提交前自动检查
git commit -m "your message"
```

### 7. 常见问题

#### Q: 如何知道哪些环境变量是必需的？
A: 查看 `backend/pages/api/` 目录下的 API 文件，它们会检查必需的环境变量。

#### Q: 开发环境和生产环境使用不同的 API 密钥吗？
A: 是的，建议使用不同的 API 密钥，并设置不同的配额限制。

#### Q: 如何保护 API 密钥不被泄露？
A: 
- 永远不要将 `.env` 文件提交到 Git
- 使用 `.gitignore` 忽略敏感文件
- 定期轮换 API 密钥
- 在生产环境中使用安全的密钥管理服务

### 8. 故障排除

#### 错误：API 密钥未设置
```
Error: GOOGLE_TRANSLATE_API_KEY is not set
```
**解决方案**: 检查 `.env` 文件是否存在且包含正确的环境变量。

#### 错误：API 密钥无效
```
Error: The provided API key is invalid
```
**解决方案**: 检查 API 密钥是否正确，以及是否已启用相应的 API 服务。

#### 错误：配额超限
```
Error: Quota exceeded
```
**解决方案**: 检查 Google Cloud Console 中的配额设置，或升级到付费计划。
