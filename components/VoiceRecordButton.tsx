import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Mic } from 'lucide-react-native';

/**
 * 语音录音按钮组件
 * 
 * 功能：
 * - 显示录音按钮和动画效果
 * - 处理按压和松开事件
 * - 显示粒子动画效果
 * 
 * @param type - 按钮类型（源语言或目标语言）
 * @param isRecording - 是否正在录音
 * @param isPressing - 是否正在按压
 * @param buttonColor - 按钮颜色
 * @param onPressIn - 按压开始回调
 * @param onPressOut - 按压结束回调
 * @param pulseAnim - 脉冲动画值
 * @param particles - 粒子动画值数组
 */
interface VoiceRecordButtonProps {
  type: 'source' | 'target';
  isRecording: boolean;
  isPressing: boolean;
  buttonColor: string;
  onPressIn: () => void;
  onPressOut: () => void;
  pulseAnim: Animated.Value;
  particles: Animated.Value[];
}

export default function VoiceRecordButton({
  type,
  isRecording,
  isPressing,
  buttonColor,
  onPressIn,
  onPressOut,
  pulseAnim,
  particles,
}: VoiceRecordButtonProps) {
  return (
    <View style={{ position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
      {/* 粒子效果 - 8个小光点 */}
      {particles.map((particle, index) => {
        const angle = (index * 45) * (Math.PI / 180); // 每个粒子间隔45度
        const radius = 60; // 粒子距离中心的距离
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: buttonColor,
              opacity: particle,
              transform: [
                { translateX: x },
                { translateY: y },
                { scale: particle }
              ],
            }}
          />
        );
      })}
      
      <TouchableOpacity
        style={{
          width: 85,
          height: 85,
          borderRadius: 42.5,
          backgroundColor: buttonColor,
          justifyContent: 'center',
          alignItems: 'center',
          transform: isPressing ? [{ scale: 0.95 }] : [{ scale: 1 }],
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.8}
      >
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
        >
          <Mic size={32} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}
