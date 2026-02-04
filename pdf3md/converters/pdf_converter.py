"""PDF to Markdown conversion."""

import os
import sys
import re
import time
import logging
from datetime import datetime
import pymupdf
import pymupdf4llm

from ..utils import format_file_size

logger = logging.getLogger(__name__)


class ProgressCapture:
    """Capture progress output from pymupdf4llm."""

    def __init__(self, conversion_id, total_pages, progress_dict):
        """Initialize progress capture.

        Args:
            conversion_id: Unique ID for this conversion
            total_pages: Total number of pages in PDF
            progress_dict: Shared dictionary to store progress
        """
        self.conversion_id = conversion_id
        self.total_pages = total_pages
        self.progress_dict = progress_dict
        self.original_stdout = sys.stdout
        self.original_stderr = sys.stderr

    def __enter__(self):
        sys.stdout = self
        sys.stderr = self
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout = self.original_stdout
        sys.stderr = self.original_stderr

    def write(self, text):
        """Write output and parse progress."""
        self.original_stdout.write(text)
        self.original_stdout.flush()

        if self.conversion_id in self.progress_dict:
            progress_match = re.search(r"\(\s*(\d+)/(\d+)\)", text)
            if progress_match:
                current_page = int(progress_match.group(1))
                total_pages = int(progress_match.group(2))

                progress_percent = int((current_page / total_pages) * 85) + 10

                self.progress_dict[self.conversion_id].update(
                    {
                        "progress": progress_percent,
                        "stage": f"Processing page {current_page} of {total_pages}...",
                        "current_page": current_page,
                        "total_pages": total_pages,
                    }
                )

    def flush(self):
        """Flush output."""
        self.original_stdout.flush()


def convert_pdf_with_progress(temp_path, conversion_id, filename, progress_dict):
    """Convert PDF with real progress tracking.

    Args:
        temp_path: Path to temporary PDF file
        conversion_id: Unique conversion ID
        filename: Original filename
        progress_dict: Shared dictionary for progress tracking

    Returns:
        None (updates progress_dict with results)
    """
    try:
        doc = pymupdf.open(temp_path)
        total_pages = len(doc)
        file_size = os.path.getsize(temp_path)
        doc.close()

        progress_dict[conversion_id] = {
            "progress": 0,
            "stage": "Starting conversion...",
            "total_pages": total_pages,
            "current_page": 0,
            "filename": filename,
            "file_size": file_size,
            "status": "processing",
        }

        logger.info(f"Starting PDF conversion for {filename}")

        progress_dict[conversion_id].update(
            {"progress": 5, "stage": "Initializing conversion..."}
        )

        with ProgressCapture(conversion_id, total_pages, progress_dict):
            markdown = pymupdf4llm.to_markdown(temp_path)

        progress_dict[conversion_id].update(
            {"progress": 95, "stage": "Finalizing conversion..."}
        )

        time.sleep(0.5)

        result = {
            "markdown": markdown,
            "filename": filename,
            "fileSize": format_file_size(file_size),
            "pageCount": total_pages,
            "timestamp": datetime.now().isoformat(),
            "success": True,
        }

        progress_dict[conversion_id].update(
            {
                "progress": 100,
                "stage": "Conversion complete!",
                "status": "completed",
                "result": result,
            }
        )

        logger.info("Conversion successful")

    except Exception as e:
        logger.error(f"Conversion error: {str(e)}")
        import traceback

        logger.error(traceback.format_exc())
        progress_dict[conversion_id] = {
            "progress": 0,
            "stage": f"Error: {str(e)}",
            "status": "error",
            "error": str(e),
        }
