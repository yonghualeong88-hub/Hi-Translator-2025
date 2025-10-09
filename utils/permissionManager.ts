// 权限管理器 - 预先请求权限避免弹窗
import { Alert, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

/**
 * 预先请求相册权限
 * 在应用启动时调用，避免在保存时弹出权限请求
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  try {
    // 先检查当前权限状态
    const { status: currentStatus } = await MediaLibrary.getPermissionsAsync();
    
    if (currentStatus === 'granted') {
      console.log('✅ 相册权限已授予');
      return true;
    }
    
    if (currentStatus === 'denied') {
      console.log('❌ 相册权限被拒绝');
      return false;
    }
    
    // 只有在未确定状态时才请求权限
    console.log('🔐 请求相册权限...');
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status === 'granted') {
      console.log('✅ 相册权限已授予');
      return true;
    } else {
      console.log('❌ 相册权限被拒绝');
      return false;
    }
  } catch (error) {
    console.error('❌ 请求相册权限失败:', error);
    return false;
  }
};

/**
 * 检查相册权限状态（不请求权限）
 */
export const checkMediaLibraryPermission = async (): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('❌ 检查相册权限失败:', error);
    return false;
  }
};

/**
 * 初始化所有权限
 * 在应用启动时调用
 */
export const initializePermissions = async (): Promise<void> => {
  console.log('🔐 初始化权限...');
  
  try {
    // 请求相册权限
    const mediaPermission = await requestMediaLibraryPermission();
    
    if (!mediaPermission) {
      console.log('⚠️ 相册权限未授予，保存功能可能受限');
    }
    
    console.log('✅ 权限初始化完成');
  } catch (error) {
    console.error('❌ 权限初始化失败:', error);
  }
};
