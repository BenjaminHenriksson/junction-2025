#!/bin/bash
# Script to populate products table as postgres user
# This uses peer authentication (no password needed)
# Uses the project's venv Python which has all dependencies

cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Use venv Python which has all dependencies installed
VENV_PYTHON="$PROJECT_ROOT/.venv/bin/python3"

if [ ! -f "$VENV_PYTHON" ]; then
    echo "ERROR: Virtual environment not found at $VENV_PYTHON"
    echo "Please ensure the venv is set up: cd $PROJECT_ROOT && python3 -m venv .venv"
    exit 1
fi

echo "Using venv Python: $VENV_PYTHON"
echo "Python version: $($VENV_PYTHON --version)"

# Verify required modules
if ! $VENV_PYTHON -c "import psycopg, dotenv" 2>/dev/null; then
    echo "ERROR: Required modules not found in venv"
    echo "Please install: cd $PROJECT_ROOT && source .venv/bin/activate && pip install psycopg[binary] python-dotenv"
    exit 1
fi

cd "$SCRIPT_DIR"
exec $VENV_PYTHON populate_products_table.py
