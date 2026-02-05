"""Configuration and setup for pdf3md Flask application."""

import os
import sys
import logging
import re
from flask import Flask
from flask_cors import CORS

logger = logging.getLogger(__name__)


def get_static_folder():
    """Get the static folder path for Flask.

    Returns:
        Path to static folder containing built frontend
    """
    env_static = os.environ.get("PDF3MD_STATIC_DIR")
    if env_static and os.path.exists(env_static):
        return env_static

    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        base_dir = sys._MEIPASS
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "dist")


def get_log_dir():
    """Get platform-specific log directory.

    Returns:
        Path to log directory
    """
    if sys.platform == "win32":
        local_app_data = os.environ.get(
            "LOCALAPPDATA", os.path.expanduser("~\\AppData\\Local")
        )
        return os.path.join(local_app_data, "PDF3MD", "logs")
    elif sys.platform == "darwin":
        return os.path.join(os.path.expanduser("~"), "Library", "Logs", "PDF3MD")
    else:
        return os.path.join(
            os.path.expanduser("~"), ".local", "share", "PDF3MD", "logs"
        )


def setup_logging():
    """Configure logging for the application.

    Returns:
        Configured logger instance
    """
    log_dir = get_log_dir()
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "server.log")

    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )

    app_logger = logging.getLogger(__name__)
    app_logger.info(f"Logging configured. Log file: {log_file}")
    return app_logger


def get_cors_origins():
    """Get CORS origins from environment and defaults.

    Returns:
        List of allowed CORS origins
    """
    default_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ]

    additional_origins_str = os.environ.get("ALLOWED_CORS_ORIGINS")
    all_allowed_origins = list(default_origins)

    if additional_origins_str:
        custom_origins = [
            origin.strip() for origin in additional_origins_str.split(",")
        ]

        expanded_origins = []
        for origin in custom_origins:
            expanded_origins.append(origin)

            domain_match = re.match(r"(https?://)?(.*)", origin)
            if domain_match:
                protocol = domain_match.group(1) or "http://"
                domain = domain_match.group(2)

                expanded_origins.append(f"{protocol}{domain}:3000")
                expanded_origins.append(f"{protocol}{domain}:5173")
                expanded_origins.append(f"{protocol}{domain}:6201")

        all_allowed_origins.extend(expanded_origins)

    return list(set(all_allowed_origins))


def setup_cors(app):
    """Configure CORS for the Flask application.

    Args:
        app: Flask application instance
    """
    final_origins = get_cors_origins()
    logger.info(f"Initializing CORS with origins: {final_origins}")

    CORS(
        app,
        origins="*",
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=[
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Origin",
            "Accept",
        ],
        supports_credentials=False,
    )

    @app.after_request
    def after_request(response):
        """Add CORS headers to all responses."""
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add(
            "Access-Control-Allow-Headers",
            "Content-Type,Authorization,X-Requested-With,Origin,Accept",
        )
        response.headers.add(
            "Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS"
        )
        response.headers.add("Access-Control-Expose-Headers", "Content-Disposition")
        return response


def create_app():
    """Create and configure the Flask application.

    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__, static_folder=get_static_folder(), static_url_path="")
    setup_cors(app)
    return app
