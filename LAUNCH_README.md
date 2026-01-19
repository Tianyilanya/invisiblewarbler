# Invisible Warbler Launcher Usage Guide

## 📦 Invisible_Warbler.bat

This is a launcher batch file designed specifically for Windows users, allowing you to start the Invisible Warbler art project with one click.

### How to Use

1. **Prepare the Environment**
   - Install Node.js (LTS version recommended)
   - Ensure npm is available (`npm --version` to check)

2. **Launch the Application**
   - Double-click the `Invisible_Warbler.bat` file
   - Or run in command prompt: `Invisible_Warbler.bat`

3. **Wait for Startup**
   - The batch file will display startup information
   - Automatically waits 5 seconds for the server to fully start
   - The default browser will automatically open the application page

### Startup Process

```
========================================
    Invisible Warbler - Art Project
========================================

Starting development server...
The application will open automatically in your default browser.

[Waiting for server to start...]

Server is running at: http://localhost:8080
If the browser doesn't open automatically, visit the URL above manually.
Press Ctrl+C in the terminal window to stop the server
```

### Troubleshooting

**If startup fails:**
1. Check if Node.js is properly installed
2. Run `npm install` to install dependencies
3. Manually run `npm start`

**If browser doesn't open automatically:**
- Manually visit http://localhost:8080
- Check firewall settings

**If port is occupied:**
- Modify devServer.port in webpack.config.js
- Or stop other programs occupying port 8080

### Stop the Server

Press `Ctrl+C` in the terminal window opened by the launcher, then confirm to exit.

---

Enjoy the artistic experience of Invisible Warbler! 🎨✨🦅