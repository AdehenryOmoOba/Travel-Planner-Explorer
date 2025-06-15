# Travel Planner Development Guide

## Quick Start

Due to UNC path issues with Vite on network drives, we've created alternative ways to run the application:

### Option 1: Simple Python Server (Recommended)

1. **Windows**: Double-click `start-server.bat`
2. **Manual**: Run `python simple-server.py`
3. Open your browser to `http://localhost:8000`

### Option 2: Test Files

Open these files directly in your browser for testing specific functionality:

- `test.html` - Simple destination grid test
- `debug.html` - Debug version with step-by-step loading
- `index.html` - Full application (may have module loading issues from file://)

## Current Status

### ✅ Working Features
- **Destination Grid**: Popular destinations display with images
- **CSS Styling**: Complete responsive design system
- **HTML Structure**: All pages and components
- **Services**: Location, Hotel, Flight services with mock data
- **Modules**: Authentication, Navigation, UI, Storage, Itinerary managers

### 🔧 Fixed Issues
- **Image Loading**: Added fallback images and error handling
- **Process.env**: Removed browser-incompatible environment variables
- **Event Handlers**: Fixed onclick handlers to use event delegation
- **Module Imports**: Fixed relative paths for non-Vite usage

### 🚧 Known Issues
- **Vite UNC Path**: Cannot run `npm run dev` due to UNC path limitations
- **ES6 Modules**: May not work from file:// URLs in some browsers
- **API Integration**: Using mock data (real APIs need keys)

## File Structure

```
Travel-Planner-Explorer/
├── index.html              # Main application
├── test.html               # Simple test page
├── debug.html              # Debug version
├── simple-server.py        # Python development server
├── start-server.bat        # Windows server launcher
├── src/
│   ├── main.js            # Application entry point
│   ├── styles/main.css    # Complete styling
│   ├── modules/           # Core application modules
│   ├── services/          # API service classes
│   └── utils/             # Utility classes
├── public/                # Static assets
└── package.json           # Dependencies (for future Vite setup)
```

## Development Workflow

1. **Start Server**: Use `start-server.bat` or `python simple-server.py`
2. **Edit Code**: Make changes to files in `src/`
3. **Test**: Refresh browser to see changes
4. **Debug**: Use `debug.html` for step-by-step debugging

## Next Steps

1. **Install Dependencies**: Run `npm install` when Vite path issues are resolved
2. **Real APIs**: Add actual API keys for external services
3. **Map Integration**: Complete Leaflet map functionality
4. **Testing**: Add unit and integration tests
5. **Build Process**: Set up proper build pipeline

## Troubleshooting

### Images Not Loading
- Check browser console for CORS errors
- Ensure server is running for proper HTTP serving
- Fallback images should load automatically

### JavaScript Errors
- Use `debug.html` to identify which module is failing
- Check browser console for detailed error messages
- Ensure all files are served over HTTP (not file://)

### Server Won't Start
- Ensure Python 3.x is installed
- Check if port 8000 is available
- Try running `python --version` to verify Python installation 