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

echo "==> Building PDF3MD v$APP_VERSION for macOS"

# Clean previous build
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources/bin"
mkdir -p "$APP_DIR/Contents/Resources/app_template"

# Create Info.plist
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
  <key>LSMinimumSystemVersion</key>
  <string>10.13</string>
</dict>
</plist>
EOF

# Create main executable wrapper
cat > "$APP_DIR/Contents/MacOS/PDF3MD" <<'EOF'
#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RESOURCE_DIR="$APP_DIR/Resources"
exec "$RESOURCE_DIR/launcher.sh"
EOF

chmod +x "$APP_DIR/Contents/MacOS/PDF3MD"

# Copy launcher scripts
cp "$ROOT_DIR/macos/launcher.sh" "$APP_DIR/Contents/Resources/launcher.sh"
cp "$ROOT_DIR/macos/stop.sh" "$APP_DIR/Contents/Resources/stop.sh"
chmod +x "$APP_DIR/Contents/Resources/launcher.sh" "$APP_DIR/Contents/Resources/stop.sh"

# Build frontend
echo "==> Building frontend..."
cd "$ROOT_DIR/pdf3md"
npm install
npm run build

# Prepare frontend template
echo "==> Preparing frontend template..."
rm -rf "$APP_DIR/Contents/Resources/app_template"
mkdir -p "$APP_DIR/Contents/Resources/app_template"
cp -R "$ROOT_DIR/pdf3md/dist/." "$APP_DIR/Contents/Resources/app_template/"
TEMPLATE_VERSION="${APP_VERSION}-$(date -u +"%Y%m%d%H%M%S")"
echo "$TEMPLATE_VERSION" > "$APP_DIR/Contents/Resources/app_template/.app_version"
echo "   Template version: $TEMPLATE_VERSION"

# Prepare Python build environment
echo "==> Setting up Python build environment..."
python3 -m venv "$BUILD_VENV"
"$BUILD_VENV/bin/pip" install --upgrade pip
"$BUILD_VENV/bin/pip" install -r "$ROOT_DIR/pdf3md/requirements.txt"
"$BUILD_VENV/bin/pip" install -r "$ROOT_DIR/macos/requirements-build.txt"

# Generate build metadata
echo "==> Generating build metadata..."
"$BUILD_VENV/bin/python3" "$ROOT_DIR/scripts/build_meta.py"

# Bundle Pandoc
echo "==> Bundling Pandoc..."
PANDOC_BIN=$(which pandoc || echo "")
if [ -z "$PANDOC_BIN" ]; then
    echo "Warning: pandoc not found in PATH. Will download at runtime."
else
    rm -rf "$DIST_DIR/pandoc"
    mkdir -p "$DIST_DIR/pandoc"
    cp "$PANDOC_BIN" "$DIST_DIR/pandoc/"
fi

# Build backend binary with PyInstaller
echo "==> Building backend binary..."
cd "$ROOT_DIR"
rm -rf "$DIST_DIR/pyinstaller"
mkdir -p "$DIST_DIR/pyinstaller"

# Build PyInstaller spec with hidden imports
PYINSTALLER_ARGS=(
  --onefile
  --name pdf3md-server
  --distpath "$DIST_DIR/pyinstaller"
  --workpath "$DIST_DIR/pyinstaller/build"
  --specpath "$DIST_DIR/pyinstaller"
  --collect-data docx
  --hidden-import=pdf3md
  --hidden-import=pdf3md.config
  --hidden-import=pdf3md.utils
  --hidden-import=pdf3md.utils.file_utils
  --hidden-import=pdf3md.utils.pandoc_utils
  --hidden-import=pdf3md.utils.version_utils
  --hidden-import=pdf3md.converters
  --hidden-import=pdf3md.converters.pdf_converter
  --hidden-import=pdf3md.converters.docx_converter
  --hidden-import=pdf3md.formatters
  --hidden-import=pdf3md.formatters.docx_formatter
  --hidden-import=pdf3md.formatters.docx_cleaners
  --add-data "$ROOT_DIR/pdf3md/dist:dist"
  --add-data "$ROOT_DIR/pdf3md/version.json:."
  --add-data "$ROOT_DIR/pdf3md/build_meta.json:."
)

# Bundle python-docx templates (required for header/footer operations)
DOCX_TEMPLATES_DIR="$("$BUILD_VENV/bin/python3" - <<'PY'
import pathlib
import docx

templates_dir = pathlib.Path(docx.__file__).parent / "templates"
print(str(templates_dir))
PY
)"

if [ -d "$DOCX_TEMPLATES_DIR" ]; then
  PYINSTALLER_ARGS+=(--add-data "$DOCX_TEMPLATES_DIR:docx/templates")
fi

# Add Pandoc if available
if [ -d "$DIST_DIR/pandoc" ]; then
  PYINSTALLER_ARGS+=(--add-data "$DIST_DIR/pandoc:pandoc")
fi

"$BUILD_VENV/bin/pyinstaller" "${PYINSTALLER_ARGS[@]}" "$ROOT_DIR/pdf3md_standalone.py"

# Copy binary to app
cp "$DIST_DIR/pyinstaller/pdf3md-server" "$APP_DIR/Contents/Resources/bin/pdf3md-server"
chmod +x "$APP_DIR/Contents/Resources/bin/pdf3md-server"

# Save version
echo "$APP_VERSION" > "$APP_DIR/Contents/Resources/.app_version"

echo ""
echo "✅ App built successfully at: $APP_DIR"
echo "   Version: $APP_VERSION"
echo ""
echo "To test: open $APP_DIR"
echo "To build DMG: ./macos/build_dmg.sh"
