#!/bin/bash
# Build dist/PDF3MD.dmg: a drag-to-install window with PDF3MD.app, an
# Applications alias, a background with an arrow and a custom volume icon.
# Set SKIP_APP_BUILD=1 to package an already built dist/PDF3MD.app.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
STAGE_DIR="$DIST_DIR/dmg-stage"
DMG_PATH="$DIST_DIR/PDF3MD.dmg"
VOL_NAME="PDF3MD"
BACKGROUND="$ROOT_DIR/assets/dmg/background.tiff"
VOLUME_ICON="$ROOT_DIR/macos/PDF3MD.icns"

# Window geometry must match assets/dmg/background.svg (640x400, icons at x=160/480, y=190)
WIN_W=640
WIN_H=400
ICON_SIZE=128

if [ "${SKIP_APP_BUILD:-0}" != "1" ]; then
    "$ROOT_DIR/macos/build_app.sh"
fi

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR/.background"
cp -R "$DIST_DIR/PDF3MD.app" "$STAGE_DIR/"
ln -s /Applications "$STAGE_DIR/Applications"
if [ -f "$BACKGROUND" ]; then
    cp "$BACKGROUND" "$STAGE_DIR/.background/background.tiff"
fi

rm -f "$DMG_PATH"

# Detach any previously mounted PDF3MD volumes
echo "Cleaning up any mounted $VOL_NAME volumes..."
for dev in $(hdiutil info | grep -B 10 "/Volumes/$VOL_NAME" | grep "^/dev/disk" | awk '{print $1}' | sort -u); do
    echo "Detaching $dev..."
    hdiutil detach "$dev" -force 2>/dev/null || true
done

echo "Creating DMG from staging folder..."
# Two-step process: create a writable image with explicit size, customise it, then compress.
TEMP_DMG="$(mktemp -u /tmp/PDF3MD_temp_XXXXXX).dmg"
APP_MB=$(du -sm "$STAGE_DIR" | awk '{print $1}')
hdiutil create \
    -volname "$VOL_NAME" \
    -srcfolder "$STAGE_DIR" \
    -ov \
    -fs HFS+ \
    -format UDRW \
    -size "$((APP_MB + 40))m" \
    "$TEMP_DMG" >/dev/null

MOUNT_DIR="/Volumes/$VOL_NAME"
echo "Customising the installer window..."
hdiutil attach "$TEMP_DMG" -readwrite -noverify -noautoopen -mountpoint "$MOUNT_DIR" >/dev/null

# Window layout via Finder (writes .DS_Store). Best effort: needs Finder
# automation permission; without it the DMG still works, just unstyled.
if ! osascript <<APPLESCRIPT
tell application "Finder"
    tell disk "$VOL_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {200, 120, $((200 + WIN_W)), $((120 + WIN_H + 28))}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to $ICON_SIZE
        set text size of viewOptions to 13
        if exists file ".background:background.tiff" then
            set background picture of viewOptions to file ".background:background.tiff"
        end if
        set position of item "PDF3MD.app" of container window to {160, 190}
        set position of item "Applications" of container window to {480, 190}
        close
        open
        update without registering applications
        delay 1
        close
    end tell
end tell
APPLESCRIPT
then
    echo "   Warning: could not style the window via Finder (automation not allowed?)"
fi

# Volume icon (after the Finder step: Finder drops a custom volume icon it did not set)
cp "$VOLUME_ICON" "$MOUNT_DIR/.VolumeIcon.icns"
if command -v SetFile >/dev/null 2>&1; then
    SetFile -c icnC "$MOUNT_DIR/.VolumeIcon.icns" || true
    SetFile -a C "$MOUNT_DIR" || true
else
    echo "   Warning: SetFile not found (install Xcode CLT); volume icon flag not set"
fi

chmod -Rf go-w "$MOUNT_DIR" 2>/dev/null || true
sync
detached=0
for i in 1 2 3 4 5; do
    if hdiutil detach "$MOUNT_DIR" >/dev/null 2>&1; then
        detached=1
        break
    fi
    sleep 2
done
if [ "$detached" -eq 0 ]; then
    hdiutil detach "$MOUNT_DIR" -force >/dev/null
fi

echo "Compressing DMG..."
hdiutil convert "$TEMP_DMG" -format UDZO -imagekey zlib-level=9 -o "$DMG_PATH" >/dev/null
rm -f "$TEMP_DMG"
rm -rf "$STAGE_DIR"

echo "DMG created at $DMG_PATH ($(du -h "$DMG_PATH" | awk '{print $1}'))"
