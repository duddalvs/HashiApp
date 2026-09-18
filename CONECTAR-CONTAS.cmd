@echo off
setlocal
cd /d "%~dp0"
echo HASHIMOTO FROTA - Conectar contas
echo.
echo 1. Entre na sua conta Expo pelo navegador.
call npx.cmd --yes --package=eas-cli@latest eas login --browser
if errorlevel 1 goto falha
echo.
echo 2. Entre na sua conta Supabase pelo navegador.
call npx.cmd --yes supabase@latest login
if errorlevel 1 goto falha
echo.
echo Contas conectadas. Volte ao Codex para continuar o banco e o APK.
pause
exit /b 0

:falha
echo.
echo O login nao foi concluido. Confira a mensagem acima e tente novamente.
echo Nao envie senhas ou tokens no chat.
pause
exit /b 1
