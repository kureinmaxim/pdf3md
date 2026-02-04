"""PDF3MD Flask Application - Main Entry Point."""

import os
import tempfile
import uuid
import time
import signal
import subprocess
from datetime import datetime
from threading import Thread

from flask import request, jsonify, send_file, send_from_directory

from .config import create_app, setup_logging
from .utils import cleanup_temp_files, load_version_meta, get_git_info
from .converters import (
    convert_pdf_with_progress,
    markdown_to_docx,
    convert_docx_to_markdown,
)

# Setup logging
logger = setup_logging()

# Create Flask app
app = create_app()

# Store conversion progress
conversion_progress = {}


@app.route("/convert", methods=["POST"])
def convert():
    """Convert PDF to Markdown."""
    try:
        cleanup_temp_files(prefix="temp_", suffix=".pdf")

        if "pdf" not in request.files:
            logger.error("No file in request")
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["pdf"]
        if file.filename == "":
            logger.error("Empty filename")
            return jsonify({"error": "No file selected"}), 400

        conversion_id = str(uuid.uuid4())

        temp_path = os.path.join(tempfile.gettempdir(), f"temp_{conversion_id}.pdf")
        logger.info(f"Saving file to {temp_path}")
        file.save(temp_path)

        thread = Thread(
            target=convert_pdf_with_progress,
            args=(temp_path, conversion_id, file.filename, conversion_progress),
        )
        thread.start()

        return jsonify(
            {
                "conversion_id": conversion_id,
                "message": "Conversion started",
                "success": True,
            }
        )

    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        import traceback

        logger.error(traceback.format_exc())
        return jsonify({"error": f"Server error: {str(e)}", "success": False}), 500


@app.route("/progress/<conversion_id>", methods=["GET"])
def get_progress(conversion_id):
    """Get conversion progress for a specific conversion ID."""
    try:
        if conversion_id not in conversion_progress:
            return jsonify({"error": "Conversion not found"}), 404

        progress_data = conversion_progress[conversion_id].copy()

        if progress_data.get("status") in ["completed", "error"]:
            temp_path = os.path.join(tempfile.gettempdir(), f"temp_{conversion_id}.pdf")
            if os.path.exists(temp_path):
                os.remove(temp_path)
                logger.info(f"Temp file removed: {temp_path}")

            def cleanup_progress():
                time.sleep(5)
                if conversion_id in conversion_progress:
                    del conversion_progress[conversion_id]

            Thread(target=cleanup_progress).start()

        return jsonify(progress_data)

    except Exception as e:
        logger.error(f"Progress error: {str(e)}")
        return jsonify({"error": f"Progress error: {str(e)}"}), 500


