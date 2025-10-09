// 简化版相机控制组件 - 只支持拍照功能
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CameraControlsProps {
  cameraState: {
    isActive: boolean;
    hasPermission: boolean;
    isProcessing: boolean;
    error: string | null;
  };
  onTakePhoto: () => void;
  onRequestPermission: () => void;
  onRetry?: () => void;
  isProcessing?: boolean;
  error?: string | null;
  hasPermission?: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  cameraState,
  onTakePhoto,
  onRequestPermission,
  onRetry,
  isProcessing = false,
  error,
  hasPermission = true,
}) => {
  // 权限请求界面
  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>📷 相机翻译</Text>
        <Text style={styles.permissionText}>
          需要相机权限来拍照翻译文字
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={onRequestPermission}
        >
          <Text style={styles.permissionButtonText}>授权相机权限</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 错误状态
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部状态栏 */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          📷 对准文字 • 📸 拍照模式 • 🌐 翻译开启
        </Text>
      </View>

      {/* 底部控制栏 */}
      <View style={styles.controlsBar}>
        {/* 拍照按钮 */}
        <TouchableOpacity
          style={[
            styles.captureButton,
            isProcessing && styles.captureButtonDisabled,
          ]}
          onPress={onTakePhoto}
          disabled={isProcessing}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
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
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
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
  statusBar: {
    paddingHorizontal: 20,
    paddingTop: 50,
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
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
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
});