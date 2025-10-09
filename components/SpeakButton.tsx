import React from "react";
import { View, StyleSheet } from "react-native";
import { Play, Pause } from "lucide-react-native";

interface SpeakButtonProps {
  isSpeaking: boolean;
  size?: number;
  color?: string;
  activeColor?: string;
  disabled?: boolean;
}

export default function SpeakButton({ 
  isSpeaking, 
  size = 16, 
  color = "#666666",
  activeColor = "#4CAF50",
  disabled = false
}: SpeakButtonProps) {

  return (
    <View style={[styles.container, { opacity: disabled ? 0.5 : 1 }]}>
      {/* Play/Pause 图标 */}
      {isSpeaking ? (
        <Pause size={size} color={color} />
      ) : (
        <Play size={size} color={color} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // 基础容器样式
  },
});
