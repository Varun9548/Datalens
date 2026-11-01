@echo off
title DataLens — Upload CSV to Interactive Analytics
cd /d "%~dp0"

echo ======================================================================
echo       DataLens — Upload CSV -^> Interactive Analytics
echo       100%% Free and Local Open-Source Architecture
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Starting DataLens Integrated Server on http://localhost:5000 ...
start "" "http://localhost:5000"

node server/src/index.js
pause
