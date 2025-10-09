#!/bin/bash

# 开发环境设置脚本
echo "🚀 设置开发环境..."

# 检查 Node.js 版本
echo "📋 检查 Node.js 版本..."
node_version=$(node -v)
echo "当前 Node.js 版本: $node_version"

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 安装 Husky 钩子
echo "🔧 设置 Git 钩子..."
npm run prepare

# 运行代码检查
echo "🔍 运行代码检查..."
npm run lint

# 运行格式化
echo "✨ 格式化代码..."
npm run format

# 运行类型检查
echo "🔍 运行 TypeScript 类型检查..."
npm run type-check

echo "✅ 开发环境设置完成！"
echo ""
echo "📝 可用命令："
echo "  npm run dev        - 启动开发服务器"
echo "  npm run lint       - 代码检查"
echo "  npm run lint:fix   - 自动修复代码问题"
echo "  npm run format     - 格式化代码"
echo "  npm run type-check - TypeScript 类型检查"
echo ""
echo "🎉 开始开发吧！"
