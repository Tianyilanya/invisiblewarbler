@echo off
echo ========================================
echo     Invisible Warbler - Art Project
echo ========================================
echo.
echo Starting development server...
echo The application will open automatically in your default browser.
echo.

REM Start the npm development server (it will auto-open the browser)
start /B npm start

REM Wait a moment for the server to initialize
timeout /t 3 /nobreak > nul

echo.
echo Server is running at: http://localhost:8080
echo If the browser doesn't open automatically, visit the URL above manually.
echo Press Ctrl+C in the terminal window to stop the server
echo.
pause