@app.route("/convert-markdown-to-word", methods=["POST"])
def convert_markdown_to_word():
    """Convert markdown text to Word document."""
    try:
        data = request.get_json()

        if not data or "markdown" not in data:
            return jsonify({"error": "No markdown content provided"}), 400

        markdown_text = data["markdown"]
        filename = data.get("filename", "document")

        if not markdown_text.strip():
            return jsonify({"error": "Markdown content is empty"}), 400

        doc_buffer = markdown_to_docx(markdown_text, filename)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        word_filename = f"{filename}_{timestamp}.docx"

        return send_file(
            doc_buffer,
            as_attachment=True,
            download_name=word_filename,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    except Exception as e:
        logger.error(f"Error in markdown to word conversion: {str(e)}")
        import traceback

        logger.error(traceback.format_exc())
        return jsonify({"error": f"Conversion error: {str(e)}"}), 500


@app.route("/version", methods=["GET"])
def get_version_info():
    """Get version and git information."""
    version, release_date, developer = load_version_meta()
    commit, branch, dirty, describe = get_git_info()
    return jsonify(
        {
            "version": version,
            "release_date": release_date,
            "developer": developer,
            "git_commit": commit,
            "git_describe": describe,
            "git_branch": branch,
            "git_dirty": dirty,
            "generated_at": datetime.utcnow().isoformat() + "Z",
        }
    )


@app.route("/convert-word-to-markdown", methods=["POST"])
def convert_word_to_markdown_route():
    """Convert DOCX file to markdown."""
    temp_path = None
    try:
        if "document" not in request.files:
            logger.error("No file in request for Word to Markdown conversion")
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["document"]
        if file.filename == "":
            logger.error("Empty filename for Word to Markdown conversion")
            return jsonify({"error": "No file selected"}), 400

        if not file.filename.endswith(".docx"):
            logger.error(f"Invalid file type: {file.filename}. Expected .docx")
            return jsonify(
                {"error": "Invalid file type. Only .docx files are supported"}
            ), 400

        conversion_id = str(uuid.uuid4())
        temp_filename = f"temp_word_upload_{conversion_id}.docx"
        temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
        logger.info(f"Saving Word file to {temp_path}")
        file.save(temp_path)

        conversion_result = convert_docx_to_markdown(temp_path, file.filename)

        return jsonify(conversion_result)

    except Exception as e:
        logger.error(f"Server error during Word to Markdown conversion: {str(e)}")
        import traceback

        logger.error(traceback.format_exc())
        return jsonify({"error": f"Server error: {str(e)}", "success": False}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                logger.info(f"Removed temporary Word upload file: {temp_path}")
            except Exception as e_clean:
                logger.error(
                    f"Error removing temporary file {temp_path}: {str(e_clean)}"
                )


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Serve the built frontend (Vite) in production."""
    static_folder = app.static_folder
    if static_folder and os.path.exists(static_folder):
        requested_path = os.path.join(static_folder, path)
        if path and os.path.exists(requested_path):
            return send_from_directory(static_folder, path)
        index_path = os.path.join(static_folder, "index.html")
        if os.path.exists(index_path):
            return send_from_directory(static_folder, "index.html")

    return jsonify({"error": "Frontend build not found. Run npm run build."}), 404


def free_port(port, retries=5, delay=0.3):
    """Free a port by terminating processes using it.

    Args:
        port: Port number to free
        retries: Number of retry attempts
        delay: Delay between retries in seconds
    """
    if os.environ.get("PDF3MD_KILL_PORT", "1") != "1":
        return

    try:
        for attempt in range(retries):
            result = subprocess.run(
                ["lsof", "-ti", f":{port}"], capture_output=True, text=True, check=False
            )
            pids = [
                pid.strip()
                for pid in result.stdout.splitlines()
                if pid.strip().isdigit()
            ]
            if not pids:
                return
            for pid in pids:
                try:
                    os.kill(int(pid), signal.SIGTERM)
                    logger.warning(f"Terminated process on port {port}: PID {pid}")
                except Exception as kill_error:
                    logger.warning(
                        f"Failed to terminate PID {pid} on port {port}: {kill_error}"
                    )
            time.sleep(delay)

        result = subprocess.run(
            ["lsof", "-ti", f":{port}"], capture_output=True, text=True, check=False
        )
        pids = [
            pid.strip() for pid in result.stdout.splitlines() if pid.strip().isdigit()
        ]
        for pid in pids:
            try:
                os.kill(int(pid), signal.SIGKILL)
                logger.warning(f"Force killed process on port {port}: PID {pid}")
            except Exception as kill_error:
                logger.warning(
                    f"Failed to force kill PID {pid} on port {port}: {kill_error}"
                )
    except FileNotFoundError:
        logger.warning("lsof not found; cannot auto-release port.")
    except Exception as e:
        logger.warning(f"Failed to free port {port}: {e}")


# Main execution moved to run_server.py
# if __name__ == "__main__":
#     free_port(6201)
#     logger.info("Starting Flask server...")
#     app.run(host="0.0.0.0", port=6201)
