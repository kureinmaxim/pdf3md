# Running PDF3MD on Windows (PowerShell)

Repo layout: backend at `pdf3md/app.py`, frontend in `pdf3md/`.

## Quick Start (Development)

Open **two PowerShell terminals** and run the following commands:

### Terminal 1 — Backend Server

```powershell
cd C:\Project\pdf3md
py -m venv venv
venv\Scripts\activate
py -m pip install -r requirements.txt
py pdf3md\app.py
```

Expected output:
```
INFO:__main__:Starting Flask server...
 * Running on http://127.0.0.1:6201
```

### Terminal 2 — Frontend Server

```powershell
cd C:\Project\pdf3md\pdf3md
npm install
npm run dev
```

Expected output:
```
VITE v6.0.6  ready in 217 ms

➜  Local:   http://localhost:5173/
```

---

## Access the Application

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:6201 |

---

## Stop the Servers

Press `Ctrl+C` in each terminal to stop the servers.

---

## One-Liner (Background Mode)

To run both servers in background mode (single terminal):

```powershell
cd C:\Project\pdf3md\pdf3md

# Start backend in background
Start-Process -NoNewWindow ..\venv\Scripts\python.exe -ArgumentList "app.py"

# Start frontend
npm run dev
```

> ⚠️ Note: Background processes will need to be stopped manually via Task Manager or `Stop-Process`.

---

# Running PDF3MD on macOS/Linux (Bash)

## Quick Start (Development)

Open **two terminals** and run the following commands:

### Terminal 1 — Backend Server

```bash
cd /Users/olgazaharova/Project/pdf3md
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 pdf3md/app.py
```

Expected output:
```
INFO:__main__:Starting Flask server...
 * Running on http://127.0.0.1:6201
```

### Terminal 2 — Frontend Server

```bash
cd /Users/olgazaharova/Project/pdf3md/pdf3md
npm install
npm run dev
```

Expected output:
```
VITE v6.0.6  ready in 217 ms

➜  Local:   http://localhost:5173/
```

---

## One-Liner (Background Mode)

To run both servers in background mode (single terminal):

```bash
cd /Users/olgazaharova/Project/pdf3md/pdf3md

# Start backend in background using the virtual environment
../venv/bin/python3 app.py &

# Start frontend
npm run dev

---

# Production Mode (Single Server)

Build the frontend once and serve it from Flask:

```bash
cd /Users/olgazaharova/Project/pdf3md
npm install
npm run build
```

Then run the backend:

**Windows (PowerShell):**
```powershell
cd C:\Project\pdf3md
venv\Scripts\activate
py pdf3md\app.py
```

**macOS/Linux (Bash):**
```bash
cd /Users/olgazaharova/Project/pdf3md
source venv/bin/activate
python3 pdf3md/app.py
```

Open: http://localhost:6201

---

# macOS App (DMG)

If you want a native macOS app that runs without a preinstalled Python/Node:

```bash
cd /Users/olgazaharova/Project/pdf3md
./macos/build_dmg.sh
```

Open the DMG and drag `PDF3MD.app` to Applications.  
Launch the app to open `http://localhost:6201`.
```

---

# Windows Installer (Inno Setup)

If you want an installer on Windows, use Inno Setup with `windows/installer.iss` and set the default install path to:
`C:\Project\pdf3md`.

