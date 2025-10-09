@echo off
echo ========================================
echo   Vosk Native Module Build Script
echo ========================================
echo.

echo [1/4] Cleaning Android build cache...
cd android
call gradlew clean
cd ..
echo Done!
echo.

echo [2/4] Running expo prebuild --clean...
call npx expo prebuild --clean
echo Done!
echo.

echo [3/4] Building Android app...
call npx expo run:android
echo Done!
echo.

echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo Next steps:
echo   1. App should launch automatically
echo   2. Check logs for "Vosk module loaded"
echo   3. Test voice recognition
echo.
pause

