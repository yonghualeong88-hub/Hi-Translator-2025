# 安全配置总结

## 🔒 已实施的安全措施

### 1. 环境变量配置
- ✅ 移除了所有硬编码的 API 密钥
- ✅ 使用 `process.env` 从环境变量获取敏感信息
- ✅ 创建了 `env.template` 模板文件
- ✅ 更新了 `.gitignore` 忽略 `.env` 文件

### 2. 安全检查工具
- ✅ 创建了 `scripts/security-check.js` 安全检查工具
- ✅ 检测硬编码的 API 密钥、密码、令牌等敏感信息
- ✅ 检测生产环境中的 `console.log`
- ✅ 支持多种敏感信息模式识别

### 3. 代码质量工具
- ✅ 更新了 `.cursorrules` 加强安全规则
- ✅ 配置了 ESLint 安全规则
- ✅ 集成了 Husky pre-commit 钩子
- ✅ 添加了 `npm run security-check` 脚本

### 4. 修复的文件
- ✅ `config/cameraConfig.ts` - 移除硬编码 API 密钥
- ✅ `components/RealTimeTranslateCamera.tsx` - 使用环境变量
- ✅ `backend/pages/api/translate.ts` - 环境变量检查
- ✅ `backend/pages/api/ocr.ts` - 环境变量检查

## 🛡️ 安全规则配置

### Cursor Rules (.cursorrules)
```json
{
  "rules": {
    "security": {
      "no-hardcoded-api-keys": true,
      "no-secrets-in-code": true,
      "require-env-variables": true,
      "no-console-log-in-prod": true
    }
  }
}
```

### ESLint 规则
- `no-var`: 禁止使用 `var`
- `prefer-const`: 优先使用 `const`
- `no-console`: 警告 `console.log` 使用
- `no-hardcoded-credentials`: 禁止硬编码凭据

## 📋 使用方法

### 1. 设置环境变量
```bash
# 复制模板文件
cp env.template .env

# 编辑 .env 文件，填入真实的 API 密钥
GOOGLE_TRANSLATE_API_KEY=your_actual_api_key
GOOGLE_VISION_API_KEY=your_actual_vision_key
```

### 2. 运行安全检查
```bash
# 手动运行安全检查
npm run security-check

# 在提交前自动检查（通过 Husky）
git commit -m "your message"
```

### 3. 开发工作流
```bash
# 完整的代码质量检查
npm run pre-commit

# 或者分别运行
npm run lint
npm run type-check
npm run security-check
```

## 🔍 安全检查内容

### 检测的敏感信息类型
1. **API 密钥**
   - Google API Key 格式
   - OpenAI API Key 格式
   - Stripe API Key 格式
   - 通用哈希值（MD5, SHA1, SHA256）

2. **密码和令牌**
   - 密码字段
   - 令牌字段
   - 密钥字段
   - 密钥字段

3. **数据库连接**
   - MongoDB 连接字符串
   - MySQL 连接字符串
   - PostgreSQL 连接字符串
   - Redis 连接字符串

4. **其他敏感信息**
   - 信用卡号
   - 社会安全号
   - 私人邮箱地址

5. **生产环境检查**
   - `console.log` 语句
   - 调试信息输出

## 🚨 安全最佳实践

### ✅ 正确做法
```typescript
// 使用环境变量
const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

// 检查环境变量是否存在
if (!apiKey) {
  throw new Error('API key is not configured');
}

// 条件性日志
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

### ❌ 错误做法
```typescript
// 硬编码 API 密钥
const apiKey = "AIzaSyCeCIv8U7ofcoOu-hOAkY18qQRJkc9ZICw";

// 生产环境中的日志
console.log('User data:', sensitiveData);

// 硬编码密码
const password = "mypassword123";
```

## 📁 相关文件

- `.cursorrules` - Cursor 安全规则
- `.eslintrc.json` - ESLint 配置
- `.husky/pre-commit` - Git 提交钩子
- `scripts/security-check.js` - 安全检查工具
- `env.template` - 环境变量模板
- `docs/ENVIRONMENT_SETUP.md` - 环境配置指南

## 🎯 下一步建议

1. **定期运行安全检查**
   - 在每次提交前自动检查
   - 定期手动运行完整检查

2. **监控环境变量**
   - 确保生产环境正确配置
   - 定期轮换 API 密钥

3. **团队培训**
   - 确保所有开发者了解安全规则
   - 定期更新安全最佳实践

4. **持续改进**
   - 根据项目需要调整安全规则
   - 添加新的安全检查模式
