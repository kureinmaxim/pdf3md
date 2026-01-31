# PDF3MD System Architecture

> **Document Version:** 1.1.0
> **Date:** 2026-01-31

## 📋 Overview

**PDF3MD** is a hybrid web/desktop application designed for high-fidelity conversion of PDF documents to Markdown and Markdown to Microsoft Word (DOCX). It leverages a modern React frontend for a responsive user interface and a Python Flask backend for robust document processing.

---

## 🔧 Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React + Vite | Modern, fast-loading UI with drag-and-drop support. |
| **Backend** | Python 3.13+ + Flask | REST API for handling file uploads and conversion logic. |
| **PDF Engine** | PyMuPDF4LLM | Advanced PDF extraction focusing on structure preservation. |
| **DOCX Engine** | Pandoc + python-docx | Universal document converter with post-processing for Word output. |
| **Packaging** | Docker | Containerized deployment for consistent environments. |
| **Desktop** | PyInstaller (macOS/Windows) | Bundles backend as a standalone executable. |
| **Installer** | DMG (macOS) / Inno Setup (Windows) | Creates native installers for each platform. |

---

## 📂 Project Structure

```text
pdf3md/
├── pdf3md/                 # Main Application Source
│   ├── app.py              # Flask Backend Entry Point & API
│   ├── src/                # React Frontend Source
│   │   ├── App.jsx         # Main UI Component
│   │   ├── components/     # UI Components (Sidebar, MultiFileUploadStatus)
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets (favicons, etc.)
│   ├── vite.config.js      # Vite Configuration (Proxy setup)
│   ├── version.json        # Version info for frontend
│   ├── build_meta.json     # Build metadata (generated)
│   └── requirements.txt    # Backend Dependencies
├── macos/                  # macOS Build Tools
│   ├── build_app.sh        # Script to build macOS .app bundle
│   ├── build_dmg.sh        # Script to build macOS .dmg installer
│   ├── launcher.sh         # App launcher script
│   └── stop.sh             # App stop script
├── windows/                # Windows Build Tools
│   ├── installer.iss       # Inno Setup Script
│   ├── setup_app.ps1       # Initial setup script
│   ├── start_app.ps1       # App launcher script
│   └── stop_app.ps1        # App stop script
├── scripts/                # Utility Scripts
│   ├── update_version.py   # Version management
│   └── build_meta.py       # Build metadata generator
├── docker-compose.yml      # Production Docker Orchestration
├── docker-compose.dev.yml  # Development Docker Orchestration
├── docker-start.sh         # Application Management Script
├── pyproject.toml          # Project Metadata & Configuration (single source of truth)
├── README.md               # General Documentation
└── SYSTEM_ARCHITECTURE.md  # Architecture Documentation (This file)
```

---

## 🏗️ System Architecture

The system operates as a client-server architecture, which can run either distributed (Docker) or monolithic (Desktop App).

```
┌─────────────────────────────────────────────────────────────┐
│                   Browser / Electron UI                     │
│               React + Vite (Frontend)                       │
│                                                             │
│   [Upload Zone] <---> [Status Monitor] <---> [Download/Edit]│
└───────────┬───────────────────▲─────────────────────────────┘
            │ HTTP POST /convert│ Polling /progress/<id>
            │                   │
┌───────────▼───────────────────┴─────────────────────────────┐
│                   Backend Service                           │
│                Flask API (Port 6201)                        │
│                                                             │
│  ┌─────────────────┐       ┌──────────────────────────┐     │
│  │  PyMuPDF4LLM    │       │        Pandoc            │     │
│  │ (PDF -> MD)     │       │ (MD -> DOCX)             │     │
│  └────────┬────────┘       └────────────┬─────────────┘     │
│           │                             │                   │
└───────────┼─────────────────────────────┼───────────────────┘
            │ File System Operations      │
      ┌─────▼──────┐                ┌─────▼──────┐
      │  Temp Storage│              │  Temp Storage│
      │  (Uploads)   │              │  (Outputs)   │
      └────────────┘                └────────────┘
```

