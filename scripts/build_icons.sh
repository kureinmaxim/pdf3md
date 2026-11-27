#!/bin/bash
# Regenerate all PDF3MD icons from assets/icon/*.svg (see build_icons.py).
set -euo pipefail
exec python3 "$(cd "$(dirname "$0")" && pwd)/build_icons.py" "$@"
