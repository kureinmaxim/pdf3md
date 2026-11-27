#!/bin/bash
# Stop the PDF3MD backend safely.
#
# A PID is only signalled after checking that it is alive AND that its
# command line belongs to PDF3MD. A stale pidfile (PID reused by another
# program) is removed without touching that process. If the pidfile gives
# nothing, the process listening on the app port is checked the same way.
set -uo pipefail

APP_NAME="PDF3MD"
APP_SUPPORT_DIR="$HOME/Library/Application Support/$APP_NAME"
PID_FILE="$APP_SUPPORT_DIR/.pids/backend.pid"
PORT="${PDF3MD_PORT:-6201}"

# Command lines that identify our server: the bundled binary (onefile
# bootloader and its child) or the Python entry points when run from source.
OURS_REGEX='(/pdf3md-server( |$))|pdf3md_standalone\.py|run_server\.py|pdf3md/app\.py'

is_alive() {
  kill -0 "$1" 2>/dev/null
}

is_ours() {
  local cmd
  cmd="$(ps -p "$1" -o command= 2>/dev/null)" || return 1
  [[ -n "$cmd" && "$cmd" =~ $OURS_REGEX ]]
}

# Children of a PID that are also ours (PyInstaller onefile runs a child).
our_children() {
  local child
  for child in $(pgrep -P "$1" 2>/dev/null); do
    if is_ours "$child"; then
      echo "$child"
    fi
  done
}

stop_pid() {
  local pid="$1" i
  local pids=("$pid")
  local c
  for c in $(our_children "$pid"); do
    pids+=("$c")
  done

  echo "Stopping $APP_NAME backend (PID ${pids[*]})..."
  kill -TERM "${pids[@]}" 2>/dev/null || true
  for i in $(seq 1 20); do
    local alive=0 p
    for p in "${pids[@]}"; do
      if is_alive "$p"; then
        alive=1
      fi
    done
    [ "$alive" -eq 0 ] && return 0
    sleep 0.25
  done

  # Still running after ~5 s: force, but re-check ownership first.
  local p
  for p in "${pids[@]}"; do
    if is_alive "$p" && is_ours "$p"; then
      echo "PID $p did not exit, sending KILL."
      kill -KILL "$p" 2>/dev/null || true
    fi
  done
}

stopped=0

# 1) PID from the pidfile, only if it is really ours.
if [ -f "$PID_FILE" ]; then
  pid="$(tr -dc '0-9' < "$PID_FILE")"
  if [ -n "$pid" ] && is_alive "$pid" && is_ours "$pid"; then
    stop_pid "$pid"
    stopped=1
  else
    echo "Removing stale pidfile (PID '${pid:-?}' is not a running $APP_NAME process)."
  fi
  rm -f "$PID_FILE"
fi

# 2) Fallback: whoever listens on the app port, if it is ours.
if [ "$stopped" -eq 0 ] && command -v lsof >/dev/null 2>&1; then
  for pid in $(lsof -nP -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null); do
    if is_ours "$pid"; then
      # Prefer the top-most PDF3MD process (the onefile bootloader).
      parent="$(ps -p "$pid" -o ppid= 2>/dev/null | tr -d ' ')"
      if [ -n "$parent" ] && [ "$parent" != "1" ] && is_ours "$parent"; then
        pid="$parent"
      fi
      stop_pid "$pid"
      stopped=1
    else
      echo "Port $PORT is used by another program (PID $pid); not touching it."
    fi
  done
fi

if [ "$stopped" -eq 0 ]; then
  echo "$APP_NAME backend is not running."
fi
exit 0
