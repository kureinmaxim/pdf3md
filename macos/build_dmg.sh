#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
STAGE_DIR="$DIST_DIR/dmg-stage"
DMG_PATH="$DIST_DIR/PDF3MD.dmg"

"$ROOT_DIR/macos/build_app.sh"

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"

cp -R "$DIST_DIR/PDF3MD.app" "$STAGE_DIR/"
ln -s /Applications "$STAGE_DIR/Applications"

rm -f "$DMG_PATH"
hdiutil create -volname "PDF3MD" -srcfolder "$STAGE_DIR" -ov -format UDZO "$DMG_PATH"

echo "DMG created at $DMG_PATH"
