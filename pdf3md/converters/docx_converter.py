"""DOCX conversion utilities."""

import os
import logging
import tempfile
import uuid
from datetime import datetime
from io import BytesIO
import pypandoc

from ..utils import ensure_pandoc_available, format_file_size
from ..formatters import apply_docx_formatting

logger = logging.getLogger(__name__)


def markdown_to_docx(markdown_text, filename="document"):
    """Convert markdown text to a Word document using Pandoc.

    Args:
        markdown_text: Markdown text to convert
        filename: Base filename for logging

    Returns:
        BytesIO buffer containing DOCX data
    """
    temp_docx_path = None
    try:
        ensure_pandoc_available()

        temp_docx_filename = f"temp_pandoc_output_{uuid.uuid4()}.docx"
        temp_docx_path = os.path.join(tempfile.gettempdir(), temp_docx_filename)

        logger.debug(f"Converting markdown to docx for: {filename}")

        pypandoc.convert_text(
            markdown_text, "docx", format="md", outputfile=temp_docx_path
        )

        try:
            apply_docx_formatting(temp_docx_path)
        except Exception as format_error:
            logger.warning(f"Post-processing DOCX formatting failed: {format_error}")

        with open(temp_docx_path, "rb") as f:
            output_docx_bytes = f.read()

        doc_buffer = BytesIO(output_docx_bytes)
        doc_buffer.seek(0)

        logger.info(f"Successfully converted markdown to docx for {filename}")
        return doc_buffer

    except FileNotFoundError:
        logger.error(
            "Pandoc not found. Please ensure Pandoc is installed and in your PATH."
        )
        raise RuntimeError("Pandoc not found. Conversion failed.")
    except Exception as e:
        logger.error(f"Error converting markdown to docx using Pandoc: {str(e)}")
        raise e
    finally:
        if temp_docx_path and os.path.exists(temp_docx_path):
            try:
                os.remove(temp_docx_path)
                logger.debug(f"Removed temporary pandoc output file: {temp_docx_path}")
            except Exception as e_clean:
                logger.error(
                    f"Error removing temporary file {temp_docx_path}: {str(e_clean)}"
                )


def convert_docx_to_markdown(docx_path, original_filename):
    """Convert DOCX file to markdown text using Pandoc.

    Args:
        docx_path: Path to DOCX file
        original_filename: Original filename for logging

    Returns:
        Dictionary with conversion results
    """
    try:
        ensure_pandoc_available()
        logger.debug(f"Converting DOCX to markdown for: {original_filename}")

        markdown_output = pypandoc.convert_file(
            docx_path, "markdown_strict", format="docx"
        )

        logger.info(f"Successfully converted DOCX to markdown for {original_filename}")

        file_size = os.path.getsize(docx_path)

        result = {
            "markdown": markdown_output,
            "filename": original_filename,
            "fileSize": format_file_size(file_size),
            "pageCount": None,
            "timestamp": datetime.now().isoformat(),
            "success": True,
        }
        return result

    except FileNotFoundError:
        logger.error(
            "Pandoc not found. Please ensure Pandoc is installed and in your PATH."
        )
        raise RuntimeError("Pandoc not found. DOCX to Markdown conversion failed.")
    except Exception as e:
        logger.error(f"Error converting DOCX to markdown using Pandoc: {str(e)}")
        raise e
