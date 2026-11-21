@echo off
REM Compila Matriculas-vX.apk en esta carpeta. Necesita Node y Android Studio (como Pellet Control).
cd /d "%~dp0"
if not defined ANDROID_HOME if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
call npm install || goto :error
call node scripts\build-web.mjs || goto :error
if not exist android call npx cap add android || goto :error
call node scripts\patch-android.mjs || goto :error
call npx cap sync android || goto :error
cd android
call .\gradlew.bat assembleRelease || goto :error
cd ..
for /f "delims=" %%v in ('node -p "require('./package.json').version"') do set VER=%%v
REM Copia con Node: copy falla si la ruta pasa de 260 caracteres
call node -e "require('fs').copyFileSync('android/app/build/outputs/apk/release/app-release.apk','Matriculas-v%VER%.apk')" || goto :error
echo.
echo Listo: Matriculas-v%VER%.apk
goto :eof
:error
echo.
echo Algo ha fallado. Revisa el mensaje de arriba.
exit /b 1
