"""File utility functions."""

import os
import logging
import tempfile

logger = logging.getLogger(__name__)


def format_file_size(size_bytes):
    """Format file size in bytes to a human-readable string.

    Args:
        size_bytes: File size in bytes

    Returns:
        Formatted string (e.g., "1.5 MB")
    """
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


def cleanup_temp_files(prefix="temp_", suffix=".pdf"):
    """Proactively clean up orphaned temporary files.

    Args:
        prefix: Filename prefix to match
        suffix: Filename suffix to match

    Returns:
        Number of files cleaned up
    """
    temp_dir = tempfile.gettempdir()
    logger.debug(f"Checking for orphaned temp files in: {temp_dir}")
    cleaned_count = 0

    try:
        for filename in os.listdir(temp_dir):
            if filename.startswith(prefix) and filename.endswith(suffix):
                file_path = os.path.join(temp_dir, filename)
                try:
                    os.remove(file_path)
                    logger.info(f"Removed orphaned temp file: {file_path}")
                    cleaned_count += 1
                except Exception as e:
                    logger.debug(f"Could not remove temp file {file_path}: {e}")

        if cleaned_count > 0:
            logger.info(f"Cleaned up {cleaned_count} orphaned temp files.")
    except Exception as e:
        logger.debug(f"Could not clean temp directory: {e}")

    return cleaned_count
