# Version Management

This document explains how PDF3MD tracks version, release date, and developer
across macOS and Windows builds.

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

```bash
python scripts/update_version.py status
python scripts/update_version.py sync
python scripts/update_version.py sync 1.2.3
python scripts/update_version.py bump patch
python scripts/update_version.py bump minor
python scripts/update_version.py bump major
python scripts/update_version.py release
```

## Build metadata

Build metadata is generated into:

`pdf3md/build_meta.json`

Use:

```bash
python scripts/build_meta.py
```

The backend reads `build_meta.json` first (if present) and falls back to
`pyproject.toml` and `version.json` otherwise.

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
