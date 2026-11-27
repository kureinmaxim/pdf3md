$ErrorActionPreference = "Stop"

$appRoot = (Resolve-Path "$PSScriptRoot\..").Path
$venvDir = Join-Path $appRoot "venv"
$pythonExe = Join-Path $venvDir "Scripts\python.exe"
$pidDir = Join-Path $appRoot ".pids"
$pidFile = Join-Path $pidDir "backend.pid"
$backendScript = Join-Path $appRoot "pdf3md\app.py"

if (-not (Test-Path $pythonExe)) {
  throw "Python venv not found. Run setup first."
}

New-Item -ItemType Directory -Force -Path $pidDir | Out-Null

if (Test-Path $pidFile) {
  $existingPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1) -as [int]
  $existingProc = if ($existingPid) { Get-CimInstance Win32_Process -Filter "ProcessId = $existingPid" -ErrorAction SilentlyContinue }
  if ($existingProc -and ("$($existingProc.CommandLine)" -match 'pdf3md[\\/]app\.py')) {
    Write-Host "Backend already running (PID $existingPid)."
    Start-Process "http://localhost:6201"
    exit 0
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue  # stale
}

Write-Host "Starting backend..."
$process = Start-Process -FilePath $pythonExe `
  -ArgumentList $backendScript `
  -WorkingDirectory (Join-Path $appRoot "pdf3md") `
  -WindowStyle Hidden `
  -PassThru

$process.Id | Set-Content $pidFile

Start-Sleep -Seconds 2
Start-Process "http://localhost:6201"
