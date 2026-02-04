# Installation Guide for PDF3MD

This guide covers all installation methods for PDF3MD, from standalone applications to manual development setup.

---

## 🚀 Quick Installation (Recommended)

### Option 1: Standalone Application (No Dependencies Required)

**Perfect for end users - just download and run!**

#### macOS

1. **Download or Build:**
   ```bash
   # Build from source
   cd /path/to/pdf3md
   ./macos/build_app.sh
   ./macos/build_dmg.sh
   ```

2. **Install:**
   - Open `dist/PDF3MD.dmg`
   - Drag `PDF3MD.app` to Applications folder

3. **Run:**
   - Double-click `PDF3MD.app`
   - Browser opens automatically at `http://localhost:6201`

✅ **Includes everything**: Python backend, React frontend, and Pandoc (if available)

#### Windows

1. **Download or Build:**
   ```powershell
   # Build from source
   cd C:\path\to\pdf3md
   .\windows\build_app.ps1
   ```

2. **Run:**
   - Double-click `dist\windows\PDF3MD.exe`
   - Browser opens automatically at `http://localhost:6201`

✅ **Includes everything**: Python backend, React frontend, and Pandoc (if available)

---

## 💻 Manual Installation (For Development)

### Prerequisites

| Component | Windows | macOS | Purpose |
|-----------|---------|-------|---------|
| **Python** | 3.13+ | 3.13+ | Backend runtime |
| **Node.js** | 18+ | 18+ | Frontend build tools |
| **Pandoc** | Optional* | Optional* | MD → DOCX conversion |
| **Git** | Required | Required | Clone repository |

\* *Pandoc is auto-downloaded by the application if not found in PATH*

---

## Windows Manual Installation

### 1. Install Prerequisites

