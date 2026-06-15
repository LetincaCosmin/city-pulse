@echo off
cd /d "%~dp0"
"C:\Program Files\nodejs\node.exe" "%~dp0node_modules\next\dist\bin\next" dev --hostname 0.0.0.0 --port 3000
pause
