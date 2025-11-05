@echo off
echo Starting DoProof Application...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not found. Installing...
    npm install
    if %errorlevel% neq 0 (
        echo Installation failed. Please check the error messages above.
        pause
        exit /b 1
    )
)

echo Starting both frontend and backend servers...
echo.
echo Frontend will be available at http://localhost:3000
echo Backend API will be available at http://localhost:5000
echo API documentation will be available at http://localhost:5000/docs
echo.
echo Press Ctrl+C to stop the servers.
echo.

npm start

pause 