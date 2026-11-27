$ErrorActionPreference = "Stop"

# Stops the PDF3MD backend. A PID is only stopped after checking that the
# process is alive AND that it is ours (pdf3md app.py / PDF3MD.exe); a stale
# pidfile pointing at an unrelated process is just removed.

$appRoot = (Resolve-Path "$PSScriptRoot\..").Path
$pidDir = Join-Path $appRoot ".pids"
$pidFile = Join-Path $pidDir "backend.pid"
$port = 6201

function Test-OurProcess([int]$ProcessId) {
  $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
  if (-not $proc) { return $false }
  $cmd = "$($proc.CommandLine) $($proc.ExecutablePath)"
  return ($cmd -match 'pdf3md[\\/]app\.py' -or $cmd -match 'run_server\.py' -or $cmd -match 'PDF3MD\.exe')
}

function Stop-OurProcess([int]$ProcessId) {
  Write-Host "Stopping backend (PID $ProcessId)..."
  Stop-Process -Id $ProcessId -ErrorAction SilentlyContinue
  for ($i = 0; $i -lt 20; $i++) {
    if (-not (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) { return }
    Start-Sleep -Milliseconds 250
  }
  if (Test-OurProcess $ProcessId) {
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
  }
}

$stopped = $false

if (Test-Path $pidFile) {
  $backendPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1) -as [int]
  if ($backendPid -and (Test-OurProcess $backendPid)) {
    Stop-OurProcess $backendPid
    $stopped = $true
  } else {
    Write-Host "Removing stale PID file (PID '$backendPid' is not a running PDF3MD process)."
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

if (-not $stopped) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($owner in $listeners) {
    if (Test-OurProcess $owner) {
      Stop-OurProcess $owner
      $stopped = $true
    } else {
      Write-Warning "Port $port is used by another program (PID $owner); not touching it."
    }
  }
}

if (-not $stopped) {
  Write-Host "Backend is not running."
}
