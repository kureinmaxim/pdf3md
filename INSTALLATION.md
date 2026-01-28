# Installation Guide for PDF3MD

This guide covers installation on **Windows** and **macOS** without Docker.

---

## Prerequisites

| Component | Windows | macOS |
|-----------|---------|-------|
| **Python** | 3.11+ | 3.11+ |
| **Node.js** | 18+ | 18+ |
| **Pandoc** | Required | Required |

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
git clone https://github.com/murtaza-nasir/pdf3md.git
cd pdf3md

# Install Python dependencies
py -m pip install -r pdf3md/requirements.txt

# Install Node.js dependencies
cd pdf3md
npm install
```

### 5. Run the Application

**Terminal 1 — Backend:**
```powershell
cd pdf3md\pdf3md
py app.py
```

**Terminal 2 — Frontend:**
```powershell
cd pdf3md\pdf3md
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:6201

---

## macOS Installation

### 1. Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Python

```bash
brew install python@3.11
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
git clone https://github.com/murtaza-nasir/pdf3md.git
cd pdf3md

# Install Python dependencies
pip3 install -r pdf3md/requirements.txt

# Install Node.js dependencies
cd pdf3md
npm install
```

### 6. Run the Application

**Terminal 1 — Backend:**
```bash
cd pdf3md/pdf3md
python3 app.py
```

**Terminal 2 — Frontend:**
```bash
cd pdf3md/pdf3md
npm run dev
```

### 7. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:6201

---

## Production Build (Optional)

To create a production build of the frontend:

```bash
cd pdf3md/pdf3md
npm run build
```

The optimized files will be in the `dist/` folder. You can serve them with any static file server.

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
