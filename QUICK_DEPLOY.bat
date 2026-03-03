@echo off
REM Quick deployment setup script for Windows
REM Usage: QUICK_DEPLOY.bat

echo.
echo 🚀 Mental Health App - Quick Deployment Setup (Windows)
echo.

REM Check for Git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git not found. Install from https://git-scm.com
    pause
    exit /b 1
)

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Git and Node.js found
echo.

REM Setup environment files
echo 📝 Setting up environment files...

if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo ✅ Created backend\.env
    echo    → Edit with your Supabase keys and API credentials
) else (
    echo ✅ backend\.env already exists
)

if not exist ".env.local" (
    copy ".env.example" ".env.local" >nul
    echo ✅ Created .env.local
    echo    → Edit with your API URLs
) else (
    echo ✅ .env.local already exists
)

echo.

REM Install dependencies
echo 📦 Installing dependencies...

cd backend
echo Installing backend dependencies...
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend npm install failed
    pause
    exit /b 1
)

cd ..
echo Installing frontend dependencies...
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend npm install failed
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed
echo.

REM Initialize git
if not exist ".git" (
    echo 🔗 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit: Mental Health Support app"
    echo ✅ Git initialized
    echo.
    echo ⚠️  Next: Push to GitHub
    echo    Create a repo at https://github.com/new
    echo    Then run:
    echo    git remote add origin https://github.com/yourusername/repo-name.git
    echo    git push -u origin main
) else (
    echo ✅ Git repository already initialized
)

echo.
echo 🎉 Setup complete!
echo.
echo 📚 Next steps:
echo 1. Edit backend\.env with your Supabase credentials
echo 2. Edit .env.local with your API URL
echo 3. Test locally: npm run dev ^(frontend^) and cd backend ^&^& npm run dev ^(backend^)
echo 4. Push to GitHub
echo 5. Follow RENDER_SETUP.md and VERCEL_SETUP.md
echo.
pause
