@echo off
echo ========================================
echo     Invisible Warbler - Art Project (old)
echo ========================================
echo.
echo Starting development server...
echo The application will open automatically in your default browser.
echo.

REM Start the npm development server (it will auto-open the browser)
start /B npm run dev

REM Wait a moment for the server to initialize
timeout /t 3 /nobreak > nul

echo.
echo Server is running at: http://localhost:8080 (or next available port)
echo If the browser doesn't open automatically, check the terminal for the actual URL.
echo Press Ctrl+C in the terminal window to stop the server
echo.
pause