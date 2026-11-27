#!/bin/bash
set -euo pipefail

APP_NAME="PDF3MD"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_RESOURCES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BIN_DIR="$APP_RESOURCES_DIR/Resources/bin"
TEMPLATE_DIR="$APP_RESOURCES_DIR/Resources/app_template"
APP_SUPPORT_DIR="$HOME/Library/Application Support/$APP_NAME"
LOG_DIR="$APP_SUPPORT_DIR/logs"
WORK_DIR="$APP_SUPPORT_DIR/app"

mkdir -p "$APP_SUPPORT_DIR" "$LOG_DIR"

SERVER_BIN="$BIN_DIR/pdf3md-server"

# Update frontend template if needed
update_template() {
  if [ ! -d "$TEMPLATE_DIR" ]; then
    return
  fi

  local template_version=""
  local installed_version=""

  if [ -f "$TEMPLATE_DIR/.app_version" ]; then
    template_version="$(cat "$TEMPLATE_DIR/.app_version")"
  fi

  if [ -f "$APP_SUPPORT_DIR/.app_version" ]; then
    installed_version="$(cat "$APP_SUPPORT_DIR/.app_version")"
  fi

  if [ "$template_version" != "$installed_version" ] || [ ! -d "$WORK_DIR" ]; then
    echo "Updating frontend template..."
    rm -rf "$WORK_DIR"
    mkdir -p "$WORK_DIR"
    cp -R "$TEMPLATE_DIR/." "$WORK_DIR/"
    echo "$template_version" > "$APP_SUPPORT_DIR/.app_version"
  fi
}

# Check if server binary exists
if [ ! -x "$SERVER_BIN" ]; then
  echo "Error: Server binary not found at $SERVER_BIN"
  osascript -e 'display dialog "PDF3MD Error: Server binary not found!" buttons {"OK"} default button 1 with icon stop'
  exit 1
fi

# Update frontend files
update_template

PID_DIR="$APP_SUPPORT_DIR/.pids"
PID_FILE="$PID_DIR/backend.pid"
PORT="${PDF3MD_PORT:-6201}"
mkdir -p "$PID_DIR"

# Already running? Then just open the browser instead of starting a second copy.
if [ -f "$PID_FILE" ]; then
  running_pid="$(tr -dc '0-9' < "$PID_FILE")"
  if [ -n "$running_pid" ] && kill -0 "$running_pid" 2>/dev/null \
     && ps -p "$running_pid" -o command= 2>/dev/null | grep -q '/pdf3md-server'; then
    echo "PDF3MD is already running (PID $running_pid)."
    open "http://localhost:$PORT"
    exit 0
  fi
  rm -f "$PID_FILE"   # stale
fi

# Run the server (it opens the browser itself)
echo "Starting PDF3MD..."
export PDF3MD_STATIC_DIR="$WORK_DIR"

"$SERVER_BIN" >> "$LOG_DIR/backend.log" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    kill -TERM "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  # Remove the pidfile only if it still points at our server.
  if [ -f "$PID_FILE" ] && [ "$(tr -dc '0-9' < "$PID_FILE")" = "$SERVER_PID" ]; then
    rm -f "$PID_FILE"
  fi
}
trap cleanup EXIT
trap 'exit 143' TERM INT HUP

wait "$SERVER_PID" || true
