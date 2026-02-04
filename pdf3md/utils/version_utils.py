"""Version and git metadata utilities."""

import os
import sys
import json
import subprocess
import tomllib
import logging

logger = logging.getLogger(__name__)


def load_version_meta():
    """Load version metadata from various sources.

    Checks in order:
    1. build_meta.json (in PyInstaller bundle or source)
    2. version.json (in PyInstaller bundle or source)
    3. pyproject.toml (source only)

    Returns:
        Tuple of (version, release_date, developer)
    """
    version = "0.0.0"
    release_date = "unknown"
    developer = "unknown"

    # Determine if running from PyInstaller bundle
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        # Running from PyInstaller bundle
        bundle_dir = sys._MEIPASS
        
        # Try build_meta.json in bundle
        build_meta = os.path.join(bundle_dir, "build_meta.json")
        if os.path.exists(build_meta):
            try:
                with open(build_meta, "r", encoding="utf-8") as f:
                    payload = json.load(f)
                version = payload.get("version", version)
                release_date = payload.get("release_date", release_date)
                developer = payload.get("developer", developer)
                return version, release_date, developer
            except Exception:
                pass

        # Try version.json in bundle
        version_json = os.path.join(bundle_dir, "version.json")
        if os.path.exists(version_json):
            try:
                with open(version_json, "r", encoding="utf-8") as f:
                    payload = json.load(f)
                version = payload.get("version", version)
                release_date = payload.get("release_date", release_date)
                developer = payload.get("developer", developer)
                return version, release_date, developer
            except Exception:
                pass
    else:
        # Running from source - try files relative to project root
        
        # Try build_meta.json
        build_meta = os.path.join(os.path.dirname(__file__), "..", "build_meta.json")
        if os.path.exists(build_meta):
            try:
                with open(build_meta, "r", encoding="utf-8") as f:
                    payload = json.load(f)
                version = payload.get("version", version)
                release_date = payload.get("release_date", release_date)
                developer = payload.get("developer", developer)
                return version, release_date, developer
            except Exception:
                pass

        # Try version.json
        version_json = os.path.join(os.path.dirname(__file__), "..", "version.json")
        if os.path.exists(version_json):
            try:
                with open(version_json, "r", encoding="utf-8") as f:
                    payload = json.load(f)
                version = payload.get("version", version)
                release_date = payload.get("release_date", release_date)
                developer = payload.get("developer", developer)
                return version, release_date, developer
            except Exception:
                pass

        # Try pyproject.toml (source only)
        project_root = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..")
        )
        pyproject_path = os.path.join(project_root, "pyproject.toml")
        if os.path.exists(pyproject_path):
            try:
                with open(pyproject_path, "rb") as f:
                    data = tomllib.load(f)
                version = data.get("project", {}).get("version", version)
                tool = data.get("tool", {}).get("pdf3md", {})
                release_date = tool.get("release_date", release_date)
                developer = tool.get("developer", developer)
                return version, release_date, developer
            except Exception:
                pass

    return version, release_date, developer


def get_git_info():
    """Get git repository information.

    Returns:
        Tuple of (commit, branch, dirty, describe)
    """
    try:
        commit = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], text=True
        ).strip()
        branch = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"], text=True
        ).strip()
        dirty = (
            subprocess.check_output(["git", "status", "--porcelain"], text=True).strip()
            != ""
        )
        describe = subprocess.check_output(
            ["git", "describe", "--tags", "--always"], text=True
        ).strip()
        return commit, branch, dirty, describe
    except Exception:
        return None, None, None, None
