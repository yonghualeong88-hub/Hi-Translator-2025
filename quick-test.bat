@echo off
echo ========================================
echo 离线翻译快速测试脚本
echo ========================================
echo.

echo [1] 检查设备连接...
adb devices
echo.

echo [2] 检查应用是否已安装...
adb shell pm list packages | findstr "hltransslater"
echo.

echo [3] 启动应用...
adb shell am start -n com.hltransslater.app/.MainActivity
echo.

echo [4] 查看实时日志（按 Ctrl+C 停止）...
echo 关注以下关键词：翻译、MLKit、离线
echo.
timeout /t 3
adb logcat -c
adb logcat | findstr /i "翻译 MLKit 离线 translate MLKIT"




