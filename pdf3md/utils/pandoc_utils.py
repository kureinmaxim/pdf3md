"""Pandoc installation and management utilities."""

import os
import sys
import logging
import pypandoc

logger = logging.getLogger(__name__)


def get_pandoc_app_dir():
    """Get platform-specific directory for pandoc storage.

    Returns:
        Path to pandoc application directory
    """
    if sys.platform == "win32":
        local_app_data = os.environ.get(
            "LOCALAPPDATA", os.path.expanduser("~\\AppData\\Local")
        )
        return os.path.join(local_app_data, "PDF3MD", "pandoc")
    elif sys.platform == "darwin":
        return os.path.join(
            os.path.expanduser("~"),
            "Library",
            "Application Support",
            "PDF3MD",
            "pandoc",
        )
    else:
        return os.path.join(
            os.path.expanduser("~"), ".local", "share", "PDF3MD", "pandoc"
        )


def get_pandoc_executable_name():
    """Get platform-specific pandoc executable name.

    Returns:
        Pandoc executable filename
    """
    return "pandoc.exe" if sys.platform == "win32" else "pandoc"


def ensure_pandoc_available():
    """Ensure Pandoc is available for use.

    Checks for Pandoc in the following order:
    1. Existing PYPANDOC_PANDOC environment variable
    2. Bundled Pandoc (PyInstaller)
    3. Platform-specific app data directory
    4. Downloads Pandoc if not found
    """
    if os.environ.get("PDF3MD_SKIP_PANDOC_DOWNLOAD", "0") == "1":
        return

    pandoc_env = os.environ.get("PYPANDOC_PANDOC")
    if pandoc_env and os.path.exists(pandoc_env):
        logger.info(f"Using existing PYPANDOC_PANDOC: {pandoc_env}")
        return

    pandoc_exe = get_pandoc_executable_name()

    # Check for bundled Pandoc (PyInstaller)
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        bundled = os.path.join(sys._MEIPASS, "pandoc", pandoc_exe)
        logger.info(f"Checking for bundled Pandoc at: {bundled}")
        if os.path.exists(bundled):
            if sys.platform != "win32":
                try:
                    os.chmod(bundled, 0o755)
                    logger.info(f"Made bundled Pandoc executable: {bundled}")
                except Exception as e:
                    logger.warning(f"Failed to chmod bundled Pandoc: {e}")

            os.environ["PYPANDOC_PANDOC"] = bundled
            logger.info(f"Set PYPANDOC_PANDOC to bundled binary: {bundled}")
            return
        else:
            logger.warning(f"Bundled Pandoc NOT found at: {bundled}")
            try:
                meipass_contents = os.listdir(sys._MEIPASS)
                logger.info(f"_MEIPASS contents: {meipass_contents[:20]}...")
                pandoc_dir = os.path.join(sys._MEIPASS, "pandoc")
                if os.path.exists(pandoc_dir):
                    logger.info(f"pandoc dir contents: {os.listdir(pandoc_dir)}")
            except Exception as e:
                logger.warning(f"Failed to list _MEIPASS: {e}")

    # Check platform-specific app data directory
    app_support = get_pandoc_app_dir()
    pandoc_path = os.path.join(app_support, pandoc_exe)
    if os.path.exists(pandoc_path):
        logger.info(f"Found Pandoc in app data: {pandoc_path}")
        os.environ["PYPANDOC_PANDOC"] = pandoc_path
        return

    # Try to download pandoc
    try:
        os.makedirs(app_support, exist_ok=True)
        logger.info(f"Attempting to download pandoc to: {app_support}")
        pypandoc.download_pandoc(targetfolder=app_support)
        if os.path.exists(pandoc_path):
            os.environ["PYPANDOC_PANDOC"] = pandoc_path
            logger.info(f"Downloaded and set Pandoc: {pandoc_path}")
    except Exception as e:
        logger.error(f"Failed to download pandoc: {e}")
