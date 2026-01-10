# PropertyPal Scraper Makefile

.PHONY: help install run run-fast clean clean-data clean-all venv-check

# Virtual environment paths
VENV_BIN = venv/bin
PYTHON = $(VENV_BIN)/python
PIP = $(VENV_BIN)/pip
SCRAPY = $(VENV_BIN)/scrapy

# Default target
help:
	@echo "PropertyPal Scraper - Quick Start Guide"
	@echo "======================================"
	@echo ""
	@echo "First time setup:"
	@echo "  make install       # Creates venv and installs dependencies"
	@echo "  make test-geocoding # Test geocoding functionality"
	@echo ""
	@echo "Usage:"
	@echo "  make run           # Run scraper with AI ratings (default)"
	@echo "  make run-fast      # Run scraper without AI ratings (faster)"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean      # Clean Python cache files"
	@echo "  make clean-data # Clean all scraped data"
	@echo "  make clean-all  # Clean everything"
	@echo ""
	@echo "Note: After 'make install', always activate venv before manual commands:"
	@echo "  source venv/bin/activate"

# Check if required commands are available
check-deps:
	@if ! command -v scrapy >/dev/null 2>&1; then \
		echo "❌ Error: Scrapy not found in PATH."; \
		echo "Make sure to activate the virtual environment:"; \
		echo "  source venv/bin/activate"; \
		echo ""; \
		echo "If venv doesn't exist, create it first:"; \
		echo "  python3 -m venv venv"; \
		echo "  source venv/bin/activate"; \
		echo "  pip install -r requirements.txt"; \
		exit 1; \
	fi
	@if ! command -v python >/dev/null 2>&1 || ! python -c "import scrapy" 2>/dev/null; then \
		echo "❌ Error: Scrapy Python package not installed."; \
		echo "Install dependencies:"; \
		echo "  source venv/bin/activate"; \
		echo "  pip install -r requirements.txt"; \
		exit 1; \
	fi
	@echo "✓ All dependencies found"

# Install dependencies
install:
	@if [ ! -d "venv" ]; then \
		echo "Creating virtual environment..."; \
		python3 -m venv venv || { echo "❌ Failed to create virtual environment. Make sure python3-venv is installed."; exit 1; }; \
	fi
	@echo "Installing dependencies in virtual environment..."
	@venv/bin/pip install --upgrade pip
	@venv/bin/pip install -r requirements.txt
	@echo "✓ Dependencies installed successfully!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Activate the virtual environment: source venv/bin/activate"
	@echo "  2. Run the scraper: make run or make run-fast"

# Run scraper with perplexity rating enabled (default)
run: check-deps
	scrapy crawl property_spider -a use_perplexity=true

# Run scraper without perplexity rating (faster)
run-fast: check-deps
	scrapy crawl property_spider -a use_perplexity=false

# Test geocoding functionality
test-geocoding: check-deps
	@echo "Testing geocoding functionality..."
	python test_geocoding.py

# Clean Python cache files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete

# Clean all scraped data
clean-data:
	rm -rf data/raw/*
	rm -rf data/processed/*
	rm -rf data/ratings/*

# Clean everything
clean-all: clean clean-data
