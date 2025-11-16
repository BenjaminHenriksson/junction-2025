#!/bin/bash
cd "$(dirname "$0")"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV_PYTHON="$PROJECT_ROOT/.venv/bin/python3"

# Use venv Python if available, otherwise system Python
if [ -f "$VENV_PYTHON" ]; then
    "$VENV_PYTHON" -m uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
else
    python3 -m uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
fi
