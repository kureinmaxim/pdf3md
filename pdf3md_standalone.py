#!/usr/bin/env python3
"""
PDF3MD Standalone Entry Point

This script serves as the entry point for PyInstaller builds.
It starts the Flask server with browser auto-launch.
"""

import os
import sys
import time
import webbrowser
import logging
from threading import Timer

# Setup basic logging before imports
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def open_browser(url, delay=2.0):
    """Open browser after a delay to ensure server is ready.
    
    Args:
        url: URL to open
        delay: Delay in seconds before opening
    """
    def _open():
        logger.info(f"Opening browser at {url}")
        try:
            webbrowser.open(url)
        except Exception as e:
            logger.warning(f"Could not open browser: {e}")
    
    timer = Timer(delay, _open)
    timer.daemon = True
    timer.start()


def main():
    """Main entry point for standalone application."""
    try:
        # Import after path is set up
        from pdf3md.app import app, free_port, logger as app_logger
        
        port = 6201
        url = f"http://localhost:{port}"
        
        # Free port if needed
        free_port(port)
        
        # Schedule browser opening
        open_browser(url, delay=2.0)
        
        app_logger.info(f"Starting PDF3MD server on {url}")
        app_logger.info("Browser will open automatically...")
        
        # Run the Flask app
        app.run(host="0.0.0.0", port=port, debug=False)
        
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
