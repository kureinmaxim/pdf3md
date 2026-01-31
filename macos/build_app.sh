#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
APP_DIR="$DIST_DIR/PDF3MD.app"
BUILD_VENV="$DIST_DIR/build-venv"
APP_VERSION="$(date +%Y%m%d%H%M%S)"

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources/bin"
mkdir -p "$APP_DIR/Contents/Resources/app_template"

cat > "$APP_DIR/Contents/Info.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>PDF3MD</string>
  <key>CFBundleDisplayName</key>
  <string>PDF3MD</string>
  <key>CFBundleIdentifier</key>
  <string>com.pdf3md.app</string>
  <key>CFBundleVersion</key>
  <string>1.0.0</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleExecutable</key>
  <string>PDF3MD</string>
</dict>
</plist>
EOF

cat > "$APP_DIR/Contents/MacOS/PDF3MD" <<'EOF'
#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RESOURCE_DIR="$APP_DIR/Resources"
exec "$RESOURCE_DIR/launcher.sh"
EOF

chmod +x "$APP_DIR/Contents/MacOS/PDF3MD"

cp "$ROOT_DIR/macos/launcher.sh" "$APP_DIR/Contents/Resources/launcher.sh"
cp "$ROOT_DIR/macos/stop.sh" "$APP_DIR/Contents/Resources/stop.sh"
chmod +x "$APP_DIR/Contents/Resources/launcher.sh" "$APP_DIR/Contents/Resources/stop.sh"

echo "Building frontend..."
cd "$ROOT_DIR/pdf3md"
npm install
npm run build

echo "Preparing frontend template..."
rm -rf "$APP_DIR/Contents/Resources/app_template"
mkdir -p "$APP_DIR/Contents/Resources/app_template"
cp -R "$ROOT_DIR/pdf3md/dist/." "$APP_DIR/Contents/Resources/app_template/"
echo "$APP_VERSION" > "$APP_DIR/Contents/Resources/app_template/.app_version"

echo "Preparing Python build environment..."
python3 -m venv "$BUILD_VENV"
"$BUILD_VENV/bin/pip" install -r "$ROOT_DIR/pdf3md/requirements.txt"
"$BUILD_VENV/bin/pip" install -r "$ROOT_DIR/macos/requirements-build.txt"

echo "Building backend binary..."
cd "$ROOT_DIR"
rm -rf "$DIST_DIR/pyinstaller"
mkdir -p "$DIST_DIR/pyinstaller"

"$BUILD_VENV/bin/pyinstaller" \
  --onefile \
  --name pdf3md-server \
  --distpath "$DIST_DIR/pyinstaller" \
  --workpath "$DIST_DIR/pyinstaller/build" \
  --specpath "$DIST_DIR/pyinstaller" \
  --add-data "$ROOT_DIR/pdf3md/dist:dist" \
  "$ROOT_DIR/pdf3md/app.py"

cp "$DIST_DIR/pyinstaller/pdf3md-server" "$APP_DIR/Contents/Resources/bin/pdf3md-server"
chmod +x "$APP_DIR/Contents/Resources/bin/pdf3md-server"

echo "$APP_VERSION" > "$APP_DIR/Contents/Resources/.app_version"

echo "App built at $APP_DIR"
