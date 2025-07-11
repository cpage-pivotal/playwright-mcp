#!/bin/bash

# Cloud Foundry startup script - runs before the main application
echo "Installing Playwright browsers..."

# Set environment variables for headless operation
export DISPLAY=:99
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false

# Install only the browser binary (not system deps - those come from apt-buildpack)
npx playwright install chromium

echo "Playwright browser installation complete"

# List what browsers are available for debugging
echo "Available browsers:"
ls -la ~/.cache/ms-playwright/ 2>/dev/null || echo "No browser cache found yet"