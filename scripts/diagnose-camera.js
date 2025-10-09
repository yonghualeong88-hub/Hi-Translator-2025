#!/usr/bin/env node

/**
 * 相机诊断脚本
 * 帮助诊断相机权限和限制问题
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 开始相机诊断...\n');

// 检查Android权限
function checkAndroidPermissions() {
  console.log('📱 检查Android权限...');
  try {
    // 检查相机权限
    const result = execSync('adb shell dumpsys package | grep -A 10 "android.permission.CAMERA"', { 
      encoding: 'utf8',
      timeout: 5000 
    });
    console.log('✅ Android权限检查完成');
    console.log(result);
  } catch (error) {
    console.log('⚠️ 无法检查Android权限 (可能需要连接设备)');
    console.log('错误:', error.message);
  }
}

// 检查设备策略
function checkDevicePolicy() {
  console.log('\n🔒 检查设备策略...');
  try {
    const result = execSync('adb shell dumpsys device_policy', { 
      encoding: 'utf8',
      timeout: 5000 
    });
    
    if (result.includes('camera')) {
      console.log('⚠️ 发现相机相关策略限制');
      console.log(result);
    } else {
      console.log('✅ 未发现相机策略限制');
    }
  } catch (error) {
    console.log('⚠️ 无法检查设备策略');
    console.log('错误:', error.message);
  }
}

// 检查应用权限
function checkAppPermissions() {
  console.log('\n📦 检查应用权限...');
  try {
    const result = execSync('adb shell dumpsys package com.hltransslater.app | grep -A 5 -B 5 "CAMERA"', { 
      encoding: 'utf8',
      timeout: 5000 
    });
    console.log('应用权限状态:');
    console.log(result);
  } catch (error) {
    console.log('⚠️ 无法检查应用权限');
    console.log('错误:', error.message);
  }
}

// 生成诊断报告
function generateReport() {
  console.log('\n📋 生成诊断报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    issues: [],
    solutions: []
  };

  // 常见问题和解决方案
  report.issues = [
    '相机被操作系统限制',
    '设备管理员策略限制',
    '企业设备管理限制',
    '家长控制设置',
    '其他应用占用相机',
    '硬件问题'
  ];

  report.solutions = [
    '检查设备管理员设置',
    '联系IT管理员（企业设备）',
    '检查家长控制设置',
    '关闭其他相机应用',
    '重启设备',
    '检查相机硬件',
    '使用文本输入模式作为替代'
  ];

  const reportPath = path.join(__dirname, 'camera-diagnosis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('✅ 诊断报告已生成:', reportPath);
  return report;
}

// 主函数
async function main() {
  try {
    checkAndroidPermissions();
    checkDevicePolicy();
    checkAppPermissions();
    
    const report = generateReport();
    
    console.log('\n🎯 诊断完成！');
    console.log('\n常见解决方案:');
    report.solutions.forEach((solution, index) => {
      console.log(`${index + 1}. ${solution}`);
    });
    
    console.log('\n💡 建议:');
    console.log('1. 如果是企业设备，联系IT管理员');
    console.log('2. 检查设备是否启用了家长控制');
    console.log('3. 确保没有其他应用正在使用相机');
    console.log('4. 尝试重启设备');
    console.log('5. 使用应用内的文本输入模式作为替代');
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message);
  }
}

// 运行诊断
if (require.main === module) {
  main();
}

module.exports = { main, checkAndroidPermissions, checkDevicePolicy, checkAppPermissions };
