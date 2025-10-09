import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export interface SaveOptions {
  quality?: number;
  format?: 'jpg' | 'png';
}

export interface SaveResult {
  success: boolean;
  uri?: string;
  error?: string;
}

const APP_ALBUM_NAME = 'HLTransslater';


/**
 * 💾 保存图片到相册 - 无权限检查
 */
export async function saveToAlbum(uri: string) {
  console.log('💾 开始保存图片...');
  
  // 💾 直接保存图片
  const asset = await MediaLibrary.createAssetAsync(uri);
  console.log('✅ 图片已保存:', asset.uri);

  // 📁 尝试保存到自定义相册
  try {
    let album = await MediaLibrary.getAlbumAsync(APP_ALBUM_NAME);
    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      console.log('✅ 保存到自定义相册成功:', APP_ALBUM_NAME);
    } else {
      album = await MediaLibrary.createAlbumAsync(APP_ALBUM_NAME, asset, false);
      console.log('✅ 创建自定义相册并保存成功:', APP_ALBUM_NAME);
    }
  } catch (albumError) {
    console.log('⚠️ 保存到自定义相册失败，但图片已保存到默认相册');
  }
  
  return asset;
}

/**
 * 保存原图片
 */
export const saveOriginalImage = async (
  image: { uri: string } | string,
  options: SaveOptions = {}
): Promise<SaveResult> => {
  try {
    const imageUri = typeof image === 'string' ? image : image?.uri;
    if (!imageUri) throw new Error('无效的图片路径');

    const asset = await saveToAlbum(imageUri);
    return { success: true, uri: asset.uri };
  } catch (error) {
    console.error('❌ 保存原图片失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '保存失败' };
  }
};

/**
 * 保存翻译截图
 */
export const saveTranslatedImageWithScreenshot = async (
  viewRef: React.RefObject<any>,
  options: SaveOptions = {}
): Promise<SaveResult> => {
  try {
    if (!viewRef?.current) return { success: false, error: '视图引用无效' };

    const screenshotUri = await captureRef(viewRef.current, {
      format: options.format || 'jpg',
      quality: options.quality || 1,
      result: 'tmpfile', // 保存为临时文件，避免内存问题
      width: undefined, // 保持原始宽度
      height: undefined, // 保持原始高度
    });

    console.log('📸 截图成功:', screenshotUri);

    const asset = await saveToAlbum(screenshotUri);
    console.log('✅ 截图保存成功:', asset.uri);

    return { success: true, uri: asset.uri };
  } catch (error) {
    console.error('❌ 截图保存失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '截图保存失败' };
  }
};

/**
 * 分享图片
 */
export const shareImage = async (imageUri: string, title = '翻译图片'): Promise<SaveResult> => {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('分享不可用', '当前设备不支持分享功能');
      return { success: false, error: '分享不可用' };
    }
    await Sharing.shareAsync(imageUri, {
      mimeType: 'image/jpeg',
      dialogTitle: title,
    });
    console.log('✅ 图片分享成功');
    return { success: true };
  } catch (error) {
    console.error('❌ 分享图片失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '分享失败' };
  }
};

/**
 * 显示保存选项
 */
export const showSaveOptions = (
  onSaveOriginal: () => void,
  onSaveTranslated: () => void,
  onShare: () => void
) => {
  Alert.alert('保存图片', '选择要保存的内容', [
    { text: '原图片', onPress: onSaveOriginal },
    { text: '翻译图片', onPress: onSaveTranslated },
    { text: '分享', onPress: onShare },
    { text: '取消', style: 'cancel' },
  ]);
};