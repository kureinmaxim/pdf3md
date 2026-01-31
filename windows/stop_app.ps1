$ErrorActionPreference = "Stop"

$appRoot = (Resolve-Path "$PSScriptRoot\..").Path
$pidDir = Join-Path $appRoot ".pids"
$pidFile = Join-Path $pidDir "backend.pid"

function Stop-BackendByPid {
  if (Test-Path $pidFile) {
    $pid = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
      Stop-Process -Id $pid -Force
      Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
      Write-Host "Backend stopped."
      return $true
    }
  }
  return $false
}

if (-not (Stop-BackendByPid)) {
  $processes = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -match "pdf3md\\app.py"
  }
  foreach ($proc in $processes) {
    try {
      Stop-Process -Id $proc.ProcessId -Force
    } catch {
      Write-Warning "Failed to stop PID $($proc.ProcessId)"
    }
  }
}
