@echo off
cd /d "C:\JH\BaZi + Zi Wei Dou Shu\bazi-zwds-app"
SET PATH=%PATH%;C:\Program Files\nodejs;C:\Users\%USERNAME%\AppData\Roaming\npm

echo Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
call npm install

echo.
echo Starting BaZi Calculator server...
echo Open browser: http://localhost:3000
echo Press Ctrl+C to stop.
echo.
node server.js
pause
