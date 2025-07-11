#!/bin/bash

# Cloud Foundry startup script - minimal setup
echo "Setting up environment for Playwright..."

# Set environment variables for headless operation
export DISPLAY=:99
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false

echo "Environment setup complete"