@echo off
taskkill /F /IM electron.exe >nul 2>&1
timeout /t 1
npm start