// 简化版 GoogleLensCamera.tsx - 只支持普通拍照翻译
import { getLanguageDisplayName, SUPPORTED_LANGUAGES } from '@/constants/languages';
import { useI18n } from '@/contexts/I18nContext';
import { useGoogleLensCamera } from '@/hooks/useGoogleLensCamera';
import { useTextDetection } from '@/hooks/useTextDetection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Dimensions, ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import TextTicker from 'react-native-text-ticker';
import ViewShot from 'react-native-view-shot';
import { Camera } from 'react-native-vision-camera';
import { ImagePreprocessingService } from '../../services/imagePreprocessingService';
import { ImageActionButtons } from '../ImageActionButtons';

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

const GoogleLensCamera: React.FC<{ targetLanguage: string }> = ({
  targetLanguage: initialTargetLanguage,
}) => {
  const { t } = useI18n();
  
  // 🎯 语言选择状态
  const [sourceLanguage, setSourceLanguage] = useState('auto'); // 源语言（图片中的语言，默认自动检测）
  const [targetLanguage, setTargetLanguage] = useState(initialTargetLanguage || 'zh-CN'); // 目标语言（翻译成）
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectingLanguageType, setSelectingLanguageType] = useState<'source' | 'target'>('source');
  
  const {
    cameraState,
    config,
    device,
    cameraRef,
    startCamera,
    takePhoto,
    updateConfig,
    requestCameraPermission,
    handleCameraError,
    stopCamera,
  } = useGoogleLensCamera({ targetLanguage });

  const {
    detectedTexts,
    setDetectedTexts,
    isProcessing,
    isUsingRealOCR,
    lastError,
    processImage,
  } = useTextDetection({ targetLanguage });

  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // 🎯 添加处理状态锁，防止并发处理
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  // 🎯 相机预览尺寸状态 - 使用实际屏幕尺寸
  const [cameraPreviewSize, setCameraPreviewSize] = useState({width: 0, height: 0});
  
  // 🎯 添加照片显示状态
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showPhoto, setShowPhoto] = useState(false);
  
  // 🎯 自动调正相关状态
  const [isAutoCorrecting, setIsAutoCorrecting] = useState(false);
  const [correctedPhoto, setCorrectedPhoto] = useState<string | null>(null);
  
  // 🎯 照片真实尺寸（从Image.onLoad获取）
  const [realPhotoSize, setRealPhotoSize] = useState<{width: number, height: number} | null>(null);
  
  // 🎯 照片显示区域的ref，用于截图
  const photoViewRef = useRef<View>(null);
  
  // 🎯 缩放和平移状态
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // 🎯 获取屏幕尺寸
  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    setCameraPreviewSize({ width, height });
    console.log('📱 屏幕尺寸:', { width, height });
  }, []);

  // 🎯 保存语言选择到 AsyncStorage
  const saveLanguageSelection = useCallback(async (sourceLang: string, targetLang: string) => {
    try {
      await AsyncStorage.setItem('cameraTranslationLanguages', JSON.stringify({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      }));
    } catch (error) {
      console.error('保存语言选择失败:', error);
    }
  }, []);

  // 🎯 从 AsyncStorage 加载语言选择
  const loadLanguageSelection = useCallback(async () => {
    try {
      const savedLanguages = await AsyncStorage.getItem('cameraTranslationLanguages');
      if (savedLanguages) {
        const { sourceLanguage: savedSource, targetLanguage: savedTarget } = JSON.parse(savedLanguages);
        setSourceLanguage(savedSource || 'auto');
        setTargetLanguage(savedTarget || 'zh-CN');
      }
    } catch (error) {
      console.error('加载语言选择失败:', error);
    }
  }, []);

  // 🎯 组件加载时加载语言选择
  useEffect(() => {
    loadLanguageSelection();
  }, [loadLanguageSelection]);

  // 🎯 监听应用状态，在后台时停止相机
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('🛑 App进入后台，停止相机');
        stopCamera();
      } else if (nextAppState === 'active') {
        console.log('🚀 App回到前台，检查相机状态');
        // 不自动启动，让用户手动启动
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [stopCamera]);

  // 🎯 诊断：组件挂载时检查状态
  useEffect(() => {
    console.log('🔍 相机组件挂载，当前状态:', {
      hasPermission: cameraState.hasPermission,
      isActive: cameraState.isActive,
      device: device?.name,
      isUsingRealOCR,
      detectedTextsCount: detectedTexts.length,
    });

    // 更新调试信息
    setDebugInfo(`权限: ${cameraState.hasPermission ? '✅' : '❌'} | 激活: ${cameraState.isActive ? '✅' : '❌'} | OCR: ${isUsingRealOCR ? '真实' : '模拟'}`);

    // 如果没有权限，自动请求
    if (!cameraState.hasPermission) {
      console.log('🔐 无权限，自动请求...');
      requestCameraPermission();
    }
  }, [cameraState.hasPermission, cameraState.isActive, device, isUsingRealOCR, detectedTexts.length, requestCameraPermission]);

  // 🎯 监听检测结果变化
  useEffect(() => {
    if (detectedTexts.length > 0) {
      console.log('📝 检测到文字:', detectedTexts.length, '个');
      console.log('📝 检测结果:', detectedTexts.map(t => ({ text: t.text, confidence: t.confidence })));
    }
  }, [detectedTexts, isUsingRealOCR]);

  // 🎯 处理图片的核心函数 - 简化版
  const handleProcessImage = useCallback(async (imagePath: string, imageSize?: {width: number, height: number}) => {
    if (isProcessingImage) {
      // console.log('⏳ 正在处理图片，跳过重复请求');
      return;
    }

    try {
      setIsProcessingImage(true);
      console.log('🔄 开始处理图片:', imagePath, { sourceLanguage, targetLanguage });
      
      // 清除之前的检测结果
      setDetectedTexts([]);
      
      // 处理图片 - 传入用户选择的源语言
      await processImage(imagePath, imageSize, sourceLanguage);
      
      console.log('✅ 图片处理完成');
    } catch (error) {
      console.error('❌ 图片处理失败:', error);
    } finally {
      setIsProcessingImage(false);
    }
  }, [isProcessingImage, processImage, setDetectedTexts, sourceLanguage, targetLanguage]);

  // 🎯 自动调正图片
  const handleAutoCorrect = useCallback(async (photoUri: string) => {
    if (isAutoCorrecting) return;
    
    setIsAutoCorrecting(true);
    try {
      console.log('🔄 开始自动调正图片...');
      
      const result = await ImagePreprocessingService.autoCorrectImage(photoUri, {
        autoRotate: false, // 暂时禁用
        autoPerspective: false, // 暂时禁用
        enhanceContrast: true, // 启用对比度增强
        sharpen: true, // 启用自动锐化
      });
      
      const finalPhotoUri = result.correctedImageUri;
      setCorrectedPhoto(finalPhotoUri);
      
      console.log('✅ 自动调正完成:', result);
      
      // ✅ 使用调正后的图片尺寸进行OCR处理
      const correctedSize = result.correctedSize || result.originalSize || { width: 1536, height: 2048 };
      await processImage(finalPhotoUri, correctedSize, sourceLanguage);
      
    } catch (error) {
      console.error('❌ 自动调正失败:', error);
      // 如果调正失败，使用原始图片
      await processImage(photoUri, undefined, sourceLanguage);
    } finally {
      setIsAutoCorrecting(false);
    }
  }, [processImage, isAutoCorrecting]);


  // 🎯 拍照按钮处理函数 - 显示照片模式
  const handleTakePicture = useCallback(async () => {
      if (isProcessingImage) {
      // console.log('⏳ 请等待当前处理完成');
        return;
      }
      
      const photo = await takePhoto();
      if (photo) {
        // 🎯 修复照片URI格式 - 确保以 file:// 开头
        const photoUri = photo.path.startsWith('file://') 
          ? photo.path 
          : `file://${photo.path}`;
        
        // console.log('📸 照片路径信息:', {
        //   originalPath: photo.path,
        //   formattedUri: photoUri,
        //   hasFilePrefix: photo.path.startsWith('file://')
        // });
        
        // 🎯 先显示拍摄的照片
        setCapturedPhoto(photoUri);
        setShowPhoto(true);
        
        // 🎯 自动调正图片
        await handleAutoCorrect(photoUri);
        
        // 🎯 使用实际的相机分辨率
        // ⚠️ 关键：photo.width/height 可能是 undefined
        // console.log('📸 拍照元数据:', {
        //   path: photo.path,
        //   width: photo.width,
        //   height: photo.height,
        //   orientation: photo.orientation,
        //   isRawPhoto: photo.isRawPhoto
        // });
        
        // 🎯 关键修复：根据orientation调整尺寸
        // Android相机可能会交换宽高
        let photoWidth = photo.width || 1536;
        let photoHeight = photo.height || 2048;
        
        // 如果是portrait模式但宽>高，交换宽高
        if (photo.orientation === 'portrait' && photoWidth > photoHeight) {
          // console.warn('⚠️ 检测到方向问题，交换宽高');
          [photoWidth, photoHeight] = [photoHeight, photoWidth];
        }
        
        const actualImageSize = {
          width: photoWidth,
          height: photoHeight
        };
        
        // console.log('📸 最终使用的尺寸（已修正方向）:', {
        //   原始宽高: { width: photo.width, height: photo.height },
        //   修正后: actualImageSize,
        //   orientation: photo.orientation
        // });
        
        // 🎯 在后台处理图片，不阻塞UI（传原始路径给OCR服务）
        handleProcessImage(photo.path, actualImageSize);
      }
  }, [isProcessingImage, takePhoto, handleProcessImage, cameraPreviewSize]);

  // 🎯 导入图片处理
  const handleImportImage = useCallback(async () => {
    if (isProcessingImage) {
      return;
    }

    try {
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('camera.permissionDenied', '权限不足'), t('camera.galleryPermissionRequired', '需要相册权限才能导入图片'));
        return;
      }

      // 打开图片选择器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.uri;
        const imageSize = {
          width: asset.width || 1536,
          height: asset.height || 2048
        };

        console.log('📷 导入图片:', {
          uri: imageUri,
          size: imageSize
        });

        // 设置照片并显示
        setCapturedPhoto(imageUri);
        setShowPhoto(true);
        
        // 处理图片
        handleProcessImage(imageUri, imageSize);
      }
    } catch (error) {
      console.error('❌ 导入图片失败:', error);
      Alert.alert(t('camera.importFailed', '导入失败'), t('camera.importFailedMessage', '无法导入图片，请重试'));
    }
  }, [isProcessingImage, handleProcessImage]);

  // 🎯 缩放手势（限制：最小1倍，最大5倍）
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      // 限制缩放范围：1-5倍
      scale.value = Math.max(1, Math.min(5, newScale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      
      // 如果缩放回到1倍，重置位置
      if (scale.value === 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // 🎯 拖动手势（只有放大后才能拖动，且限制在图片边界内）
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // 只有缩放大于1时才允许拖动
      if (scale.value > 1) {
        const newTranslateX = savedTranslateX.value + e.translationX;
        const newTranslateY = savedTranslateY.value + e.translationY;
        
        // 计算图片放大后的尺寸
        const scaledWidth = cameraPreviewSize.width * scale.value;
        const scaledHeight = cameraPreviewSize.height * scale.value;
        
        // 计算边界（图片不能被拖出屏幕）
        const maxTranslateX = (scaledWidth - cameraPreviewSize.width) / 2;
        const maxTranslateY = (scaledHeight - cameraPreviewSize.height) / 2;
        
        // 限制拖动范围
        translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
        translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));
      }
    })
    .onEnd(() => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  // 组合手势
  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  // 动画样式
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // 🎯 重新拍照功能
  const handleRetakePhoto = useCallback(() => {
    setShowPhoto(false);
    setCapturedPhoto(null);
    setDetectedTexts([]); // 清除之前的检测结果
    setRealPhotoSize(null); // 清除照片尺寸
    // 重置缩放
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [setDetectedTexts, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);
  
  // 🎯 当获取到真实照片尺寸后，修正所有坐标（只修正一次）
  useEffect(() => {
    if (realPhotoSize && capturedPhoto && detectedTexts.length > 0) {
      const firstText = detectedTexts[0];
      // ✅ 优先使用 ocrImageSize (ML Kit 实际处理的图片尺寸)，如果没有则使用 originalImageSize
      const ocrUsedSize = firstText.ocrImageSize || firstText.originalImageSize;
      
      // ✅ 检查是否已经修正过（originalImageSize 与 realPhotoSize 匹配）
      const alreadyCorrected = firstText.originalImageSize &&
        firstText.originalImageSize.width === realPhotoSize.width &&
        firstText.originalImageSize.height === realPhotoSize.height;
      
      if (ocrUsedSize && !alreadyCorrected &&
          (ocrUsedSize.width !== realPhotoSize.width || 
           ocrUsedSize.height !== realPhotoSize.height)) {
        console.warn('⚠️ 照片尺寸不匹配，修正所有坐标:', {
          OCR使用的尺寸: ocrUsedSize,
          照片真实尺寸: realPhotoSize
        });
        
        // 检测是否需要旋转：OCR图片和显示图片的方向不同
        const needsRotation = (ocrUsedSize.width > ocrUsedSize.height) !== (realPhotoSize.width > realPhotoSize.height);
        
        if (needsRotation) {
          console.log('🔄 检测到图片旋转，OCR坐标需要旋转+缩放变换');
          
          // 🎯 旋转+缩放坐标变换
          const correctedTexts = detectedTexts.map(text => {
            // 步骤1: 顺时针旋转90度：(x, y) -> (height - y, x)
            const rotatedX0 = ocrUsedSize.height - text.bbox.y1;
            const rotatedY0 = text.bbox.x0;
            const rotatedX1 = ocrUsedSize.height - text.bbox.y0;
            const rotatedY1 = text.bbox.x1;
            
            // 步骤2: 缩放到显示尺寸
            // 旋转后的图片尺寸是 height x width (3072 x 4096 -> 需要适配到 1536 x 2048)
            const scaleX = realPhotoSize.width / ocrUsedSize.height;  // 1536 / 3072 = 0.5
            const scaleY = realPhotoSize.height / ocrUsedSize.width;  // 2048 / 4096 = 0.5
            
            const finalX0 = rotatedX0 * scaleX;
            const finalY0 = rotatedY0 * scaleY;
            const finalX1 = rotatedX1 * scaleX;
            const finalY1 = rotatedY1 * scaleY;
            
            console.log('🔄 旋转+缩放坐标变换:', {
              原文: text.text,
              原始坐标: text.bbox,
              OCR尺寸: ocrUsedSize,
              旋转后坐标: { x0: rotatedX0, y0: rotatedY0, x1: rotatedX1, y1: rotatedY1 },
              缩放比例: { scaleX, scaleY },
              最终坐标: { x0: finalX0, y0: finalY0, x1: finalX1, y1: finalY1 },
              显示尺寸: realPhotoSize
            });
            
            return {
              ...text,
              originalImageSize: {
                width: realPhotoSize.width,
                height: realPhotoSize.height
              },
              ocrImageSize: text.ocrImageSize,
              bbox: {
                x0: finalX0,
                y0: finalY0,
                x1: finalX1,
                y1: finalY1,
              },
              fontSize: text.fontSize,
            };
          });
          
          setDetectedTexts(correctedTexts);
        } else {
          // 🎯 正常缩放（不需要旋转）
          const correctedTexts = detectedTexts.map(text => ({
            ...text,
            originalImageSize: {
              width: realPhotoSize.width,
              height: realPhotoSize.height
            },
            ocrImageSize: text.ocrImageSize,
            bbox: {
              x0: text.bbox.x0 * (realPhotoSize.width / ocrUsedSize.width),
              y0: text.bbox.y0 * (realPhotoSize.height / ocrUsedSize.height),
              x1: text.bbox.x1 * (realPhotoSize.width / ocrUsedSize.width),
              y1: text.bbox.y1 * (realPhotoSize.height / ocrUsedSize.height),
            },
            fontSize: text.fontSize 
              ? Math.round(text.fontSize * (realPhotoSize.height / ocrUsedSize.height))
              : text.fontSize
          }));
          
          console.log('✅ 坐标已缩放，使用真实照片尺寸');
          setDetectedTexts(correctedTexts);
        }
      }
    }
  }, [realPhotoSize, capturedPhoto, detectedTexts, setDetectedTexts]);

  // 🎯 语言选择处理
  const handleSelectLanguage = useCallback((languageCode: string) => {
    if (selectingLanguageType === 'source') {
      setSourceLanguage(languageCode);
      // 保存语言选择
      saveLanguageSelection(languageCode, targetLanguage);
    } else {
      setTargetLanguage(languageCode);
      // 保存语言选择
      saveLanguageSelection(sourceLanguage, languageCode);
    }
    setShowLanguageModal(false);
  }, [selectingLanguageType, sourceLanguage, targetLanguage, saveLanguageSelection]);

  const openSourceLanguageModal = useCallback(() => {
    setSelectingLanguageType('source');
    setShowLanguageModal(true);
  }, []);

  const openTargetLanguageModal = useCallback(() => {
    setSelectingLanguageType('target');
    setShowLanguageModal(true);
  }, []);

  // 🎯 如果没有权限，显示详细的权限请求界面
  if (!cameraState.hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>📷 相机翻译</Text>
        <Text style={styles.permissionText}>
          需要相机权限来拍照翻译文字
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permissionButtonText}>授权相机权限</Text>
        </TouchableOpacity>
        {cameraState.error && (
          <Text style={styles.errorText}>{cameraState.error}</Text>
        )}
      </View>
    );
  }

  // 🎯 如果没有设备，显示错误信息
  if (!device) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>❌ 相机错误</Text>
        <Text style={styles.errorText}>未找到可用的相机设备</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={startCamera}
        >
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🎯 相机错误状态
  if (cameraState.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>❌ 相机错误</Text>
        <Text style={styles.errorText}>{cameraState.error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={startCamera}
        >
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showPhoto && capturedPhoto ? (
        // 🎯 照片显示模式
        <View style={styles.photoContainer}>
          {/* 照片和翻译覆盖层 - 使用 ViewShot 包装以支持截图 */}
            <ViewShot
              ref={photoViewRef}
              style={[styles.photoViewShot, { backgroundColor: "#000" }]}
            >
          {/* 背景图片 - 支持手势缩放 */}
          <GestureDetector gesture={composed}>
            <AnimatedImageBackground
              source={{ uri: capturedPhoto }}
              style={[
                { 
                  width: '100%', 
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center'
                },
                animatedStyle
              ]}
              resizeMode="contain"
              imageStyle={{ width: '100%', height: '100%' }}
              onLoad={(e) => {
                // console.log('✅ 照片加载成功:', capturedPhoto);
                const { width: imgWidth, height: imgHeight } = e.nativeEvent.source;
                
                // 🎯 保存真实的照片尺寸
                setRealPhotoSize({ width: imgWidth, height: imgHeight });
                
                // console.log('📐 关键尺寸信息（已保存）:', {
                //   照片真实尺寸: { width: imgWidth, height: imgHeight },
                //   屏幕显示尺寸: cameraPreviewSize,
                //   说明: '现在会用真实尺寸重新计算坐标'
                // });
              }}
              onError={(error) => {
                console.error('❌ 照片加载失败:', error);
                // console.log('📍 照片URI:', capturedPhoto);
                // console.log('📍 showPhoto状态:', showPhoto);
              }}
            >
            {/* 🎯 翻译覆盖层 - 按照参考实现的公式 */}
            {detectedTexts.map(text => {
              // 🎯 关键修复：优先使用从Image.onLoad获取的真实照片尺寸
              const originalWidth = realPhotoSize?.width || text.originalImageSize?.width || 1536;
              const originalHeight = realPhotoSize?.height || text.originalImageSize?.height || 2048;
              
              if (!realPhotoSize) {
                console.warn('⚠️ 照片尺寸未加载，使用备用尺寸');
              }
              
              // 🎯 使用屏幕尺寸进行坐标计算
              const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
              const displayWidth = screenWidth;
              const displayHeight = screenHeight;
              
              // 🎯 按比例换算（参考实现的核心公式）
              const scaleX = displayWidth / originalWidth;
              const scaleY = displayHeight / originalHeight;
              const scale = Math.min(scaleX, scaleY); // contain模式取最小值
              
              // 计算实际显示区域
              const actualDisplayWidth = originalWidth * scale;
              const actualDisplayHeight = originalHeight * scale;
              
              // 居中偏移
              const offsetX = (displayWidth - actualDisplayWidth) / 2;
              const offsetY = (displayHeight - actualDisplayHeight) / 2;
              
              // 🎯 完全使用在线模式的坐标计算方式
              // 坐标缩放修正已经在 useEffect 中处理，这里 text.bbox 已经基于 originalWidth/originalHeight
              
              // 🎯 使用与在线模式完全相同的坐标计算方式
              let left = text.bbox.x0 * scale;
              let top = text.bbox.y0 * scale;
              let boxWidth = (text.bbox.x1 - text.bbox.x0) * scale;
              let boxHeight = (text.bbox.y1 - text.bbox.y0) * scale;
              
              // 🎯 可调节的坐标计算：添加手动偏移量
              const manualOffsetX = 0; // 手动调整X偏移
              const manualOffsetY = 150; // 手动调整Y偏移（与在线模式一致）
              
              left += manualOffsetX;
              top += manualOffsetY;
              
              // 🎯 输出最终位置调试信息
              console.log('🎯 最终位置:', {
                'height': boxHeight,
                'left': left,
                'top': top,
                'width': boxWidth,
                '缩放比例': scale
              });
              
              // 用高度估算字体大小
              // 字体大小 ≈ bbox高度 × 0.8（考虑行距）
              const fontSize = text.fontSize 
                ? Math.round(text.fontSize * scale)
                : Math.max(10, Math.round(boxHeight * 0.8));
              
              console.log('🎯 可调节坐标计算:', {
                原文: text.text,
                OCR坐标: text.bbox,
                图片尺寸: { originalWidth, originalHeight },
                屏幕尺寸: { displayWidth, displayHeight },
                缩放比例: scale,
                手动偏移: { x: manualOffsetX, y: manualOffsetY },
                最终位置: { left, top, width: boxWidth, height: boxHeight }
              });
              
              const translatedText = text.translatedText || text.text;
              
              return (
                <View
                  key={text.id}
                  style={{
                    position: 'absolute',
                    left: left,
                    top: top,
                    width: boxWidth,
                    height: boxHeight,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 0,
                    margin: 0,
                    overflow: 'hidden',
                  }}
                  pointerEvents="none"
                >
                  <Text
                    style={{
                      fontSize: fontSize,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      textAlign: 'center',
                      textShadowColor: 'rgba(0, 0, 0, 0.9)',
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 3,
                      includeFontPadding: false,
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.5}
                  >
                    {translatedText}
                  </Text>
                </View>
              );
            })}
            </AnimatedImageBackground>
          </GestureDetector>

          </ViewShot>

          {/* 操作按钮 - 重新拍照和保存 */}
          <ImageActionButtons
            imageUri={capturedPhoto}
            overlays={detectedTexts}
            onRetakePhoto={handleRetakePhoto}
            photoViewRef={photoViewRef}
            style={styles.actionButtons}
          />
        </View>
      ) : (
        // 🎯 相机预览模式
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={cameraState.isActive}
            photo={true}
            onError={handleCameraError}
            onInitialized={() => {
              console.log('📷 相机初始化完成');
            }}
          />
          
          {/* 🎯 相机黑屏时显示启动按钮 */}
          {!cameraState.isActive && cameraState.hasPermission && device && (
            <View style={styles.cameraOverlay}>
              <TouchableOpacity
                style={styles.startCameraOverlayButton}
                onPress={startCamera}
              >
                <Text style={styles.startCameraOverlayButtonText}>启动相机</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* 底部控制栏 */}
      <View style={styles.controlsBar}>
        {!showPhoto && (
          // 🎯 相机模式控制栏 - 带语言选择
          <>
            {/* 源语言选择按钮 */}
            <TouchableOpacity
              style={styles.languageButton}
              onPress={openSourceLanguageModal}
            >
              <TextTicker
                style={styles.languageButtonText}
                duration={5000}
                loop
                bounce={false}
                repeatSpacer={50}
                marqueeDelay={1000}
              >
                {getLanguageDisplayName(sourceLanguage)}
              </TextTicker>
            </TouchableOpacity>

            {/* 拍照按钮 */}
          <TouchableOpacity
            style={[
              styles.captureButton,
              (isProcessing || isProcessingImage) && styles.captureButtonDisabled,
            ]}
            onPress={handleTakePicture}
            disabled={isProcessing || isProcessingImage}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

            {/* 目标语言选择按钮 */}
            <TouchableOpacity
              style={styles.languageButton}
              onPress={openTargetLanguageModal}
            >
              <TextTicker
                style={styles.languageButtonText}
                duration={5000}
                loop
                bounce={false}
                repeatSpacer={50}
                marqueeDelay={1000}
              >
                {getLanguageDisplayName(targetLanguage)}
              </TextTicker>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {/* 状态指示器 - 已删除 */}

      {/* 🎯 开发环境调试信息 - 已关闭 */}
      {false && __DEV__ && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugText}>调试信息:</Text>
          <Text style={styles.debugText}>权限: {cameraState.hasPermission ? '✅' : '❌'}</Text>
          <Text style={styles.debugText}>激活: {cameraState.isActive ? '✅' : '❌'}</Text>
          <Text style={styles.debugText}>设备: {device?.name || '无'}</Text>
          <Text style={styles.debugText}>OCR: ☁️ 云服务</Text>
          <Text style={styles.debugText}>检测: {detectedTexts.length} 个</Text>
          <Text style={styles.debugText}>处理: {isProcessingImage ? '🔄 进行中' : '⏸️ 空闲'}</Text>
          <Text style={styles.debugText}>错误: {cameraState.error || '无'}</Text>
        </View>
      )}

      {/* 🎯 语言选择模态框 */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectingLanguageType === 'source' ? '选择源语言' : '选择目标语言'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {SUPPORTED_LANGUAGES
                .filter((lang) => {
                  // 源语言：包含所有语言（包括Auto Detect）
                  // 目标语言：排除Auto Detect
                  if (selectingLanguageType === 'source') {
                    return true; // 源语言显示所有语言
                  } else {
                    return lang.code !== 'auto'; // 目标语言不显示Auto Detect
                  }
                })
                .map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    (selectingLanguageType === 'source' ? sourceLanguage : targetLanguage) === lang.code && 
                    styles.languageItemSelected
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                >
                  <Text style={styles.languageItemText} numberOfLines={1}>
                    {lang.flag} {lang.nativeName}
                  </Text>
                  {(selectingLanguageType === 'source' ? sourceLanguage : targetLanguage) === lang.code && (
                    <Text style={styles.languageItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  // 🎯 参考Android的FrameLayout和iOS的UIView层级结构
  container: {
    flex: 1,
    backgroundColor: 'black',
    position: 'relative', // 确保子元素可以绝对定位
  },
  // 🎯 相机容器
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  // 🎯 参考Android的PreviewView和iOS的AVCaptureVideoPreviewLayer
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // 🎯 相机覆盖层
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startCameraOverlayButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startCameraOverlayButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // 🎯 语言选择按钮
  languageButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  languageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  statusBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  debugPanel: {
    position: 'absolute',
    top: 100,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    maxWidth: 200,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    marginBottom: 2,
  },
  // 🎯 照片显示相关样式
  photoContainer: {
    flex: 1,
    backgroundColor: 'black',
    position: 'relative',
  },
  photoViewShot: {
    flex: 1,
    position: 'relative',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  capturedPhoto: {
    width: '100%',
    height: '100%',
  },
  overlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  retakeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retakeButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  // 🎯 语言选择模态框样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  languageList: {
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  languageItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
  },
  languageItemText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    flex: 1,
  },
  languageItemCheck: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default GoogleLensCamera;