import React from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useI18n } from '@/contexts/I18nContext';

interface SaveOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveOriginal: () => void;
  onSaveTranslated: () => void;
  onShare: () => void;
  onSaveBoth?: () => void;
  isAdvanced?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const SaveOptionsModal: React.FC<SaveOptionsModalProps> = ({
  visible,
  onClose,
  onSaveOriginal,
  onSaveTranslated,
  onShare,
  onSaveBoth,
  isAdvanced = false,
}) => {
  const { t } = useI18n();
  
  const handleOptionPress = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 标题 */}
          <Text style={styles.title}>
            {isAdvanced ? t('camera.saveOptions', '保存选项') : t('camera.saveImage', '保存图片')}
          </Text>
          
          {/* 描述 */}
          <Text style={styles.description}>
            {isAdvanced ? t('camera.selectSaveMethod', '选择保存方式\n首次保存时会弹出权限请求，请点击"允许"') : t('camera.selectContentType', '选择要保存的内容类型')}
          </Text>

          {/* 选项列表 */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOptionPress(onSaveOriginal)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>
                {isAdvanced ? t('camera.originalImageOnly', '仅原图片') : t('camera.originalImage', '原图片')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOptionPress(onSaveTranslated)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>
                {isAdvanced ? t('camera.translatedImageOnly', '仅翻译图片') : t('camera.translatedImage', '翻译图片')}
              </Text>
            </TouchableOpacity>

            {isAdvanced && onSaveBoth && (
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleOptionPress(onSaveBoth)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionText}>{t('camera.saveBoth', '同时保存两种')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOptionPress(onShare)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{t('camera.shareImage', '分享图片')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, styles.cancelText]}>{t('common.cancel', '取消')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: screenWidth * 0.8,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  optionsContainer: {
    alignItems: 'center',
  },
  optionButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#dc3545',
    marginTop: 8,
  },
  cancelText: {
    color: '#dc3545',
  },
});

