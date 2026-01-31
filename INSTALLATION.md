# Installation Guide for PDF3MD

This guide covers installation on **Windows** and **macOS** without Docker.

---

## Prerequisites

| Component | Windows | macOS |
|-----------|---------|-------|
| **Python** | 3.13+ | 3.13+ |
| **Node.js** | 18+ | 18+ |
| **Pandoc** | Required (MD → DOCX) | Required (MD → DOCX) |

---

## Windows Installation

### 1. Install Python

Download and install from [python.org](https://www.python.org/downloads/).

> ⚠️ **Important**: Check "Add Python to PATH" during installation!

Verify:
```powershell
py --version
```

### 2. Install Node.js

Download and install from [nodejs.org](https://nodejs.org/).

Verify:
```powershell
node --version
npm --version
```

### 3. Install Pandoc

Download and install from [pandoc.org](https://pandoc.org/installing.html).

Verify:
```powershell
pandoc --version
```

### 4. Clone and Setup Project

```powershell
# Clone the repository
git clone https://github.com/kureinmaxim/pdf3md.git
cd C:\Project\pdf3md

# Repo layout: backend at pdf3md/app.py, frontend in pdf3md/

# Install Python dependencies
py -m pip install -r requirements.txt

# Install Node.js dependencies
cd C:\Project\pdf3md\pdf3md
npm install
```

### 5. Run the Application

**Terminal 1 — Backend:**
```powershell
cd C:\Project\pdf3md\pdf3md
py app.py
```

**Terminal 2 — Frontend:**
```powershell
cd C:\Project\pdf3md\pdf3md
npm run dev
```

### 6. Access the Application

- **Frontend (dev)**: http://localhost:5173
- **Backend API**: http://localhost:6201
- **Production UI**: http://localhost:6201 (after `npm run build`)

---

## macOS Installation

### 1. Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Python

```bash
brew install python@3.13
```

Verify:
```bash
python3 --version
```

### 3. Install Node.js

```bash
brew install node
```

Verify:
```bash
node --version
npm --version
```

### 4. Install Pandoc

```bash
brew install pandoc
```

Verify:
```bash
pandoc --version
```

### 5. Clone and Setup Project

```bash
# Clone the repository
git clone https://github.com/kureinmaxim/pdf3md.git
cd /Users/olgazaharova/Project/pdf3md

# Repo layout: backend at pdf3md/app.py, frontend in pdf3md/

# Setup Python Virtual Environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip3 install -r requirements.txt

# Install Node.js dependencies
cd /Users/olgazaharova/Project/pdf3md/pdf3md
npm install
```

### 6. Run the Application

**Terminal 1 — Backend:**
```bash
cd /Users/olgazaharova/Project/pdf3md/pdf3md
# Ensure your virtual environment is activated
# source ../../venv/bin/activate
python3 app.py
```

**Terminal 2 — Frontend:**
```bash
cd /Users/olgazaharova/Project/pdf3md/pdf3md
npm run dev
```

### 7. Access the Application

- **Frontend (dev)**: http://localhost:5173
- **Backend API**: http://localhost:6201
- **Production UI**: http://localhost:6201 (after `npm run build`)

---

## Production Build (For "No Dev Server" Mode)

This mode runs the optimized React build served by Flask, instead of the Vite development server.

### 1. Build the Frontend
This compiles the Javascript/CSS assets. The command **does not** start the server.

```bash
cd /Users/olgazaharova/Project/pdf3md/pdf3md
npm install
npm run build
```

### 2. Start the Backend Server
You must start the Python backend to serve the built application.

```bash
# In the /pdf3md/pdf3md folder
python3 app.py
```

Then open: `http://localhost:6201`

---

## macOS Desktop App (.dmg)

If you want a standalone macOS application (like an `.exe` but for Mac), use the build script. This **automatically** builds the frontend and bundles the Python backend.

```bash
cd /Users/olgazaharova/Project/pdf3md
./macos/build_dmg.sh
```

- Output: `dist/PDF3MD.dmg`
- Drag `PDF3MD.app` to Applications.
- Launching the app starts the server and opens the browser automatically.

---

## Troubleshooting

### Windows: `pip` not recognized
Use `py -m pip` instead of `pip`:
```powershell
py -m pip install -r pdf3md/requirements.txt
```

### Connection errors during pip install
If downloads fail, try installing packages one by one with retries:
```powershell
py -m pip install Flask==3.0 --retries 5 --timeout 60
py -m pip install Flask-CORS==4.0 --retries 5 --timeout 60
py -m pip install pymupdf>=1.24.10 --retries 5 --timeout 120
py -m pip install pymupdf4llm>=0.0.17 --retries 5 --timeout 60
py -m pip install pypandoc>=1.11 --retries 5 --timeout 60
```

### Pandoc not found error
Ensure Pandoc is installed and added to your system PATH. Restart your terminal after installation.

### Port already in use
If ports 5173 or 6201 are in use, stop other applications using them or modify the ports in:
- **Backend**: `pdf3md/app.py` (line ~477: `port=6201`)
- **Frontend**: `pdf3md/vite.config.js`

---

## Docker Installation (Alternative)

For Docker-based installation, see the main [README.md](README.md).

---

## macOS App (DMG)

If you want a native macOS app that runs without a preinstalled Python/Node:

```bash
cd /Users/olgazaharova/Project/pdf3md
./macos/build_dmg.sh
```

Open the DMG and drag `PDF3MD.app` to Applications.  
Launch the app to open `http://localhost:6201`.

> **Note**: The build script now bundles Pandoc into the App, so it **works offline** without manual installation.

---

## Windows Installer (Inno Setup)

If you want a Windows installer, use Inno Setup with `windows/installer.iss` and set the default install path to:
`C:\Project\pdf3md`.
