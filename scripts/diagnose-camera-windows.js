#!/usr/bin/env node

/**
 * Windows兼容的相机诊断脚本
 * 帮助诊断相机权限和限制问题
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 开始相机诊断 (Windows版本)...\n');

// 检查ADB连接
function checkADBConnection() {
  console.log('📱 检查ADB连接...');
  try {
    const result = execSync('adb devices', { 
      encoding: 'utf8',
      timeout: 5000 
    });
    
    if (result.includes('device')) {
      console.log('✅ ADB连接正常');
      console.log(result);
      return true;
    } else {
      console.log('⚠️ 未检测到连接的设备');
      console.log('请确保:');
      console.log('1. 设备已连接并启用USB调试');
      console.log('2. 已安装ADB驱动');
      console.log('3. 设备已授权调试');
      return false;
    }
  } catch (error) {
    console.log('❌ ADB未安装或无法访问');
    console.log('请安装Android SDK Platform Tools');
    return false;
  }
}

// 检查应用权限 (Windows兼容)
function checkAppPermissions() {
  console.log('\n📦 检查应用权限...');
  try {
    // 使用findstr替代grep
    const result = execSync('adb shell dumpsys package com.hltransslater.app', { 
      encoding: 'utf8',
      timeout: 10000 
    });
    
    if (result.includes('CAMERA')) {
      console.log('✅ 发现相机权限配置');
      // 提取权限相关信息
      const lines = result.split('\n');
      const cameraLines = lines.filter(line => line.includes('CAMERA'));
      cameraLines.forEach(line => console.log('  ', line.trim()));
    } else {
      console.log('⚠️ 未发现相机权限配置');
    }
  } catch (error) {
    console.log('⚠️ 无法检查应用权限');
    console.log('错误:', error.message);
  }
}

// 检查设备策略 (Windows兼容)
function checkDevicePolicy() {
  console.log('\n🔒 检查设备策略...');
  try {
    const result = execSync('adb shell dumpsys device_policy', { 
      encoding: 'utf8',
      timeout: 10000 
    });
    
    if (result.includes('camera') || result.includes('Camera')) {
      console.log('⚠️ 发现相机相关策略限制');
      // 查找相关行
      const lines = result.split('\n');
      const cameraLines = lines.filter(line => 
        line.toLowerCase().includes('camera') || 
        line.includes('restrict')
      );
      cameraLines.forEach(line => console.log('  ', line.trim()));
    } else {
      console.log('✅ 未发现相机策略限制');
    }
  } catch (error) {
    console.log('⚠️ 无法检查设备策略');
    console.log('错误:', error.message);
  }
}

// 生成解决方案
function generateSolutions() {
  console.log('\n🛠️ 解决方案建议:');
  
  const solutions = [
    {
      title: '1. 检查设备设置',
      steps: [
        '打开设备设置',
        '进入"应用"或"应用管理"',
        '找到您的翻译应用',
        '检查"权限"设置',
        '确保相机权限已启用'
      ]
    },
    {
      title: '2. 检查设备管理员',
      steps: [
        '打开设备设置',
        '进入"安全"或"安全与隐私"',
        '查看"设备管理员"',
        '检查是否有企业策略限制',
        '如有企业设备，联系IT管理员'
      ]
    },
    {
      title: '3. 检查家长控制',
      steps: [
        '打开设备设置',
        '进入"数字健康"或"家长控制"',
        '检查应用使用限制',
        '确保相机应用未被限制',
        '调整相关设置'
      ]
    },
    {
      title: '4. 重启和清理',
      steps: [
        '完全关闭应用',
        '重启设备',
        '清除应用缓存',
        '重新打开应用',
        '重新授权相机权限'
      ]
    },
    {
      title: '5. 使用替代方案',
      steps: [
        '使用应用内的文本输入模式',
        '从相册选择图片进行翻译',
        '使用语音输入功能',
        '等待系统问题解决'
      ]
    }
  ];

  solutions.forEach(solution => {
    console.log(`\n${solution.title}:`);
    solution.steps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });
  });
}

// 生成诊断报告
function generateReport() {
  console.log('\n📋 生成诊断报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    platform: 'Windows',
    issues: [
      '相机被操作系统限制',
      '设备管理员策略限制',
      '企业设备管理限制',
      '家长控制设置',
      '其他应用占用相机',
      '硬件问题',
      '权限配置错误'
    ],
    solutions: [
      '检查设备设置中的相机权限',
      '检查设备管理员设置',
      '联系IT管理员（企业设备）',
      '检查家长控制设置',
      '关闭其他相机应用',
      '重启设备',
      '清除应用缓存',
      '使用文本输入模式作为替代'
    ],
    troubleshooting_steps: [
      '1. 确保设备已连接并启用USB调试',
      '2. 检查应用权限设置',
      '3. 查看设备管理员策略',
      '4. 检查家长控制设置',
      '5. 重启设备和应用',
      '6. 使用替代功能'
    ]
  };

  const reportPath = path.join(__dirname, 'camera-diagnosis-windows.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('✅ 诊断报告已生成:', reportPath);
  return report;
}

// 主函数
async function main() {
  try {
    const adbConnected = checkADBConnection();
    
    if (adbConnected) {
      checkAppPermissions();
      checkDevicePolicy();
    } else {
      console.log('\n⚠️ 由于ADB连接问题，跳过设备检查');
    }
    
    generateSolutions();
    const report = generateReport();
    
    console.log('\n🎯 诊断完成！');
    console.log('\n💡 快速解决方案:');
    console.log('1. 检查设备设置中的相机权限');
    console.log('2. 重启设备和应用');
    console.log('3. 使用应用内的文本输入模式');
    console.log('4. 如果是企业设备，联系IT管理员');
    
    console.log('\n📞 如需进一步帮助:');
    console.log('1. 查看 docs/CAMERA_TROUBLESHOOTING.md');
    console.log('2. 检查应用内帮助文档');
    console.log('3. 联系技术支持');
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message);
  }
}

// 运行诊断
if (require.main === module) {
  main();
}

module.exports = { 
  main, 
  checkADBConnection, 
  checkAppPermissions, 
  checkDevicePolicy,
  generateSolutions,
  generateReport
};
