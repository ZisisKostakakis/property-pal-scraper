#!/bin/bash

# PropertyPal Scraper Setup Script

echo "🚀 Setting up PropertyPal Scraper..."
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3 first."
    exit 1
fi

echo "✓ Python 3 found"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        echo "Make sure python3-venv is installed: sudo apt install python3-venv"
        exit 1
    fi
fi

echo "✓ Virtual environment ready"

# Activate virtual environment and install dependencies
echo "📥 Installing dependencies..."
venv/bin/pip install --upgrade pip
venv/bin/pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Quick start:"
echo "  make run        # Run with AI ratings"
echo "  make run-fast   # Run without AI ratings (faster)"
echo ""
echo "📚 For manual usage:"
echo "  source venv/bin/activate"
echo "  scrapy crawl property_spider -a use_perplexity=true"
echo ""
echo "📝 Don't forget to set up your .env file:"
echo "  cp .env.example .env"
echo "  # Edit .env with your API keys and destination"
