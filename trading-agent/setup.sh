#!/bin/bash
# Trading Agent Setup Script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "Setting up Trading Agent Backend..."

# Create virtual environment
cd "$BACKEND_DIR"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Create data directories
echo "Creating data directories..."
mkdir -p data/cache
mkdir -p data/state

# Copy .env.example if .env doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Created .env from .env.example - please fill in your ANTHROPIC_API_KEY"
fi

echo ""
echo "Setup complete!"
echo "To start the server:"
echo "  cd $BACKEND_DIR"
echo "  source venv/bin/activate"
echo "  python main.py"
