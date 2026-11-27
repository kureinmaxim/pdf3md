$ErrorActionPreference = "Stop"

$appRoot = (Resolve-Path "$PSScriptRoot\..").Path
$venvDir = Join-Path $appRoot "venv"
$pythonExe = Join-Path $venvDir "Scripts\python.exe"
$pidDir = Join-Path $appRoot ".pids"
$pidFile = Join-Path $pidDir "backend.pid"
$backendScript = Join-Path $appRoot "run_server.py"
$logDir = Join-Path $appRoot "logs"

if (-not (Test-Path $pythonExe)) {
  throw "Python venv not found. Run setup first."
}

New-Item -ItemType Directory -Force -Path $pidDir | Out-Null

if (Test-Path $pidFile) {
  $existingPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1) -as [int]
  $existingProc = if ($existingPid) { Get-CimInstance Win32_Process -Filter "ProcessId = $existingPid" -ErrorAction SilentlyContinue }
  if ($existingProc -and ("$($existingProc.CommandLine)" -match 'run_server\.py|pdf3md[\\/]app\.py')) {
    Write-Host "Backend already running (PID $existingPid)."
    Start-Process "http://localhost:6201"
    exit 0
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue  # stale
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stdoutLog = Join-Path $logDir "backend.log"
$stderrLog = Join-Path $logDir "backend.err.log"

Write-Host "Starting backend..."
$process = Start-Process -FilePath $pythonExe `
  -ArgumentList "`"$backendScript`"" `
  -WorkingDirectory $appRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -PassThru

$process.Id | Set-Content $pidFile

for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  if ($process.HasExited) {
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    throw "Backend exited with code $($process.ExitCode). See $stderrLog"
  }
  if (Get-NetTCPConnection -LocalPort 6201 -State Listen -ErrorAction SilentlyContinue) { break }
}

Start-Process "http://localhost:6201"
