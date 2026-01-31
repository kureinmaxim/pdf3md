$ErrorActionPreference = "Stop"

$appRoot = (Resolve-Path "$PSScriptRoot\..").Path
$venvDir = Join-Path $appRoot "venv"
$pythonExe = Join-Path $venvDir "Scripts\python.exe"
$pipExe = Join-Path $venvDir "Scripts\pip.exe"
$frontendDir = Join-Path $appRoot "pdf3md"

function Assert-Command {
  param([string]$name)
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Command '$name' not found. Install it and retry."
  }
}

Assert-Command "py"
Assert-Command "npm"

if (-not (Get-Command "pandoc" -ErrorAction SilentlyContinue)) {
  Write-Warning "Pandoc not found. Markdown -> DOCX conversion will not work until Pandoc is installed."
}

if (-not (Test-Path $venvDir)) {
  Write-Host "Creating venv..."
  py -m venv $venvDir
}

Write-Host "Installing Python dependencies..."
& $pythonExe -m pip install --upgrade pip
& $pipExe install -r (Join-Path $appRoot "requirements.txt")

Write-Host "Installing Node dependencies..."
Push-Location $frontendDir
npm install
Write-Host "Building frontend..."
npm run build
Pop-Location

Write-Host "Generating build metadata..."
& $pythonExe (Join-Path $appRoot "scripts\build_meta.py")

Write-Host "Starting app..."
& "$PSScriptRoot\start_app.ps1"
