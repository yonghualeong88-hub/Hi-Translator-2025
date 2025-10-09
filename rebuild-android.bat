@echo off
echo ========================================
echo 重新编译 Android 应用（修复离线翻译）
echo ========================================
echo.

echo [1/3] 清理旧的编译文件...
cd android
call gradlew.bat clean
cd ..

echo.
echo [2/3] 清理 Expo 缓存...
call npx expo prebuild --clean

echo.
echo [3/3] 编译并安装到设备...
call npx expo run:android

echo.
echo ========================================
echo 编译完成！
echo ========================================
echo.
echo 下一步：
echo 1. 打开应用
echo 2. 进入设置 → 语言包管理
echo 3. 下载需要的语言包（如中文、英文）
echo 4. 开启飞行模式测试离线翻译
echo.
pause




