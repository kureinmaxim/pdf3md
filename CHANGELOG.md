# Changelog

## 1.1.0 — 2026-11-27

### Added
- New interface: mode tabs (PDF → Markdown, Word → Markdown, Markdown → Word), large keyboard-accessible drop zone, file cards with progress and retry, result view with Preview / Markdown / Split, copy and `.md` download.
- Dark theme: follows the system setting, with a System / Light / Dark switch that is remembered.
- Markdown → Word editor with live preview, opening and dropping `.md` files, file name field.
- Toast notifications (with undo for history deletions) instead of browser alerts.
- New app icon for macOS (`.icns`, DMG volume icon), Windows (`.exe`, installer) and the web favicon; `scripts/build_icons.sh` regenerates all of them.

### Changed
- Frontend updated to React 19 and Vite 7; Node.js 20.19+ is required for development.
- Backend and frontend dependencies updated.
- All `eslint-plugin-react-hooks` 7 recommended rules enabled.
- Documentation moved to `doc/`.

### Fixed
- Generated DOCX files no longer start with a `PROFILE DEBUG` line or carry it in the page header.
