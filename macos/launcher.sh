#!/bin/bash
set -euo pipefail

APP_NAME="PDF3MD"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_RESOURCES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BIN_DIR="$APP_RESOURCES_DIR/Resources/bin"
TEMPLATE_DIR="$APP_RESOURCES_DIR/Resources/app_template"
APP_SUPPORT_DIR="$HOME/Library/Application Support/$APP_NAME"
LOG_DIR="$APP_SUPPORT_DIR/logs"
PID_DIR="$APP_SUPPORT_DIR/.pids"
WORK_DIR="$APP_SUPPORT_DIR/app"

mkdir -p "$APP_SUPPORT_DIR" "$LOG_DIR" "$PID_DIR"

BACKEND_PID_FILE="$PID_DIR/backend.pid"
SERVER_BIN="$BIN_DIR/pdf3md-server"

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

start_backend() {
  if [ -f "$BACKEND_PID_FILE" ] && ps -p "$(cat "$BACKEND_PID_FILE")" >/dev/null 2>&1; then
    echo "Backend already running."
    return
  fi

  if [ ! -x "$SERVER_BIN" ]; then
    echo "Server binary not found: $SERVER_BIN"
    exit 1
  fi

  echo "Starting backend..."
  PDF3MD_STATIC_DIR="$WORK_DIR" nohup "$SERVER_BIN" > "$LOG_DIR/backend.log" 2>&1 &
  echo $! > "$BACKEND_PID_FILE"
}

update_template
start_backend

sleep 2
open "http://localhost:6201"
