#!/usr/bin/env python3
"""Run the PDF3MD Flask application."""

if __name__ == "__main__":
    from pdf3md.app import app, logger, free_port

    free_port(6201)
    logger.info("Starting Flask server...")
    app.run(host="0.0.0.0", port=6201)
