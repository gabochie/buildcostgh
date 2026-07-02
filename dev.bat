@echo off
echo ============================================
echo  BuildCost GH - Development Server
echo ============================================
echo.
echo Killing any existing process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000 " ^| find "LISTENING"') do (
   taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 >nul
echo.
echo Starting dev server (webpack mode)...
echo Open http://localhost:3000
echo.
npx next dev --webpack
pause
