@echo off
REM SPS Development Setup Script for Windows
REM

echo.
echo 🚀 SPS - Setup Script
echo ====================
echo.

REM Check Node.js installation
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js from https://nodejs.org/en/
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node -v
echo ✅ npm found: 
npm -v
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed
echo.

REM Create .env.local
if not exist ".env.local" (
    echo 📝 Creating .env.local file...
    copy ".env.example" ".env.local"
    echo ⚠️  Please update .env.local with your Firebase credentials
) else (
    echo ✅ .env.local already exists
)

REM Create directories
if not exist "public\icons" (
    echo 📁 Creating icons directory...
    mkdir "public\icons"
    echo ⚠️  Add your PWA icons to public\icons\
)

if not exist "public\screenshots" (
    echo 📁 Creating screenshots directory...
    mkdir "public\screenshots"
)

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Update your Firebase config in src/config.js or .env.local
echo 2. Add PWA icons to public\icons\ (see PWA_SETUP.md)
echo 3. Run 'npm run dev' to start development server
echo.
echo For more info, see README.md and PWA_SETUP.md
echo.
pause
