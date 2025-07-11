/**
 * Health check middleware for Cloud Foundry deployment
 * This adds a simple health endpoint to the existing HTTP server
 */

export function addHealthCheck(httpServer) {
    const originalEmit = httpServer.emit;

    httpServer.emit = function(type, req, res, ...args) {
        if (type === 'request' && req && res) {
            const url = new URL(`http://localhost${req.url}`);

            // Health check endpoint
            if (url.pathname === '/health' || url.pathname === '/') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    service: 'playwright-mcp-server',
                    version: process.env.npm_package_version || '1.0.0'
                }));
                return;
            }
        }

        return originalEmit.call(this, type, req, res, ...args);
    };
}