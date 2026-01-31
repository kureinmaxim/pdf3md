#!/usr/bin/env python3
"""
PDF3MD version management.

Usage:
    python scripts/update_version.py status
    python scripts/update_version.py sync [VERSION]
    python scripts/update_version.py bump patch|minor|major
    python scripts/update_version.py release [VERSION]
"""
from __future__ import annotations

import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Final


PROJECT_ROOT: Final = Path(__file__).parent.parent
PYPROJECT_PATH: Final = PROJECT_ROOT / "pyproject.toml"
VERSION_JSON_PATH: Final = PROJECT_ROOT / "pdf3md" / "version.json"
INNO_PATH: Final = PROJECT_ROOT / "windows" / "installer.iss"


@dataclass
class Version:
    major: int
    minor: int
    patch: int

    def __str__(self) -> str:
        return f"{self.major}.{self.minor}.{self.patch}"

    @classmethod
    def parse(cls, value: str) -> Version:
        match = re.match(r"^(\d+)\.(\d+)\.(\d+)$", value.strip())
        if not match:
            raise ValueError(f"Invalid version format: {value}")
        return cls(int(match.group(1)), int(match.group(2)), int(match.group(3)))

    def bump_patch(self) -> Version:
        return Version(self.major, self.minor, self.patch + 1)

    def bump_minor(self) -> Version:
        return Version(self.major, self.minor + 1, 0)

    def bump_major(self) -> Version:
        return Version(self.major + 1, 0, 0)


def _read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None


def _write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def _current_version() -> str | None:
    content = _read_text(PYPROJECT_PATH)
    if not content:
        return None
    match = re.search(r'^version\s*=\s*"(\d+\.\d+\.\d+)"', content, re.MULTILINE)
    return match.group(1) if match else None


def _update_pyproject(version: str) -> None:
    content = _read_text(PYPROJECT_PATH)
    if content is None:
        raise RuntimeError("pyproject.toml not found")

    content = re.sub(
        r'^version\s*=\s*"\d+\.\d+\.\d+"',
        f'version = "{version}"',
        content,
        count=1,
        flags=re.MULTILINE,
    )
    today = datetime.now().strftime("%Y-%m-%d")
    content = re.sub(
        r'^release_date\s*=\s*"\d{4}-\d{2}-\d{2}"',
        f'release_date = "{today}"',
        content,
        count=1,
        flags=re.MULTILINE,
    )
    _write_text(PYPROJECT_PATH, content)


def _update_version_json(version: str) -> None:
    content = _read_text(VERSION_JSON_PATH)
    if content is None:
        raise RuntimeError("pdf3md/version.json not found")
    today = datetime.now().strftime("%Y-%m-%d")
    content = re.sub(r'"version"\s*:\s*"\d+\.\d+\.\d+"', f'"version": "{version}"', content)
    content = re.sub(r'"release_date"\s*:\s*"\d{4}-\d{2}-\d{2}"', f'"release_date": "{today}"', content)
    _write_text(VERSION_JSON_PATH, content)


def _update_inno(version: str) -> None:
    content = _read_text(INNO_PATH)
    if content is None:
        return
    content = re.sub(
        r'^#define\s+AppVersion\s+".*"$',
        f'#define AppVersion "{version}"',
        content,
        count=1,
        flags=re.MULTILINE,
    )
    _write_text(INNO_PATH, content)


def _run_git(args: list[str]) -> bool:
    try:
        subprocess.run(["git", *args], check=True)
        return True
    except Exception:
        return False


def cmd_status() -> int:
    version = _current_version()
    if not version:
        print("Version not found.")
        return 1
    print(f"Current version: {version}")
    return 0


def cmd_sync(version: str | None = None) -> int:
    if version is None:
        version = _current_version()
        if not version:
            print("Version not found in pyproject.toml.")
            return 1
    else:
        Version.parse(version)

    _update_pyproject(version)
    _update_version_json(version)
    _update_inno(version)
    print(f"Synced version {version}")
    return 0


def cmd_bump(kind: str) -> int:
    current = _current_version()
    if not current:
        print("Version not found in pyproject.toml.")
        return 1
    parsed = Version.parse(current)
    if kind == "patch":
        return cmd_sync(str(parsed.bump_patch()))
    if kind == "minor":
        return cmd_sync(str(parsed.bump_minor()))
    if kind == "major":
        return cmd_sync(str(parsed.bump_major()))
    print("Unknown bump type. Use patch/minor/major.")
    return 1


def cmd_release(version: str | None = None) -> int:
    if cmd_sync(version) != 0:
        return 1
    if not _run_git(["add", "."]):
        print("git add failed")
        return 1
    release_version = version or _current_version() or "unknown"
    if not _run_git(["commit", "-m", f"chore: release {release_version}"]):
        print("git commit failed")
        return 1
    if not _run_git(["push"]):
        print("git push failed")
        return 1
    print(f"Released {release_version}")
    return 0


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/update_version.py <status|sync|bump|release>")
        return 1
    command = sys.argv[1].lower()
    if command == "status":
        return cmd_status()
    if command == "sync":
        version = sys.argv[2] if len(sys.argv) > 2 else None
        return cmd_sync(version)
    if command == "bump":
        if len(sys.argv) < 3:
            print("Specify bump type: patch|minor|major")
            return 1
        return cmd_bump(sys.argv[2].lower())
    if command == "release":
        version = sys.argv[2] if len(sys.argv) > 2 else None
        return cmd_release(version)
    print("Unknown command.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
