@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\copiar-projeto.ps1
if errorlevel 1 echo Nao foi possivel gerar a copia. Confira a mensagem acima.
pause