#### Python
Download from [python.org](https://www.python.org/downloads/)

> ⚠️ **IMPORTANT**: Check "Add Python to PATH" during installation!

Verify installation:
```powershell
py --version
# Expected: Python 3.13.x or higher
```

#### Node.js
Download from [nodejs.org](https://nodejs.org/)

Verify installation:
```powershell
node --version
npm --version
# Expected: v18.x or higher
```

#### Pandoc (Optional)
Download from [pandoc.org](https://pandoc.org/installing.html) or install via Chocolatey:
```powershell
choco install pandoc
```

Verify:
```powershell
pandoc --version
```

### 2. Clone Repository

```powershell
git clone https://github.com/kureinmaxim/pdf3md.git
cd pdf3md
```

### 3. Setup Backend

```powershell
# Create virtual environment
py -m venv .venv

# Activate virtual environment
.\.venv\Scripts\activate

# Install Python dependencies
pip install -r pdf3md\requirements.txt
```

### 4. Setup Frontend

```powershell
cd pdf3md
npm install
```

### 5. Run Application

#### Development Mode (with hot-reload)

**Terminal 1 - Backend:**
```powershell
# From project root
.\.venv\Scripts\activate
python run_server.py
```

**Terminal 2 - Frontend:**
```powershell
cd pdf3md
npm run dev
```

Access at: `http://localhost:5173` (frontend) or `http://localhost:6201` (API)

#### Production Mode

```powershell
# Build frontend
cd pdf3md
npm install
npm run build

# Run backend (from project root)
.\.venv\Scripts\activate
python run_server.py
```

Access at: `http://localhost:6201`

---

## macOS Manual Installation

### 1. Install Prerequisites

#### Homebrew (Package Manager)
If not already installed:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Python
```bash
brew install python@3.13
```

Verify:
```bash
python3 --version
# Expected: Python 3.13.x or higher
```

#### Node.js
```bash
brew install node
```

Verify:
```bash
node --version
npm --version
# Expected: v18.x or higher
```

#### Pandoc (Optional)
```bash
brew install pandoc
```

Verify:
```bash
pandoc --version
```

### 2. Clone Repository

```bash
git clone https://github.com/kureinmaxim/pdf3md.git
cd pdf3md
```

### 3. Setup Backend

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install Python dependencies
pip install -r pdf3md/requirements.txt
```

### 4. Setup Frontend

```bash
cd pdf3md
npm install
```

### 5. Run Application

#### Development Mode (with hot-reload)

**Terminal 1 - Backend:**
```bash
# From project root
source .venv/bin/activate
python run_server.py
```

**Terminal 2 - Frontend:**
```bash
cd pdf3md
npm run dev
```

Access at: `http://localhost:5173` (frontend) or `http://localhost:6201` (API)

#### Production Mode

```bash
# Build frontend
cd pdf3md
npm install
npm run build

# Run backend (from project root)
source .venv/bin/activate
python run_server.py
```

Access at: `http://localhost:6201`

---

## 🏗️ Building Standalone Applications

### macOS Application Bundle

#### Prerequisites
- Python 3.13+
- Node.js 18+
- Pandoc (optional, will be bundled if available)

#### Build Steps

```bash
cd /path/to/pdf3md

# Build .app bundle
./macos/build_app.sh

# Create DMG installer (optional)
./macos/build_dmg.sh
```

#### Output
- **App Bundle**: `dist/PDF3MD.app` (~90MB)
- **DMG Installer**: `dist/PDF3MD.dmg` (if built)

#### What Gets Bundled
- ✅ Python backend (single executable via PyInstaller)
- ✅ React frontend (built static files)
- ✅ Pandoc binary (if installed on build machine)
- ✅ All Python dependencies
- ✅ Browser auto-launch functionality

#### Install & Run
1. Open `PDF3MD.dmg`
2. Drag `PDF3MD.app` to Applications
3. Double-click to launch
4. Browser opens automatically

#### Advanced: Manual .app Launch
```bash
open dist/PDF3MD.app
```

### Windows Executable

#### Prerequisites
- Python 3.13+
- Node.js 18+
- Pandoc (optional, will be bundled if available)
- PowerShell 5.1+

#### Build Steps

```powershell
cd C:\path\to\pdf3md

# Build standalone .exe
.\windows\build_app.ps1
```

#### Output
- **Executable**: `dist\windows\PDF3MD.exe` (~90MB)

#### What Gets Bundled
- ✅ Python backend (single executable via PyInstaller)
- ✅ React frontend (built static files)
- ✅ Pandoc binary (if installed on build machine)
- ✅ All Python dependencies
- ✅ Browser auto-launch functionality

#### Run
Double-click `PDF3MD.exe` - browser opens automatically

---

## 🐳 Docker Installation

For Docker-based installation, see the main [README.md](README.md#-option-2-docker-recommended-for-servers).

Quick command:
```bash
docker compose up -d
```

---

## 🔧 Troubleshooting

### Windows Issues

#### `pip` not recognized
Use `py -m pip` instead:
```powershell
py -m pip install -r pdf3md\requirements.txt
```

#### Python not found
Ensure Python is in PATH. Reinstall and check "Add to PATH" option.

#### PyInstaller build fails
Install PyInstaller in build environment:
```powershell
.\.venv\Scripts\activate
pip install pyinstaller
```

### macOS Issues

#### Permission denied on scripts
Make scripts executable:
```bash
chmod +x macos/build_app.sh
chmod +x macos/build_dmg.sh
chmod +x run_server.py
```

#### "PDF3MD.app is damaged" error
macOS Gatekeeper issue. Right-click → Open, or:
```bash
xattr -cr dist/PDF3MD.app
```

#### Pandoc not found during build
Install Pandoc:
```bash
brew install pandoc
```

### General Issues

#### Port Already in Use
If ports 5173 or 6201 are in use:

**Check what's using the port:**
```bash
# macOS/Linux
lsof -ti :6201

# Windows
netstat -ano | findstr :6201
```

**Kill the process:**
```bash
# macOS/Linux
kill -9 $(lsof -ti :6201)

# Windows (replace PID)
taskkill /PID <PID> /F
```

**Or change the port** in `run_server.py` (line ~31):
```python
port = 6202  # Change from 6201
```

#### Pandoc Conversion Fails
1. Ensure Pandoc is installed: `pandoc --version`
2. Check application logs for errors
3. App auto-downloads Pandoc if missing (requires internet)

#### Connection Errors During `pip install`
Retry with extended timeout:
```bash
pip install -r pdf3md/requirements.txt --retries 5 --timeout 120
```

Or install packages individually:
```bash
pip install Flask==3.0
pip install Flask-CORS==4.0
pip install pymupdf>=1.24.10
pip install pymupdf4llm>=0.0.17
pip install pypandoc-binary>=1.13
pip install python-docx
```

#### Module Import Errors After Refactoring
The codebase was refactored into modular packages. Ensure you're using the new entry points:

**Old (deprecated):**
```bash
python pdf3md/app.py
```

**New (correct):**
```bash
python run_server.py
```

#### Build Fails - Missing Dependencies
Install build dependencies:

**macOS:**
```bash
pip install -r macos/requirements-build.txt
```

**Windows:**
```powershell
pip install pyinstaller
```

---

## 📂 Project Structure (After Refactoring)

```
pdf3md/
├── pdf3md/                    # Main application package
│   ├── __init__.py           # Package initialization
│   ├── app.py                # Flask routes (refactored)
│   ├── config.py             # Configuration module
│   ├── converters/           # PDF & DOCX conversion
│   │   ├── __init__.py
│   │   ├── pdf_converter.py
│   │   └── docx_converter.py
│   ├── formatters/           # Document formatting
│   │   ├── __init__.py
│   │   ├── docx_formatter.py
│   │   └── docx_cleaners.py
│   ├── utils/                # Utility functions
│   │   ├── __init__.py
│   │   ├── file_utils.py
│   │   ├── pandoc_utils.py
│   │   └── version_utils.py
│   └── requirements.txt      # Python dependencies
├── pdf3md_standalone.py      # Standalone app entry point
├── run_server.py             # Development server runner
├── macos/                    # macOS build scripts
├── windows/                  # Windows build scripts
└── dist/                     # Build output
```

---

## 🔄 Upgrading from Old Versions

If you have an older version of PDF3MD:

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Update dependencies:**
   ```bash
   source .venv/bin/activate  # macOS/Linux
   # .\.venv\Scripts\activate  # Windows
   
   pip install --upgrade -r pdf3md/requirements.txt
   cd pdf3md
   npm install
   ```

3. **Rebuild if using standalone:**
   ```bash
   # macOS
   ./macos/build_app.sh
   
   # Windows
   .\windows\build_app.ps1
   ```

---

## 📝 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PDF3MD_STATIC_DIR` | `pdf3md/dist` | Frontend static files |
| `PDF3MD_KILL_PORT` | `1` | Auto-kill port 6201 processes |
| `FLASK_ENV` | `production` | Flask environment |
| `FLASK_DEBUG` | `0` | Debug mode |

### Custom Port Configuration

Edit `run_server.py`:
```python
port = 6201  # Change to desired port
```

Also update `pdf3md/vite.config.js` for frontend dev server:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:6201',  // Match backend port
    // ...
  }
}
```

---

## 🆘 Getting Help

- **Documentation**: See [README.md](README.md) for usage guide
- **Issues**: [GitHub Issues](https://github.com/kureinmaxim/pdf3md/issues)
- **Build Logs**: Check `dist/pyinstaller/build/pdf3md-server/warn-pdf3md-server.txt`
- **Application Logs**: 
  - macOS: `~/Library/Logs/PDF3MD/server.log`
  - Windows: `%LOCALAPPDATA%\PDF3MD\logs\server.log`

---

**Ready to convert PDFs! 🎉**
