#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
APP_DIR="$DIST_DIR/PDF3MD.app"
BUILD_VENV="$DIST_DIR/build-venv"
APP_VERSION="$(python3 -c "
import tomllib, pathlib
path = pathlib.Path('$ROOT_DIR/pyproject.toml')
try:
    data = tomllib.loads(path.read_text(encoding='utf-8'))
    print(data.get('project', {}).get('version', '0.1.0'))
except Exception:
    print('0.1.0')
")"

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources/bin"
mkdir -p "$APP_DIR/Contents/Resources/app_template"

cat > "$APP_DIR/Contents/Info.plist" <<EOF
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
  <string>${APP_VERSION}</string>
  <key>CFBundleShortVersionString</key>
  <string>${APP_VERSION}</string>
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

echo "Generating build metadata..."
"$BUILD_VENV/bin/python3" "$ROOT_DIR/scripts/build_meta.py"

echo "Bundling Pandoc..."
PANDOC_BIN=$(which pandoc)
if [ -z "$PANDOC_BIN" ]; then
    echo "Error: pandoc not found in PATH. Please install dependencies first."
    exit 1
fi
rm -rf "$DIST_DIR/pandoc"
mkdir -p "$DIST_DIR/pandoc"
cp "$PANDOC_BIN" "$DIST_DIR/pandoc/"

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
  --add-data "$DIST_DIR/pandoc:pandoc" \
  --add-data "$ROOT_DIR/pdf3md/version.json:." \
  --add-data "$ROOT_DIR/pdf3md/build_meta.json:." \
  "$ROOT_DIR/pdf3md/app.py"

cp "$DIST_DIR/pyinstaller/pdf3md-server" "$APP_DIR/Contents/Resources/bin/pdf3md-server"
chmod +x "$APP_DIR/Contents/Resources/bin/pdf3md-server"

echo "$APP_VERSION" > "$APP_DIR/Contents/Resources/.app_version"

echo "App built at $APP_DIR"
