# Quick Start Guide

Get PDF3MD running in under 2 minutes!

## Option 1: Using Pre-built Docker Images (Recommended)

**Prerequisites**: Docker installed on your system.

1.  **Prepare Required Files**:
    *   Create a directory for your application (e.g., `mkdir pdf3md-app && cd pdf3md-app`).
    *   **`docker-compose.yml`**: Create a file named `docker-compose.yml` in this directory and paste the following content into it:
        ```yaml
        services:
          backend:
            image: docker.io/learnedmachine/pdf3md-backend:latest 
            container_name: pdf3md-backend
            ports:
              - "6201:6201"
            environment:
              - PYTHONUNBUFFERED=1
              - FLASK_ENV=production
            volumes:
              - ./pdf3md/temp:/app/temp # Creates a local temp folder
            restart: unless-stopped
            healthcheck:
              test: ["CMD", "curl", "-f", "http://localhost:6201/"]
              interval: 30s
              timeout: 10s
              retries: 3
              start_period: 40s

          frontend:
            image: docker.io/learnedmachine/pdf3md-frontend:latest 
            container_name: pdf3md-frontend
            ports:
              - "3000:3000"
            depends_on:
              - backend
            restart: unless-stopped
            healthcheck:
              test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
              interval: 30s
              timeout: 10s
              retries: 3
              start_period: 40s

        networks:
          default:
            name: pdf3md-network
        ```
    *   **`docker-start.sh`**: Download the `docker-start.sh` script from your fork: `https://github.com/kureinmaxim/pdf3md/blob/main/docker-start.sh` and place it in the same directory.
    *   Make the script executable: `chmod +x ./docker-start.sh`

2.  **Start the Application**:
    In the directory where you placed `docker-compose.yml` and `docker-start.sh`, run:
    ```bash
    ./docker-start.sh start
    ```
    This will pull the latest images from Docker Hub and start the application.

    You can also specify a custom domain or IP address:
    ```bash
    ./docker-start.sh start example.com
    ```
    This is useful when accessing the application from other devices on your network.

3.  **Open in browser**:
    ```
    # With default settings:
    # Frontend: http://localhost:3000
    # Backend: http://localhost:6201
    
    # With custom domain:
    # Frontend: http://example.com:3000
    # Backend: http://example.com:6201
    ```

**That's it!**

### Development Mode (Using Local Source Code)
This mode is for making code changes and requires cloning the full repository.
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/kureinmaxim/pdf3md.git
    cd pdf3md
    ```
    The `docker-compose.dev.yml` file will be included in the clone.
2.  **Start in Development Mode**:
    ```bash
    ./docker-start.sh dev
    ```
    This typically uses `docker-compose.dev.yml` to build images locally and mount your source code for hot-reloading.
    
    You can also specify a custom domain or IP address for development:
    ```bash
    ./docker-start.sh dev 192.168.1.100
    ```
    
    ```
    # With default settings:
    # Frontend with hot-reload: http://localhost:5173
    # Backend: http://localhost:6201
    
    # With custom domain/IP:
    # Frontend: http://192.168.1.100:5173
    # Backend: http://192.168.1.100:6201
    ```

### Useful Commands (with `docker-start.sh`)
```bash
./docker-start.sh status                # Check what's running
./docker-start.sh stop                  # Stop everything
./docker-start.sh logs                  # View logs
./docker-start.sh rebuild dev example.com  # Rebuild development with custom domain
./docker-start.sh help                  # See all options
```

## Option 2: Manual Setup (Running without Docker)

This is for running the frontend and backend services directly on your machine without Docker, primarily for development.

**Prerequisites**: Python 3.13+, Node.js 18+, Pandoc, and Git.
Repo layout: backend at `pdf3md/app.py`, frontend in `pdf3md/`.

1.  **Clone the Repository**:
    First, clone the repository to get the source code:
    ```bash
    git clone https://github.com/kureinmaxim/pdf3md.git
    cd /Users/olgazaharova/Project/pdf3md  # macOS/Linux
    # Windows: cd C:\Project\pdf3md
    ```

2.  **Set up Backend (Terminal 1)**:
    Create a virtual environment and install dependencies:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python3 pdf3md/app.py
    ```

3.  **Set up Frontend (Terminal 2)**:
    In a new terminal:
    ```bash
    cd /Users/olgazaharova/Project/pdf3md/pdf3md  # macOS/Linux
    # Windows: cd C:\Project\pdf3md\pdf3md
    npm install
    npm run dev
    ```

4.  **Open Browser**:
    *   Dev Frontend: `http://localhost:5173`
    *   Backend API: `http://localhost:6201`

### Production (No Dev Server)
If you want to run production mode locally:

```bash
cd /Users/olgazaharova/Project/pdf3md  # macOS/Linux
# Windows: cd C:\Project\pdf3md
npm install
npm run build
```

Then keep the backend running and open: `http://localhost:6201`

## Option 3: macOS App (DMG)

If you want a native macOS app that runs without a preinstalled Python/Node:

```bash
cd /Users/olgazaharova/Project/pdf3md  # macOS/Linux
# Windows: cd C:\Project\pdf3md
./macos/build_dmg.sh
```

Open the DMG and drag `PDF3MD.app` to Applications.  
Launch the app to open `http://localhost:6201`.

> Note: Pandoc is still required for Markdown → DOCX conversion.

## Option 4: Windows Installer (Inno Setup)

If you want a Windows installer, use Inno Setup with `windows/installer.iss` and set the default install path to:
`C:\Project\pdf3md`.
```

## Using the App

1. **Open** http://localhost:3000 (or http://localhost:5173 for development mode).
2. For **PDF to Markdown**:
    - **Drag & drop** one or more PDF files or click to upload.
    - **Watch** the conversion progress.
    - **Copy** the generated Markdown text.
3. For **Markdown to Word**:
    - Switch to "MD → Word" mode in the application.
    - Paste or type your Markdown content.
    - Click "Download as Word" to get the DOCX file.

## Need Help?

- Check the full [README.md](README.md) for detailed instructions
- View logs: `./docker-start.sh logs`
- Stop everything: `./docker-start.sh stop`

**Happy converting!**
