// 修复版 useGoogleLensCamera.ts
import { CameraState, GoogleLensConfig } from '@/types/camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

export const useGoogleLensCamera = (initialConfig: Partial<GoogleLensConfig> = {}) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    hasPermission: false, // 初始设为false，等待权限检查
    isProcessing: false,
    error: null,
  });

  const [config, setConfig] = useState<GoogleLensConfig>({
    detectionMode: 'photo',
    translationEnabled: true,
    overlayStyle: 'replace',
    targetLanguage: 'zh-CN',
    ...initialConfig,
  });

  // 🎯 简单修复：确保相机正确激活
  useEffect(() => {
    console.log('🔍 权限状态检查:', { hasPermission, device: device?.name });
    
    setCameraState(prev => ({
      ...prev,
      hasPermission,
    }));

    // 如果有权限和设备，激活相机
    if (hasPermission && device) {
      console.log('🚀 激活相机');
      setCameraState(prev => ({
        ...prev,
        isActive: true,
        error: null,
      }));
    }
  }, [hasPermission, device]);

  // 🎯 强制激活相机 - 防止黑屏
  useEffect(() => {
    if (hasPermission && device && !cameraState.isActive) {
      console.log('🔄 强制激活相机');
      setTimeout(() => {
        setCameraState(prev => ({
          ...prev,
          isActive: true,
        }));
      }, 100);
    }
  }, [hasPermission, device, cameraState.isActive]);

  // 🎯 添加相机错误监听 - 增强版
  const handleCameraError = useCallback((error: any) => {
    console.error('📷 相机错误:', error);
    
    let errorMessage = '相机发生未知错误';
    let errorType = 'unknown';
    
    if (error.message) {
      if (error.message.includes('restricted')) {
        errorMessage = 'camera-is-restricted: 相机功能被操作系统限制';
        errorType = 'restricted';
      } else if (error.message.includes('permission')) {
        errorMessage = 'camera-permission-denied: 相机权限被拒绝';
        errorType = 'permission';
      } else if (error.message.includes('device')) {
        errorMessage = 'camera-device-error: 相机设备错误';
        errorType = 'device';
      } else {
        errorMessage = `camera-error: ${error.message}`;
        errorType = 'general';
      }
    }
    
    // console.log('🚨 相机错误详情:', {
    //   type: errorType,
    //   message: errorMessage,
    //   originalError: error.message,
    //   timestamp: new Date().toISOString()
    // });
    
    setCameraState(prev => ({
      ...prev,
      error: errorMessage,
      isActive: false,
    }));
  }, []);

  // 🎯 修复：请求相机权限
  const requestCameraPermission = useCallback(async () => {
    try {
      // console.log('📷 请求相机权限...');
      const granted = await requestPermission();
      
      // console.log('📷 权限请求结果:', granted);
      
      setCameraState(prev => ({
        ...prev,
        hasPermission: granted,
        error: granted ? null : '相机权限被拒绝',
        isActive: granted && device ? true : false,
      }));
      
      return granted;
    } catch (error) {
      console.error('❌ 请求相机权限失败:', error);
      setCameraState(prev => ({
        ...prev,
        error: '请求相机权限失败: ' + (error as Error).message,
      }));
      return false;
    }
  }, [requestPermission, device]);

  // 🎯 简单启动相机
  const startCamera = useCallback(() => {
    console.log('🎬 启动相机', { hasPermission, device: device?.name });
    
    if (!hasPermission) {
      requestCameraPermission();
      return;
    }
    
    if (!device) {
      console.error('❌ 无可用相机设备');
      setCameraState(prev => ({
        ...prev,
        error: '未找到可用的相机设备',
      }));
      return;
    }

    // 强制激活相机
    setCameraState(prev => ({
      ...prev,
      isActive: true,
      error: null,
    }));
  }, [hasPermission, device, requestCameraPermission]);

  // 🎯 修复：停止相机
  const stopCamera = useCallback(() => {
    // console.log('🛑 停止相机');
    setCameraState(prev => ({
      ...prev,
      isActive: false,
      isProcessing: false,
    }));
  }, []);

  // 🎯 组件卸载时清理相机
  useEffect(() => {
    return () => {
      // console.log('🧹 组件卸载，清理相机资源');
      setCameraState(prev => ({
        ...prev,
        isActive: false,
        isProcessing: false,
      }));
    };
  }, []);

  // 🎯 拍照
  const takePhoto = useCallback(async () => {
    // console.log('📸 尝试拍照', { 
    //   hasCameraRef: !!cameraRef.current, 
    //   isActive: cameraState.isActive 
    // });
    
    if (!cameraRef.current || !cameraState.isActive) {
      console.warn('⚠️ 相机未就绪，无法拍照');
      return null;
    }

    try {
      setCameraState(prev => ({ ...prev, isProcessing: true }));
      
      // console.log('📸 执行拍照...');
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });

      console.log('✅ 拍照成功:', photo.path);
      return photo;
    } catch (error) {
      console.error('❌ 拍照失败:', error);
      setCameraState(prev => ({
        ...prev,
        error: '拍照失败: ' + (error as Error).message,
      }));
      return null;
    } finally {
      setCameraState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [cameraState.isActive]);

  // 更新配置
  const updateConfig = useCallback((newConfig: Partial<GoogleLensConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return {
    // 状态
    cameraState,
    config,
    device,
    
    // 引用
    cameraRef,
    
    // 方法
    requestCameraPermission,
    startCamera,
    stopCamera,
    takePhoto,
    updateConfig,
    handleCameraError,
  };
};
