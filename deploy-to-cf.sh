#!/bin/bash

# Cloud Foundry Deployment Script for Playwright MCP Server

set -e

echo "🚀 Deploying Playwright MCP Server to Cloud Foundry..."

# Build the application
echo "📦 Building application..."
npm ci --production=false
npm run build

# Create .cfignore file to reduce upload size
cat > .cfignore << EOF
node_modules/
src/
tests/
*.ts
*.map
.git/
.gitignore
README.md
examples/
extension/
utils/
EOF

# Deploy to Cloud Foundry
echo "☁️ Pushing to Cloud Foundry..."
cf push

# Get the application URL
APP_URL=$(cf app playwright-mcp-server | grep -E 'routes:|urls:' | awk '{print $2}')

echo "✅ Deployment complete!"
echo "📡 Server is running at: https://${APP_URL}"
echo "🔗 SSE Endpoint: https://${APP_URL}/sse"
echo ""
echo "📋 Client configuration:"
echo '{
  "mcpServers": {
    "playwright": {
      "url": "https://'${APP_URL}'/sse"
    }
  }
}'