@echo off
echo Starting Travel Planner Development Server...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.x and try again.
    pause
    exit /b 1
)

echo Python found. Starting server...
python simple-server.py

pause 