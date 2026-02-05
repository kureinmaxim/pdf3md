# Version Management

This document explains how PDF3MD tracks version, release date, and developer
across macOS and Windows builds.

## Working Directory

**All commands must be run from the project root directory:**

```bash
cd /Users/olgazaharova/Project/pdf3md
# or wherever you cloned the repository
```

## Source of truth

Version information lives in `pyproject.toml`:

```toml
[project]
version = "X.Y.Z"

[tool.pdf3md]
release_date = "YYYY-MM-DD"
developer = "Developer Name"
```

## Files synchronized automatically

The script `scripts/update_version.py` synchronizes:

- `pyproject.toml` (version + release date)
- `pdf3md/version.json`
- `windows/installer.iss` (`#define AppVersion`)

## Commands

Run from project root (`pdf3md/`):

```bash
# Activate virtual environment first (macOS/Linux)
source venv/bin/activate

# Version management
python3 scripts/update_version.py status
python3 scripts/update_version.py sync
python3 scripts/update_version.py sync 1.2.3
python3 scripts/update_version.py bump patch
python3 scripts/update_version.py bump minor
python3 scripts/update_version.py bump major
python3 scripts/update_version.py release
```

**Windows (PowerShell):**

```powershell
# Activate virtual environment first
.\venv\Scripts\Activate.ps1

# Version management
python scripts/update_version.py status
python scripts/update_version.py sync
python scripts/update_version.py sync 1.2.3
python scripts/update_version.py bump patch
python scripts/update_version.py bump minor
python scripts/update_version.py bump major
python scripts/update_version.py release

```

## Build metadata

Build metadata is generated into `pdf3md/build_meta.json`.

Run from project root:

```bash
source venv/bin/activate
python3 scripts/build_meta.py
```

The backend reads `build_meta.json` first (if present) and falls back to
`pyproject.toml` and `version.json` otherwise.

## Building Installers

### macOS DMG

Run from project root:

```bash
./macos/build_dmg.sh
```

Output: `dist/PDF3MD.dmg`

### Windows Installer

Run from project root (requires Inno Setup):

```powershell
# PowerShell
.\windows\setup_app.ps1
```

## UI footer

The frontend footer reads version info from the backend endpoint:

```
GET /version
```

It displays:
- Version
- Release date
- Developer

All text is shown in English in the UI.
