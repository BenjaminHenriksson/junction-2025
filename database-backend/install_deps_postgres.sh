#!/bin/bash
# Install pip for system Python, then install dependencies
# OR use the venv Python instead (recommended)

PROJECT_ROOT="$(dirname "$(dirname "$(readlink -f "$0")")")"
VENV_PYTHON="$PROJECT_ROOT/.venv/bin/python3"

echo "Option 1: Use venv Python (recommended - already has dependencies)"
echo "  Run: sudo -u postgres $VENV_PYTHON populate_products_table.py"
echo ""
echo "Option 2: Install pip for system Python"
echo "  sudo apt-get update && sudo apt-get install -y python3-pip"
echo "  sudo python3 -m pip install psycopg[binary] python-dotenv"
echo ""
echo "Checking if venv Python works..."

if [ -f "$VENV_PYTHON" ]; then
    if sudo -u postgres "$VENV_PYTHON" -c "import psycopg, dotenv" 2>/dev/null; then
        echo "✓ Venv Python has all dependencies!"
        echo "You can run: sudo -u postgres $VENV_PYTHON populate_products_table.py"
    else
        echo "✗ Venv Python missing dependencies"
        echo "Install them: cd $PROJECT_ROOT && source .venv/bin/activate && pip install psycopg[binary] python-dotenv"
    fi
else
    echo "✗ Venv not found at $VENV_PYTHON"
fi
