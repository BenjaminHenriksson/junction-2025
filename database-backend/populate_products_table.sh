#!/bin/bash
# Wrapper script to run populate_products_table.py with the correct Python

cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Try to use venv Python if it exists
if [ -f "$PROJECT_ROOT/.venv/bin/python" ]; then
    PYTHON="$PROJECT_ROOT/.venv/bin/python"
elif [ -f "$PROJECT_ROOT/.venv/bin/python3" ]; then
    PYTHON="$PROJECT_ROOT/.venv/bin/python3"
elif command -v python3 &> /dev/null; then
    PYTHON="python3"
elif command -v python &> /dev/null; then
    PYTHON="python"
else
    echo "Error: Python not found. Please install Python 3."
    exit 1
fi

echo "Using Python: $PYTHON"
echo "Python version: $($PYTHON --version)"

# Check if running as postgres user or with sudo
if [ "$EUID" -eq 0 ] || [ "$USER" = "postgres" ]; then
    echo "Running as postgres user or root..."
    # Use system Python when running as postgres
    if command -v python3 &> /dev/null; then
        PYTHON="python3"
    fi
fi

cd "$SCRIPT_DIR"
exec "$PYTHON" populate_products_table.py
