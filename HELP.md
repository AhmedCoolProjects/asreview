# Development Guide

Follow these steps to run ASReview LAB in development mode.
You will need 3 separate terminal tabs.

## 1. Task Manager

The task manager handles background processes.

```bash
.venv/bin/asreview task-manager
```

## 2. Backend Server

Runs the Python Flask server on port 5000.
We disable authentication for easier development.

```bash
ASREVIEW_LAB_AUTHENTICATION=false ASREVIEW_LAB_SECRET_KEY=devkey .venv/bin/asreview lab
```

## 3. Frontend (React)

Runs the React development server on port 3000.
This server proxies API requests to the backend (port 5000).

```bash
cd asreview/webapp
npm start
```

## Accessing the App

Open your browser and navigate to:
**http://localhost:3000**
