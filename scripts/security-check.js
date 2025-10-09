#!/usr/bin/env node

/**
 * 安全配置检查工具
 * 检查项目中的安全问题
 */

const fs = require('fs');
const path = require('path');

// 敏感信息模式
const SECURITY_PATTERNS = {
  // API 密钥模式
  apiKeys: [
    /AIza[0-9A-Za-z-_]{35}/, // Google API Key
    /sk-[0-9A-Za-z]{48}/, // OpenAI API Key
    /pk_[0-9A-Za-z]{24}/, // Stripe Public Key
    /sk_[0-9A-Za-z]{24}/, // Stripe Secret Key
    /[0-9a-f]{32}/, // MD5 hash (可能是密钥)
    /[0-9a-f]{40}/, // SHA1 hash (可能是密钥)
    /[0-9a-f]{64}/, // SHA256 hash (可能是密钥)
  ],
  
  // 密码和令牌模式
  passwords: [
    /password\s*[:=]\s*["'][^"']+["']/i,
    /passwd\s*[:=]\s*["'][^"']+["']/i,
    /pwd\s*[:=]\s*["'][^"']+["']/i,
    /token\s*[:=]\s*["'][^"']+["']/i,
    /secret\s*[:=]\s*["'][^"']+["']/i,
    /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
  ],
  
  // 数据库连接字符串
  database: [
    /mongodb:\/\/[^\/]+\/[^\/]+/,
    /mysql:\/\/[^\/]+\/[^\/]+/,
    /postgresql:\/\/[^\/]+\/[^\/]+/,
    /redis:\/\/[^\/]+\/[^\/]+/,
  ],
  
  // 硬编码的敏感信息
  hardcoded: [
    /["'][0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}["']/, // 信用卡号
    /["'][0-9]{3}-[0-9]{2}-[0-9]{4}["']/, // SSN
    // 排除公开的邮箱地址（如支持邮箱）
    /["'](?!.*support|.*info|.*contact)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}["']/, // 邮箱
  ],
};

// 需要检查的文件扩展名
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

// 需要忽略的目录
const IGNORE_DIRS = ['node_modules', '.git', '.expo', 'dist', 'build', '.next', 'android', 'ios'];

// 需要忽略的文件
const IGNORE_FILES = ['package-lock.json', 'yarn.lock'];

/**
 * 检查文件内容中的安全问题
 */
function checkFileSecurity(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // 检查各种安全模式
  Object.entries(SECURITY_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach((pattern, index) => {
      const matches = content.match(new RegExp(pattern, 'g'));
      if (matches) {
        matches.forEach(match => {
          issues.push({
            category,
            pattern: pattern.toString(),
            match,
            file: filePath,
            line: content.substring(0, content.indexOf(match)).split('\n').length,
          });
        });
      }
    });
  });
  
  // 检查硬编码的 console.log
  if (process.env.NODE_ENV === 'production') {
    const consoleMatches = content.match(/console\.(log|warn|error|info)/g);
    if (consoleMatches) {
      consoleMatches.forEach(match => {
        issues.push({
          category: 'console-log',
          pattern: 'console.log in production',
          match,
          file: filePath,
          line: content.substring(0, content.indexOf(match)).split('\n').length,
        });
      });
    }
  }
  
  return issues;
}

/**
 * 递归扫描目录
 */
function scanDirectory(dirPath) {
  const issues = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!IGNORE_DIRS.includes(item)) {
          issues.push(...scanDirectory(fullPath));
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (FILE_EXTENSIONS.includes(ext) && !IGNORE_FILES.includes(item)) {
          try {
            issues.push(...checkFileSecurity(fullPath));
          } catch (error) {
            console.warn(`Warning: Could not check file ${fullPath}: ${error.message}`);
          }
        }
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
  }
  
  return issues;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始安全扫描...\n');
  
  const projectRoot = process.cwd();
  const issues = scanDirectory(projectRoot);
  
  if (issues.length === 0) {
    console.log('✅ 未发现安全问题！');
    process.exit(0);
  }
  
  console.log(`❌ 发现 ${issues.length} 个安全问题：\n`);
  
  // 按类别分组显示问题
  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {});
  
  Object.entries(groupedIssues).forEach(([category, categoryIssues]) => {
    console.log(`📋 ${category.toUpperCase()} (${categoryIssues.length} 个问题):`);
    categoryIssues.forEach(issue => {
      console.log(`  📁 ${issue.file}:${issue.line}`);
      console.log(`     🔍 匹配: ${issue.match}`);
      console.log(`     📝 模式: ${issue.pattern}`);
      console.log('');
    });
  });
  
  console.log('💡 建议：');
  console.log('  - 将敏感信息移到环境变量中');
  console.log('  - 使用 .env 文件存储配置');
  console.log('  - 确保 .env 文件在 .gitignore 中');
  console.log('  - 生产环境移除 console.log');
  
  process.exit(1);
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = { checkFileSecurity, scanDirectory, SECURITY_PATTERNS };
