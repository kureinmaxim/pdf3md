# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PDF3MD converts PDF→Markdown and Markdown→DOCX (with customizable formatting profiles). Python Flask backend + React/Vite frontend, deployable as Docker containers or standalone desktop apps (macOS/Windows).

## Development Commands

### Backend
```bash
# Start Flask server (port 6201)
python run_server.py

# Or with debug mode
FLASK_DEBUG=1 python run_server.py
```

### Frontend
```bash
# Dev server with hot reload (port 5173, proxies API to 6201)
cd pdf3md && npm run dev

# Production build
cd pdf3md && npm run build

# Lint
cd pdf3md && npm run lint
```

### Docker
```bash
# Production (ports 3000 + 6201)
./docker-start.sh start

# Development with hot reload
./docker-start.sh dev

# Stop
./docker-start.sh stop
```

### Version Management
```bash
# Show current version
python scripts/update_version.py status

# Bump version (updates pyproject.toml, version.json, installer.iss)
python scripts/update_version.py bump patch|minor|major

# Bump + git commit + push
python scripts/update_version.py release
```

### Desktop Builds
```bash
# macOS
macos/build_app.sh    # → dist/PDF3MD.app
macos/build_dmg.sh    # → dist/PDF3MD.dmg

# Windows (PowerShell)
windows/build_app.ps1  # → .exe via PyInstaller
```

## Architecture

### Backend (Python)

Entry point: `run_server.py` → `pdf3md/app.py` (Flask on port 6201).

- **pdf3md/config.py** — Flask app factory, CORS, logging setup
- **pdf3md/converters/** — `pdf_converter.py` (PyMuPDF4LLM), `docx_converter.py` (Pandoc)
- **pdf3md/formatters/** — DOCX formatting engine:
  - `docx_formatter.py` — applies profile settings (margins, fonts, headings, tables, page numbers)
  - `profile_manager.py` — singleton CRUD for JSON profiles stored in `~/.pdf3md/profiles/`
  - `profile_schema.py` — default profile, validation, merge logic
  - `docx_cleaners.py` — post-processing cleanup of Pandoc output
- **pdf3md/utils/** — Pandoc auto-discovery/download, version loading, file helpers

PDF conversion is async: POST `/convert` spawns a background thread, client polls `/progress/<id>` for status updates via a shared `conversion_progress` dict.

### Frontend (React)

Source in `pdf3md/src/`, built output in `pdf3md/dist/` (served by Flask in production).

- **App.jsx** — main component (~939 lines), manages conversion state, file uploads, history (localStorage)
- **components/** — ProfileSelector, ProfileManager, ProfileEditor, MultiFileUploadStatus, Sidebar
- **api/profileApi.js** — fetch wrapper for profile CRUD endpoints
- **vite.config.js** — proxies `/convert`, `/progress`, `/api`, `/version` to Flask on port 6201

### Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/convert` | POST | Upload PDF, start async conversion |
| `/progress/<id>` | GET | Poll conversion progress |
| `/convert-markdown-to-word` | POST | MD→DOCX with optional profile |
| `/convert-word-to-markdown` | POST | DOCX→MD |
| `/api/profiles` | GET/POST | List/create profiles |
| `/api/profiles/<name>` | GET/PUT/DELETE | Profile CRUD |
| `/version` | GET | Version info |

### Version

Single source of truth: `pyproject.toml`. Synced to `pdf3md/version.json` and `windows/installer.iss` via `scripts/update_version.py`.

## Key Patterns

- **Async conversion**: Background threads + shared progress dict (not a task queue)
- **ProfileManager**: Singleton, stores profiles as JSON in `~/.pdf3md/profiles/`, hash-based filenames
- **Pandoc discovery**: Bundled binary → app directory → auto-download via pypandoc
- **Platform paths**: `sys.platform` checks for macOS/Windows/Linux-specific directories
- **Static serving**: Flask serves built React from `pdf3md/dist/` in production; Vite proxy in dev
