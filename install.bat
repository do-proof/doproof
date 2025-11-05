@echo off
echo Installing DoProof Application dependencies...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Please install Python first.
    echo Download from: https://python.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo npm is not available. Please install Node.js with npm.
    pause
    exit /b 1
)

echo Node.js, Python, and npm are available.
echo Installing all dependencies...
npm run install:all

if %errorlevel% equ 0 (
    echo.
    echo Installation completed successfully!
    echo.
    echo To start the application, run:
    echo npm start
    echo.
    echo Frontend will be available at http://localhost:3000
    echo Backend API will be available at http://localhost:5000
) else (
    echo.
    echo Installation failed. Please check the error messages above.
)

pause 