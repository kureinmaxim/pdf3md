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

# Detach any previously mounted PDF3MD volumes
echo "Cleaning up any mounted PDF3MD volumes..."
for dev in $(hdiutil info | grep -B 10 "/Volumes/PDF3MD" | grep "^/dev/disk" | awk '{print $1}' | sort -u); do
    echo "Detaching $dev..."
    hdiutil detach "$dev" -force 2>/dev/null || true
done

echo "Creating DMG from staging folder..."
# Two-step process: create uncompressed with explicit size, then compress
# This avoids "No space left on device" errors on some systems
TEMP_DMG="/tmp/PDF3MD_temp_$$.dmg"
hdiutil create \
    -volname "PDF3MD" \
    -srcfolder "$STAGE_DIR" \
    -ov \
    -format UDRW \
    -size 200m \
    "$TEMP_DMG"

# Volume icon: put .VolumeIcon.icns on the RW image and set the custom-icon flag
echo "Setting volume icon..."
MOUNT_DIR="$(mktemp -d /tmp/PDF3MD_mnt.XXXXXX)"
if hdiutil attach "$TEMP_DMG" -nobrowse -noautoopen -mountpoint "$MOUNT_DIR" >/dev/null; then
    cp "$ROOT_DIR/macos/PDF3MD.icns" "$MOUNT_DIR/.VolumeIcon.icns"
    if command -v SetFile >/dev/null 2>&1; then
        SetFile -c icnC "$MOUNT_DIR/.VolumeIcon.icns" || true
        SetFile -a C "$MOUNT_DIR" || true
    else
        echo "   Warning: SetFile not found (install Xcode CLT); volume icon flag not set"
    fi
    sync
    hdiutil detach "$MOUNT_DIR" >/dev/null || hdiutil detach "$MOUNT_DIR" -force >/dev/null
fi
rmdir "$MOUNT_DIR" 2>/dev/null || true

echo "Compressing DMG..."
hdiutil convert "$TEMP_DMG" -format UDZO -o "$DMG_PATH"
rm -f "$TEMP_DMG"

rm -rf "$STAGE_DIR"

echo "DMG created at $DMG_PATH"
