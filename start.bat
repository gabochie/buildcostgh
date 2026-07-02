@echo off
echo ============================================
echo  BuildCost GH - Production Server
echo ============================================
echo.
echo Killing any existing process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000 " ^| find "LISTENING"') do (
   taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 >nul
echo.
echo Step 1: Building...
call npm run build
if %ERRORLEVEL% neq 0 (
   echo Build failed! Check errors above.
   pause
   exit /b 1
)
echo.
echo Step 2: Starting production server...
echo Open http://localhost:3000
echo.
npx next start
pause
