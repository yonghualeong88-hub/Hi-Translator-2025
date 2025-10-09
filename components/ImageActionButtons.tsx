// 图片操作按钮组件 - 重新翻译和保存功能
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { DetectedText } from '../types/camera';
import {
    saveOriginalImage,
    saveTranslatedImageWithScreenshot,
    shareImage
} from '../utils/imageSaver';
import { SaveOptionsModal } from './SaveOptionsModal';

interface ImageActionButtonsProps {
  imageUri: string;
  overlays: DetectedText[];
  onRetakePhoto?: () => void; // 重新拍照回调
  photoViewRef?: React.RefObject<View | null>; // 用于截图的View ref
  style?: any;
}

export const ImageActionButtons: React.FC<ImageActionButtonsProps> = ({
  imageUri,
  overlays,
  onRetakePhoto,
  photoViewRef,
  style,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);


  // 重新拍照处理
  const handleRetakePhoto = () => {
    if (onRetakePhoto) {
      // 直接执行重新拍照，不显示确认提示
      onRetakePhoto();
    }
  };

  // 保存原图片
  const handleSaveOriginal = async () => {
    setIsSaving(true);
    try {
      // 参数验证
      if (!imageUri) {
        console.error("❌ 传入的 imageUri 无效:", imageUri);
        return;
      }
      
      const result = await saveOriginalImage(imageUri);
      console.log('📊 保存结果:', result);
      
      if (result.success) {
        console.log('✅ 原图片保存成功');
      } else {
        console.error('❌ 原图片保存失败:', result.error);
      }
    } catch (error) {
      console.error('❌ 保存原图片失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 保存翻译图片
  const handleSaveTranslated = async () => {
    setIsSaving(true);
    try {
      let result;
      
      // 如果有photoViewRef，使用截图功能保存真正的翻译图片
      if (photoViewRef?.current) {
        result = await saveTranslatedImageWithScreenshot(photoViewRef);
      } else {
        // 否则保存原图
        result = await saveOriginalImage(imageUri);
      }
      
      if (result.success) {
        console.log('✅ 翻译图片保存成功');
      } else {
        console.error('❌ 翻译图片保存失败:', result.error);
      }
    } catch (error) {
      console.error('❌ 保存翻译图片失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 分享图片
  const handleShare = async () => {
    try {
      const result = await shareImage(imageUri, t('camera.translatedImage', '翻译图片'));
      if (!result.success) {
        console.error('❌ 分享失败:', result.error);
      } else {
        console.log('✅ 分享成功');
      }
    } catch (error) {
      console.error('❌ 分享过程中发生错误:', error);
    }
  };

  // 同时保存两种图片
  const handleSaveBoth = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      // 参数验证
      if (!imageUri) {
        console.error("❌ 传入的 imageUri 无效:", imageUri);
        return;
      }
      
      // 保存原图
      const originalResult = await saveOriginalImage(imageUri);
      
      // 保存翻译图片（使用截图功能）
      let translatedResult;
      if (photoViewRef?.current) {
        translatedResult = await saveTranslatedImageWithScreenshot(photoViewRef);
      } else {
        translatedResult = await saveOriginalImage(imageUri);
      }
      
      if (originalResult.success && translatedResult.success) {
        console.log('✅ 原图片和翻译图片都已保存成功');
      } else if (originalResult.success || translatedResult.success) {
        console.log('⚠️ 部分图片保存成功');
      } else {
        console.error('❌ 保存失败');
      }
    } catch (error) {
      console.error('❌ 保存过程中发生错误:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 显示保存选项
  const handleSaveOptions = () => {
    setShowSaveModal(true);
  };

  return (
    <View style={[styles.container, style]}>
      {/* 重新拍照按钮 */}
      {onRetakePhoto && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.retakeButton,
            { backgroundColor: colors.warning || '#FF9500' },
            isSaving && styles.disabledButton,
          ]}
          onPress={handleRetakePhoto}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          <Ionicons name="camera" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>{t('camera.retake', '重拍')}</Text>
        </TouchableOpacity>
      )}

      {/* 保存按钮 */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.saveButton,
          { backgroundColor: colors.success || '#34C759' },
          isSaving && styles.disabledButton,
        ]}
        onPress={handleSaveOptions}
        disabled={isSaving}
        activeOpacity={0.7}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="download" size={18} color="#FFFFFF" />
        )}
        <Text style={styles.buttonText}>
          {isSaving ? t('camera.saving', '保存中') : t('common.save', '保存')}
        </Text>
      </TouchableOpacity>

      {/* 自定义保存选项模态框 */}
      <SaveOptionsModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaveOriginal={handleSaveOriginal}
        onSaveTranslated={handleSaveTranslated}
        onShare={handleShare}
        onSaveBoth={handleSaveBoth}
        isAdvanced={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    marginHorizontal: 10,
    marginBottom: 20,
    ...(Platform.OS === 'android' && { elevation: 8 }),
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    }),
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 15,
    minWidth: 70,
    maxWidth: 90,
    ...(Platform.OS === 'android' && { elevation: 4 }),
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    }),
  },
  retakeButton: {
    // 使用 flex: 1 和 marginHorizontal: 3 替代固定 margin
  },
  saveButton: {
    // 使用 flex: 1 和 marginHorizontal: 3 替代固定 margin
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});
