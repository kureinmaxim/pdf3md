MacOS DMG build (local)

1) Build DMG:
   ./macos/build_dmg.sh

2) Open the DMG and drag PDF3MD.app to Applications.

3) Launch PDF3MD.app:
   - Starts embedded backend server
   - Opens http://localhost:6201
   - Updates cached frontend template on new versions

Build requirements (only for building the DMG):
- Python 3.13+
- Node.js 18+

Version management:
- Update version: `python scripts/update_version.py sync`
- Build metadata: `python scripts/build_meta.py`
