#!/bin/bash
set -euo pipefail

APP_NAME="PDF3MD"
APP_SUPPORT_DIR="$HOME/Library/Application Support/$APP_NAME"
PID_DIR="$APP_SUPPORT_DIR/.pids"

BACKEND_PID_FILE="$PID_DIR/backend.pid"

stop_pid() {
  local pid_file="$1"
  local name="$2"

  if [ ! -f "$pid_file" ]; then
    echo "$name is not running."
    return
  fi

  local pid
  pid="$(cat "$pid_file")"
  if [ -n "$pid" ] && ps -p "$pid" >/dev/null 2>&1; then
    echo "Stopping $name..."
    kill "$pid"
    sleep 2
    if ps -p "$pid" >/dev/null 2>&1; then
      kill -9 "$pid"
    fi
  fi

  rm -f "$pid_file"
}

stop_pid "$BACKEND_PID_FILE" "Backend"
