# Running PDF3MD on Windows (PowerShell)

## Quick Start

Open **two PowerShell terminals** and run the following commands:

### Terminal 1 — Backend Server

```powershell
cd c:\Project\pdf3md\pdf3md
py app.py
```

Expected output:
```
INFO:__main__:Starting Flask server...
 * Running on http://127.0.0.1:6201
```

### Terminal 2 — Frontend Server

```powershell
cd c:\Project\pdf3md\pdf3md
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
cd c:\Project\pdf3md\pdf3md

# Start backend in background
Start-Process -NoNewWindow py -ArgumentList "app.py"

# Start frontend
npm run dev
```

> ⚠️ Note: Background processes will need to be stopped manually via Task Manager or `Stop-Process`.
