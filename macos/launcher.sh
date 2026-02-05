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

# Run the server (it will auto-launch browser)
echo "Starting PDF3MD..."
export PDF3MD_STATIC_DIR="$WORK_DIR"

# Run server - it handles browser launch internally
"$SERVER_BIN" >> "$LOG_DIR/backend.log" 2>&1
