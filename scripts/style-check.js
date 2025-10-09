#!/usr/bin/env node

/**
 * 代码风格检查工具
 * 检查代码整洁度和风格规范
 */

const fs = require('fs');
const path = require('path');

// 需要检查的文件扩展名
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// 需要忽略的目录
const IGNORE_DIRS = ['node_modules', '.git', '.expo', 'dist', 'build', '.next', 'android', 'ios'];

// 需要忽略的文件
const IGNORE_FILES = ['package-lock.json', 'yarn.lock'];

// 风格检查规则
const STYLE_RULES = {
  // 检查文件行数
  maxLinesPerFile: 300,
  
  // 检查函数行数
  maxLinesPerFunction: 50,
  
  // 检查内联样式
  checkInlineStyles: true,
  
  // 检查 var 声明
  checkVarDeclarations: true,
  
  // 检查 const/let 使用
  checkConstUsage: true,
};

/**
 * 检查文件中的内联样式
 */
function checkInlineStyles(content, filePath) {
  const issues = [];
  
  // 检查 React Native 内联样式（排除 StyleSheet 引用）
  const inlineStylePatterns = [
    /style\s*=\s*\{\s*\{[^}]*\}\s*\}/g, // style={{ ... }}
    /style\s*=\s*\{[^}]*\}/g, // style={ ... }
  ];
  
  // 排除 StyleSheet 引用和数组样式
  const excludePatterns = [
    /styles\.\w+/g, // styles.container
    /\[styles\.\w+/g, // [styles.container
    /style\s*=\s*\{[^}]*styles\.\w+/g, // style={styles.container}
  ];
  
  inlineStylePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // 检查是否包含 StyleSheet 引用，如果是则跳过
        const hasStyleSheetRef = excludePatterns.some(excludePattern => 
          excludePattern.test(match)
        );
        
        if (!hasStyleSheetRef) {
          const lines = content.substring(0, content.indexOf(match)).split('\n');
          issues.push({
            type: 'inline-style',
            message: '发现内联样式，建议使用 StyleSheet.create() 或 Tailwind',
            line: lines.length,
            match: match.substring(0, 50) + '...',
            file: filePath,
          });
        }
      });
    }
  });
  
  return issues;
}

/**
 * 检查 var 声明
 */
function checkVarDeclarations(content, filePath) {
  const issues = [];
  
  const varPattern = /\bvar\s+\w+/g;
  const matches = content.match(varPattern);
  
  if (matches) {
    matches.forEach(match => {
      const lines = content.substring(0, content.indexOf(match)).split('\n');
      issues.push({
        type: 'var-declaration',
        message: '发现 var 声明，建议使用 const 或 let',
        line: lines.length,
        match: match,
        file: filePath,
      });
    });
  }
  
  return issues;
}

/**
 * 检查函数长度
 */
function checkFunctionLength(content, filePath) {
  const issues = [];
  
  // 匹配函数定义
  const functionPatterns = [
    /function\s+\w+\s*\([^)]*\)\s*\{/g,
    /const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/g,
    /const\s+\w+\s*=\s*(?:async\s+)?function\s*\([^)]*\)\s*\{/g,
  ];
  
  functionPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const matchIndex = content.indexOf(match);
        const lines = content.substring(0, matchIndex).split('\n');
        const startLine = lines.length;
        
        // 计算函数结束位置
        let braceCount = 0;
        let inFunction = false;
        let currentIndex = matchIndex;
        
        while (currentIndex < content.length) {
          const char = content[currentIndex];
          if (char === '{') {
            braceCount++;
            inFunction = true;
          } else if (char === '}') {
            braceCount--;
            if (inFunction && braceCount === 0) {
              break;
            }
          }
          currentIndex++;
        }
        
        const endLine = content.substring(0, currentIndex).split('\n').length;
        const functionLength = endLine - startLine;
        
        if (functionLength > STYLE_RULES.maxLinesPerFunction) {
          issues.push({
            type: 'function-too-long',
            message: `函数过长 (${functionLength} 行)，建议拆分为更小的函数`,
            line: startLine,
            match: match,
            file: filePath,
            functionLength: functionLength,
          });
        }
      });
    }
  });
  
  return issues;
}

/**
 * 检查文件内容
 */
function checkFileStyle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // 检查文件行数
  const lineCount = content.split('\n').length;
  if (lineCount > STYLE_RULES.maxLinesPerFile) {
    issues.push({
      type: 'file-too-long',
      message: `文件过长 (${lineCount} 行)，建议拆分为更小的文件`,
      line: 1,
      match: `文件总行数: ${lineCount}`,
      file: filePath,
      lineCount: lineCount,
    });
  }
  
  // 检查内联样式
  if (STYLE_RULES.checkInlineStyles) {
    issues.push(...checkInlineStyles(content, filePath));
  }
  
  // 检查 var 声明
  if (STYLE_RULES.checkVarDeclarations) {
    issues.push(...checkVarDeclarations(content, filePath));
  }
  
  // 检查函数长度
  issues.push(...checkFunctionLength(content, filePath));
  
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
            issues.push(...checkFileStyle(fullPath));
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
  console.log('🎨 开始代码风格检查...\n');
  
  const projectRoot = process.cwd();
  const issues = scanDirectory(projectRoot);
  
  if (issues.length === 0) {
    console.log('✅ 代码风格检查通过！');
    process.exit(0);
  }
  
  console.log(`❌ 发现 ${issues.length} 个风格问题：\n`);
  
  // 按类型分组显示问题
  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) {
      acc[issue.type] = [];
    }
    acc[issue.type].push(issue);
    return acc;
  }, {});
  
  Object.entries(groupedIssues).forEach(([type, typeIssues]) => {
    console.log(`📋 ${type.toUpperCase().replace('-', ' ')} (${typeIssues.length} 个问题):`);
    typeIssues.forEach(issue => {
      console.log(`  📁 ${issue.file}:${issue.line}`);
      console.log(`     🔍 ${issue.message}`);
      if (issue.match) {
        console.log(`     📝 匹配: ${issue.match}`);
      }
      if (issue.functionLength) {
        console.log(`     📏 函数长度: ${issue.functionLength} 行`);
      }
      if (issue.lineCount) {
        console.log(`     📏 文件长度: ${issue.lineCount} 行`);
      }
      console.log('');
    });
  });
  
  console.log('💡 建议：');
  console.log('  - 使用 StyleSheet.create() 替代内联样式');
  console.log('  - 使用 const/let 替代 var');
  console.log('  - 将长函数拆分为更小的函数');
  console.log('  - 将长文件拆分为更小的文件');
  console.log('  - 考虑使用 Tailwind CSS 或 styled-components');
  
  process.exit(1);
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = { checkFileStyle, scanDirectory, STYLE_RULES };
