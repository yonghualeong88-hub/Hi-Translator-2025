# 代码风格指南

## 🎨 风格规则配置

### Cursor Rules (.cursorrules)
```json
{
  "rules": {
    "style": {
      "prefer-const": true,
      "no-var": true,
      "max-lines-per-file": 300,
      "max-lines-per-function": 50,
      "no-inline-styles": true,
      "require-tailwind-or-stylesheet": true
    }
  }
}
```

### ESLint 规则
- `no-var`: 禁止使用 `var`
- `prefer-const`: 优先使用 `const`
- `max-lines`: 文件最大行数 300
- `max-lines-per-function`: 函数最大行数 50
- `react-native/no-inline-styles`: 禁止内联样式

## 📏 代码长度规范

### 文件大小限制
- **最大行数**: 300 行
- **建议行数**: 200 行以下
- **超过限制**: 需要拆分为更小的文件

### 函数长度限制
- **最大行数**: 50 行
- **建议行数**: 30 行以下
- **超过限制**: 需要拆分为更小的函数

## 🎯 样式规范

### ✅ 推荐做法

#### 使用 StyleSheet.create()
```typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

// 使用
<View style={styles.container}>
  <Text style={styles.title}>标题</Text>
</View>
```

#### 使用 Tailwind CSS
```typescript
// 如果项目配置了 Tailwind
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold text-gray-800">标题</Text>
</View>
```

#### 动态样式
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  dynamicText: {
    fontSize: 16,
  },
});

// 动态颜色
<Text style={[styles.dynamicText, { color: isActive ? '#007AFF' : '#666' }]}>
  动态文本
</Text>
```

### ❌ 避免做法

#### 内联样式
```typescript
// ❌ 错误 - 内联样式
<View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
    标题
  </Text>
</View>
```

#### 复杂的内联样式
```typescript
// ❌ 错误 - 复杂的内联样式
<View style={{
  flex: 1,
  backgroundColor: isDark ? '#000' : '#fff',
  padding: 16,
  marginTop: 20,
  borderRadius: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}}>
```

## 🔧 变量声明规范

### ✅ 推荐做法

#### 使用 const（默认）
```typescript
// 常量
const API_URL = 'https://api.example.com';
const MAX_RETRIES = 3;

// 对象和数组
const user = { name: 'John', age: 30 };
const items = ['apple', 'banana', 'orange'];

// 函数
const handleSubmit = async () => {
  // 处理逻辑
};
```

#### 使用 let（需要重新赋值）
```typescript
// 计数器
let counter = 0;
counter++;

// 条件变量
let message = '';
if (isError) {
  message = '发生错误';
} else {
  message = '操作成功';
}
```

### ❌ 避免做法

#### 使用 var
```typescript
// ❌ 错误 - 使用 var
var name = 'John';
var age = 30;
var isActive = true;
```

## 📁 文件组织规范

### 组件拆分原则
1. **单一职责**: 每个组件只负责一个功能
2. **可复用性**: 组件应该可以在不同地方使用
3. **可测试性**: 组件应该易于测试

### 文件命名规范
- **组件文件**: PascalCase (如 `UserProfile.tsx`)
- **工具文件**: camelCase (如 `formatDate.ts`)
- **常量文件**: camelCase (如 `apiConfig.ts`)
- **类型文件**: camelCase (如 `userTypes.ts`)

### 目录结构
```
components/
├── common/           # 通用组件
│   ├── Button.tsx
│   └── Input.tsx
├── forms/            # 表单组件
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
└── layout/           # 布局组件
    ├── Header.tsx
    └── Footer.tsx
```

## 🛠️ 工具使用

### 风格检查
```bash
# 运行风格检查
npm run style-check

# 检查特定文件
node scripts/style-check.js

# 自动修复（部分问题）
npm run lint:fix
```

### 代码格式化
```bash
# 格式化所有文件
npm run format

# 检查格式
npm run format:check
```

### 完整检查
```bash
# 运行所有检查
npm run pre-commit

# 包括：
# - ESLint 检查
# - TypeScript 类型检查
# - 安全检查
# - 风格检查
```

## 📋 检查清单

### 提交前检查
- [ ] 文件行数 < 300
- [ ] 函数行数 < 50
- [ ] 没有内联样式
- [ ] 使用 const/let 而不是 var
- [ ] 代码已格式化
- [ ] 通过了所有检查

### 代码审查要点
- [ ] 组件职责单一
- [ ] 样式使用 StyleSheet 或 Tailwind
- [ ] 变量命名清晰
- [ ] 函数逻辑简单
- [ ] 没有重复代码

## 🎯 最佳实践

### 1. 组件设计
```typescript
// ✅ 好的组件设计
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function Button({ title, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const styles = StyleSheet.create({
    button: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: variant === 'primary' ? '#007AFF' : '#F2F2F7',
    },
    text: {
      color: variant === 'primary' ? '#FFF' : '#007AFF',
      textAlign: 'center',
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={onPress} disabled={disabled}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}
```

### 2. 样式管理
```typescript
// ✅ 好的样式管理
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
});
```

### 3. 函数拆分
```typescript
// ❌ 函数过长
const handleUserRegistration = async (userData: UserData) => {
  // 验证数据 (20行)
  // 检查用户是否存在 (15行)
  // 创建用户 (25行)
  // 发送欢迎邮件 (20行)
  // 记录日志 (10行)
};

// ✅ 拆分为小函数
const validateUserData = (userData: UserData) => { /* 20行 */ };
const checkUserExists = async (email: string) => { /* 15行 */ };
const createUser = async (userData: UserData) => { /* 25行 */ };
const sendWelcomeEmail = async (email: string) => { /* 20行 */ };
const logUserRegistration = (userId: string) => { /* 10行 */ };

const handleUserRegistration = async (userData: UserData) => {
  validateUserData(userData);
  await checkUserExists(userData.email);
  const user = await createUser(userData);
  await sendWelcomeEmail(userData.email);
  logUserRegistration(user.id);
};
```

## 📚 相关资源

- [React Native 样式指南](https://reactnative.dev/docs/style)
- [ESLint 规则文档](https://eslint.org/docs/rules/)
- [Prettier 配置选项](https://prettier.io/docs/en/options.html)
- [TypeScript 编码规范](https://typescript-eslint.io/rules/)