### Key Interactions

1.  **Frontend**: Serves the UI. In production, these are static files served by Flask or Nginx. In dev, served by Vite.
2.  **API Layer**: Flask exposes endpoints:
    *   `/convert`: Accepts PDF uploads, returns conversion ID for progress tracking.
    *   `/convert-markdown-to-word`: Accepts MD content, returns DOCX binary.
    *   `/convert-word-to-markdown`: Accepts DOCX uploads, returns Markdown.
    *   `/progress/<id>`: Returns status of long-running tasks.
    *   `/version`: Returns version info and build metadata.
3.  **Processing Layer**:
    *   **PDF Processing**: Uses `PyMuPDF4LLM` to extract text and layout analysis to generate Markdown.
    *   **Word Conversion**: Pipes Markdown through `Pandoc` then applies post-processing with `python-docx` for formatting (margins, headers, tables, page numbers).

---

## 🔄 Data Flow

### 1. PDF to Markdown Conversion

1.  **Upload**: User drags PDF to UI. Frontend sends `POST /convert` with file data.
2.  **Processing**: Backend saves file to temp dir. `PyMuPDF4LLM` processes file page-by-page.
3.  **Feedback**: Frontend polls `/progress/<task_id>` every few seconds to update progress bar.
4.  **Result**: Backend returns JSON with Markdown content. Frontend displays it in the editor.

### 2. Markdown to Word Conversion

1.  **Input**: User edits Markdown in the UI editor.
2.  **Request**: User clicks "Convert to Word". Frontend sends `POST /convert-markdown-to-word`.
3.  **Conversion**: Backend invokes `pypandoc` to convert string buffer to DOCX bytes.
4.  **Download**: Backend returns the binary stream. Browser triggers file download.

---

## 🚀 Deployment Models

### Docker (Recommended for Server/Web)
Uses two containers:
*   `backend`: Python + Flask + System Deps (Pandoc).
*   `frontend`: Nginx serving the built React static files.

### Desktop App (Standalone)
*   **macOS**: `macos/build_dmg.sh` uses PyInstaller to bundle Python+Flask into a single Unix executable, wrapped in a `.app` bundle with bundled Pandoc.
*   **Windows**: `windows/installer.iss` compiles a `.exe` installer that deploys the Python environment and sets up the application shortcuts.

---

## 📁 Platform-Specific Paths

The application uses platform-specific directories for data storage:

| Purpose | Windows | macOS | Linux |
|---------|---------|-------|-------|
| **Pandoc** | `%LOCALAPPDATA%\PDF3MD\pandoc\` | `~/Library/Application Support/PDF3MD/pandoc/` | `~/.local/share/PDF3MD/pandoc/` |
| **Logs** | `%LOCALAPPDATA%\PDF3MD\logs\` | `~/Library/Logs/PDF3MD/` | `~/.local/share/PDF3MD/logs/` |
| **App Data** | `%LOCALAPPDATA%\PDF3MD\app\` | `~/Library/Application Support/PDF3MD/app/` | `~/.local/share/PDF3MD/app/` |

### Pandoc Auto-Download

If Pandoc is not found (not bundled or not in PATH), the application automatically downloads it on first use:

1. Checks for bundled Pandoc (PyInstaller `_MEIPASS`)
2. Checks platform-specific app data directory
3. If not found, downloads via `pypandoc.download_pandoc()`
4. Stores in app data directory for future use

---

## 🔢 Version Management

Version information is centralized in `pyproject.toml`:

```toml
[project]
name = "pdf3md"
version = "0.1.1"

[tool.pdf3md]
release_date = "2026-01-31"
developer = "Developer Name"
```

Build metadata is generated during build process via `scripts/build_meta.py` and stored in `pdf3md/build_meta.json`.
