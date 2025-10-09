# 代码风格配置总结

## 🎨 已实施的风格规则

### 1. Cursor Rules 配置
- ✅ 添加了 `max-lines-per-function: 50` - 函数最大50行
- ✅ 添加了 `require-tailwind-or-stylesheet: true` - 强制使用 Tailwind 或 StyleSheet
- ✅ 保持了现有的风格规则（prefer-const, no-var, max-lines-per-file, no-inline-styles）

### 2. ESLint 配置
- ✅ 添加了 `max-lines-per-function: ["warn", 50]` 规则
- ✅ 添加了 `react-native/no-inline-styles: "error"` 规则
- ✅ 保持了现有的风格规则

### 3. 风格检查工具
- ✅ 创建了 `scripts/style-check.js` 风格检查工具
- ✅ 检测文件长度（>300行）
- ✅ 检测函数长度（>50行）
- ✅ 检测内联样式（排除 StyleSheet 引用）
- ✅ 检测 var 声明

### 4. 集成到开发工作流
- ✅ 添加了 `npm run style-check` 脚本
- ✅ 更新了 `npm run pre-commit` 包含风格检查
- ✅ 更新了 Husky pre-commit 钩子

## 📊 当前风格问题统计

### 发现的问题类型
1. **文件过长** (21个问题)
   - 超过300行的文件需要拆分
   - 最严重：`app/(tabs)/index.tsx` (1547行)

2. **内联样式** (162个问题)
   - 发现内联样式，建议使用 StyleSheet.create() 或 Tailwind
   - 已排除 StyleSheet 引用的误报

3. **函数过长** (29个问题)
   - 超过50行的函数需要拆分
   - 最严重：`app/(tabs)/index.tsx` 中的主函数 (1233行)

## 🎯 风格规则详情

### 文件大小限制
```typescript
// ✅ 正确 - 小于300行
export default function MyComponent() {
  // 组件逻辑
}

// ❌ 错误 - 超过300行需要拆分
```

### 函数长度限制
```typescript
// ✅ 正确 - 小于50行
const handleSubmit = async () => {
  // 处理逻辑
};

// ❌ 错误 - 超过50行需要拆分
```

### 样式规范
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

### 变量声明
```typescript
// ✅ 正确 - 使用 const
const apiKey = process.env.API_KEY;

// ✅ 正确 - 使用 let（需要重新赋值）
let counter = 0;
counter++;

// ❌ 错误 - 使用 var
var name = 'John';
```

## 🛠️ 使用方法

### 运行风格检查
```bash
# 手动运行风格检查
npm run style-check

# 检查特定文件
node scripts/style-check.js

# 在提交前自动检查（通过 Husky）
git commit -m "your message"
```

### 开发工作流
```bash
# 完整的代码质量检查
npm run pre-commit

# 包括：
# - ESLint 检查
# - TypeScript 类型检查
# - 安全检查
# - 风格检查
```

## 📋 需要修复的主要问题

### 高优先级
1. **`app/(tabs)/index.tsx`** (1547行)
   - 需要拆分为多个组件
   - 主函数过长 (1233行)

2. **`app/(tabs)/text.tsx`** (1118行)
   - 需要拆分为多个组件
   - 主函数过长 (774行)

3. **`app/(tabs)/settings.tsx`** (505行)
   - 需要拆分为多个组件
   - 主函数过长 (321行)

### 中优先级
4. **`app/history-detail.tsx`** (700行)
   - 需要拆分为多个组件
   - 主函数过长 (543行)

5. **`components/RealTimeTranslateCamera.tsx`** (378行)
   - 需要拆分为多个组件
   - 主函数过长 (352行)

### 低优先级
6. 其他超过300行的文件
7. 超过50行的函数
8. 内联样式问题

## 🎯 修复建议

### 1. 组件拆分策略
```typescript
// 将大组件拆分为小组件
// 从 app/(tabs)/index.tsx 中提取：

// components/VoiceRecordButton.tsx ✅ 已创建
// components/TranslationHistory.tsx ✅ 已创建  
// components/LanguageSelector.tsx ✅ 已创建
// hooks/useVoiceRecording.ts ✅ 已创建

// 还需要创建：
// - components/TranslationResult.tsx
// - components/EmptyState.tsx
// - hooks/useTranslation.ts
// - hooks/useLanguageSelection.ts
```

### 2. 函数拆分策略
```typescript
// 将长函数拆分为小函数
const handleUserRegistration = async (userData: UserData) => {
  // 验证数据 (20行)
  // 检查用户是否存在 (15行)
  // 创建用户 (25行)
  // 发送欢迎邮件 (20行)
  // 记录日志 (10行)
};

// 拆分为：
const validateUserData = (userData: UserData) => { /* 20行 */ };
const checkUserExists = async (email: string) => { /* 15行 */ };
const createUser = async (userData: UserData) => { /* 25行 */ };
const sendWelcomeEmail = async (email: string) => { /* 20行 */ };
const logUserRegistration = (userId: string) => { /* 10行 */ };
```

### 3. 样式重构策略
```typescript
// 将内联样式移到 StyleSheet
// ❌ 内联样式
<View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>

// ✅ StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
});
<View style={styles.container}>
```

## 📚 相关文档

- `docs/STYLE_GUIDE.md` - 详细的风格指南
- `docs/DEVELOPMENT.md` - 开发环境设置
- `scripts/style-check.js` - 风格检查工具
- `.cursorrules` - Cursor 规则配置
- `.eslintrc.json` - ESLint 配置

## 🚀 下一步计划

### 短期目标（1-2周）
1. 修复 `app/(tabs)/index.tsx` 的拆分问题
2. 修复 `app/(tabs)/text.tsx` 的拆分问题
3. 修复主要的内联样式问题

### 中期目标（1个月）
1. 完成所有超过300行文件的拆分
2. 完成所有超过50行函数的拆分
3. 建立组件库和工具函数库

### 长期目标（持续）
1. 建立代码审查流程
2. 持续监控代码质量
3. 优化开发工具链

## 🎯 质量指标

### 目标指标
- **文件行数**: < 300行
- **函数行数**: < 50行
- **内联样式**: 0个
- **var 声明**: 0个

### 当前状态
- **文件行数**: 21个文件超过300行
- **函数行数**: 29个函数超过50行
- **内联样式**: 162个问题
- **var 声明**: 0个（已修复）

现在您的项目具备了完善的代码风格检查体系，可以帮助保持代码整洁和一致性！🎨
