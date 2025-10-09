# 开发指南

## 代码质量工具配置

本项目配置了完整的代码质量工具链，确保代码风格一致性和质量。

### 🔧 工具配置

#### 1. Cursor Rules (`.cursorrules`)
- 自动检查API密钥硬编码
- 禁止使用 `var`，强制使用 `const`/`let`
- 文件行数限制300行
- 禁止内联样式
- 要求错误处理和注释
- 强制使用国际化，禁止硬编码字符串

#### 2. ESLint (`.eslintrc.json`)
- TypeScript 支持
- React 最佳实践
- 代码质量检查
- 自动修复功能

#### 3. Prettier (`.prettierrc`)
- 自动代码格式化
- 统一代码风格
- 单引号、分号、尾随逗号等配置

#### 4. Husky (`.husky/pre-commit`)
- Git 提交前自动运行 ESLint
- 防止提交有问题的代码

### 📝 可用命令

```bash
# 代码检查
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# 代码格式化
npm run format

# 检查格式化
npm run format:check

# TypeScript 类型检查
npm run type-check

# 安装 Husky 钩子
npm run prepare
```

### 🚀 开发流程

1. **安装依赖**
   ```bash
   npm install
   npm run prepare  # 安装 Husky 钩子
   ```

2. **开发时**
   - Cursor 会自动检查代码质量
   - 保存时自动格式化代码
   - ESLint 实时提示问题

3. **提交前**
   - Husky 自动运行 ESLint 检查
   - 只有通过检查才能提交

### 📋 代码规范

#### 变量声明
```typescript
// ✅ 正确
const name = 'John';
let age = 25;

// ❌ 错误
var name = 'John';
```

#### 组件大小
```typescript
// ✅ 正确 - 小于300行
export default function MyComponent() {
  // 组件逻辑
}

// ❌ 错误 - 超过300行需要拆分
```

#### 样式
```typescript
// ✅ 正确 - 使用 StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// ❌ 错误 - 内联样式
<View style={{ flex: 1 }} />
```

#### 错误处理
```typescript
// ✅ 正确 - 有错误处理
const fetchData = async () => {
  try {
    const response = await api.getData();
    return response;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
};

// ❌ 错误 - 没有错误处理
const fetchData = async () => {
  const response = await api.getData();
  return response;
};
```

#### 国际化
```typescript
// ✅ 正确 - 使用国际化
import { t } from '../utils/i18n';

<Text>{t('common.loading')}</Text>

// ❌ 错误 - 硬编码字符串
<Text>加载中...</Text>
```

### 🔒 安全规范

#### API 密钥
```typescript
// ✅ 正确 - 使用环境变量
const apiKey = process.env.GOOGLE_API_KEY;

// ❌ 错误 - 硬编码密钥
const apiKey = "AIzaSyCeCIv8U7ofcoOu-hOAkY18qQRJkc9ZICw";
```

#### 生产环境控制台日志
```typescript
// ✅ 正确 - 条件性日志
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// ❌ 错误 - 生产环境中的日志
console.log('User data:', sensitiveData);
```

#### 安全检查工具
```bash
# 运行安全检查
npm run security-check

# 检查特定文件
node scripts/security-check.js
```

### 🎨 代码风格规范

#### 文件大小
```typescript
// ✅ 正确 - 小于300行
export default function MyComponent() {
  // 组件逻辑
}

// ❌ 错误 - 超过300行需要拆分
```

#### 函数长度
```typescript
// ✅ 正确 - 小于50行
const handleSubmit = async () => {
  // 处理逻辑
};

// ❌ 错误 - 超过50行需要拆分
```

#### 样式规范
```typescript
// ✅ 正确 - 使用 StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

// ✅ 正确 - 使用 Tailwind
<View className="flex-1 bg-white">

// ❌ 错误 - 内联样式
<View style={{ flex: 1, backgroundColor: '#fff' }}>
```

#### 变量声明
```typescript
// ✅ 正确 - 使用 const
const apiKey = process.env.API_KEY;

// ✅ 正确 - 使用 let（需要重新赋值）
let counter = 0;
counter++;

// ❌ 错误 - 使用 var
var name = 'John';
```

#### 风格检查工具
```bash
# 运行风格检查
npm run style-check

# 检查特定文件
node scripts/style-check.js
```

### 📁 项目结构

```
project/
├── .cursorrules          # Cursor 规则配置
├── .eslintrc.json        # ESLint 配置
├── .prettierrc           # Prettier 配置
├── .husky/               # Git 钩子
│   └── pre-commit
├── .vscode/              # VS Code 配置
│   └── settings.json
├── .editorconfig         # 编辑器配置
├── app/                  # 应用页面
├── components/           # React 组件
├── hooks/                # 自定义 Hooks
├── services/             # 服务层
├── utils/                # 工具函数
├── locales/              # 国际化文件
│   ├── zh-CN.json
│   └── en.json
├── scripts/              # 脚本文件
│   ├── setup-dev.sh
│   ├── setup-dev.bat
│   └── InternalBytecode.js
├── dist/                 # 构建输出目录
├── releases/             # 发布版本目录
│   └── app-debug.apk
└── backend/              # 后端 API
```

### 🐛 常见问题

#### ESLint 错误
```bash
# 自动修复
npm run lint:fix

# 查看具体错误
npm run lint
```

#### 格式化问题
```bash
# 自动格式化
npm run format
```

#### Husky 钩子不工作
```bash
# 重新安装
npm run prepare
```

### 📚 相关文档

- [ESLint 规则](https://eslint.org/docs/rules/)
- [Prettier 配置](https://prettier.io/docs/en/configuration.html)
- [Husky 使用](https://typicode.github.io/husky/)
- [TypeScript ESLint](https://typescript-eslint.io/)
