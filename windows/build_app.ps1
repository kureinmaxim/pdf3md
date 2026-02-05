# PDF3MD Windows Build Script
# Builds standalone .exe for Windows using PyInstaller

param(
    [string]$Version = "0.1.0"
)

$ErrorActionPreference = "Stop"
$ROOT_DIR = Split-Path -Parent $PSScriptRoot
$DIST_DIR = Join-Path $ROOT_DIR "dist"
$BUILD_DIR = Join-Path $DIST_DIR "windows-build"
$VENV_DIR = Join-Path $BUILD_DIR "build-venv"
$OUTPUT_DIR = Join-Path $DIST_DIR "windows"

Write-Host "==> Building PDF3MD v$Version for Windows" -ForegroundColor Green

# Clean previous build
if (Test-Path $OUTPUT_DIR) {
    Remove-Item -Recurse -Force $OUTPUT_DIR
}
New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null

# Create Python virtual environment
Write-Host "==> Setting up Python build environment..." -ForegroundColor Yellow
if (Test-Path $VENV_DIR) {
    Remove-Item -Recurse -Force $VENV_DIR
}
python -m venv $VENV_DIR
& "$VENV_DIR\Scripts\python.exe" -m pip install --upgrade pip

# Install dependencies
$PDF3MD_DIR = Join-Path $ROOT_DIR "pdf3md"
& "$VENV_DIR\Scripts\pip.exe" install -r (Join-Path $PDF3MD_DIR "requirements.txt")
& "$VENV_DIR\Scripts\pip.exe" install pyinstaller

# Build frontend
Write-Host "==> Building frontend..." -ForegroundColor Yellow
Push-Location $PDF3MD_DIR
npm install
npm run build
Pop-Location

# Generate build metadata
Write-Host "==> Generating build metadata..." -ForegroundColor Yellow
& "$VENV_DIR\Scripts\python.exe" (Join-Path $ROOT_DIR "scripts\build_meta.py")

# Bundle Pandoc
Write-Host "==> Checking for Pandoc..." -ForegroundColor Yellow  
$PANDOC_DIR = Join-Path $BUILD_DIR "pandoc"
$PANDOC_EXE = Get-Command pandoc -ErrorAction SilentlyContinue
if ($PANDOC_EXE) {
    New-Item -ItemType Directory -Path $PANDOC_DIR -Force | Out-Null
    Copy-Item $PANDOC_EXE.Path -Destination $PANDOC_DIR
    Write-Host "   Pandoc bundled" -ForegroundColor Green
} else {
    Write-Host "   Warning: Pandoc not found, will download at runtime" -ForegroundColor Yellow
}

# Build with PyInstaller
Write-Host "==> Building executable with PyInstaller..." -ForegroundColor Yellow

$PYINSTALLER_DIR = Join-Path $DIST_DIR "pyinstaller"
if (Test-Path $PYINSTALLER_DIR) {
    Remove-Item -Recurse -Force $PYINSTALLER_DIR
}

$PYINSTALLER_ARGS = @(
    "--onefile",
    "--name", "PDF3MD",
    "--distpath", $PYINSTALLER_DIR,
    "--workpath", (Join-Path $PYINSTALLER_DIR "build"),
    "--specpath", $PYINSTALLER_DIR,
    "--hidden-import=pdf3md",
    "--hidden-import=pdf3md.config",
    "--hidden-import=pdf3md.utils",
    "--hidden-import=pdf3md.utils.file_utils",
    "--hidden-import=pdf3md.utils.pandoc_utils",
    "--hidden-import=pdf3md.utils.version_utils",
    "--hidden-import=pdf3md.converters",
    "--hidden-import=pdf3md.converters.pdf_converter",
    "--hidden-import=pdf3md.converters.docx_converter",
    "--hidden-import=pdf3md.formatters",
    "--hidden-import=pdf3md.formatters.docx_formatter",
    "--hidden-import=pdf3md.formatters.docx_cleaners",
    "--add-data", "$PDF3MD_DIR\dist;dist",
    "--add-data", "$PDF3MD_DIR\version.json;.",
    "--add-data", "$PDF3MD_DIR\build_meta.json;.",
    "--console"
)

if (Test-Path $PANDOC_DIR) {
    $PYINSTALLER_ARGS += "--add-data", "$PANDOC_DIR;pandoc"
}

Push-Location $ROOT_DIR
& "$VENV_DIR\Scripts\pyinstaller.exe" @PYINSTALLER_ARGS (Join-Path $ROOT_DIR "pdf3md_standalone.py")
Pop-Location

# Copy executable to output
Copy-Item (Join-Path $PYINSTALLER_DIR "PDF3MD.exe") -Destination $OUTPUT_DIR

Write-Host ""
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host "   Executable: $(Join-Path $OUTPUT_DIR 'PDF3MD.exe')" -ForegroundColor Cyan
Write-Host "   Version: $Version" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test: & '$(Join-Path $OUTPUT_DIR 'PDF3MD.exe')'" -ForegroundColor Yellow
