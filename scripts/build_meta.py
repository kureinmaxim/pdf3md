#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
PYPROJECT = PROJECT_ROOT / "pyproject.toml"
OUTPUT = PROJECT_ROOT / "pdf3md" / "build_meta.json"


def _read_pyproject() -> dict:
    data = {}
    try:
        import tomllib
        data = tomllib.loads(PYPROJECT.read_text(encoding="utf-8"))
    except Exception:
        pass
    return data


def _git(cmd: list[str]) -> str | None:
    try:
        return subprocess.check_output(["git", *cmd], text=True).strip()
    except Exception:
        return None


def main() -> int:
    data = _read_pyproject()
    version = data.get("project", {}).get("version", "0.0.0")
    tool = data.get("tool", {}).get("pdf3md", {})
    release_date = tool.get("release_date", "unknown")
    developer = tool.get("developer", "unknown")

    meta = {
        "version": version,
        "release_date": release_date,
        "developer": developer,
        "git_commit": _git(["rev-parse", "--short", "HEAD"]),
        "git_branch": _git(["rev-parse", "--abbrev-ref", "HEAD"]),
        "git_describe": _git(["describe", "--tags", "--always"]),
        "git_dirty": bool(_git(["status", "--porcelain"])),
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }

    OUTPUT.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote build metadata to {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
