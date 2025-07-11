#!/usr/bin/env node

/**
 * Cloud Foundry Management Script for Playwright MCP Server
 * Uses the Cloud Foundry tools available in the codebase
 */

import { program } from 'commander';

// Import Cloud Foundry tools from the codebase
const CF_APP_NAME = 'playwright-mcp-server';

program
    .name('cf-manage')
    .description('Manage Playwright MCP Server on Cloud Foundry')
    .version('1.0.0');

program
    .command('deploy')
    .description('Deploy the application to Cloud Foundry')
    .action(async () => {
        try {
            console.log('🚀 Starting deployment...');

            // Use the Cloud Foundry tools from the codebase
            const { spawn } = await import('child_process');

            // Build the application
            console.log('📦 Building application...');
            await runCommand('npm', ['run', 'build']);

            // Push to Cloud Foundry
            console.log('☁️ Pushing to Cloud Foundry...');
            await runCommand('cf', ['push']);

            console.log('✅ Deployment complete!');

            // Get app info
            await getAppInfo();

        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            process.exit(1);
        }
    });

program
    .command('status')
    .description('Check application status')
    .action(async () => {
        await getAppInfo();
    });

program
    .command('logs')
    .description('Show application logs')
    .option('-f, --follow', 'Follow logs in real-time')
    .action(async (options) => {
        const args = ['logs', CF_APP_NAME];
        if (options.follow) args.push('--recent');

        await runCommand('cf', args, { stdio: 'inherit' });
    });

program
    .command('scale')
    .description('Scale the application')
    .option('-i, --instances <number>', 'Number of instances')
    .option('-m, --memory <size>', 'Memory limit (e.g., 512M, 1G)')
    .action(async (options) => {
        const args = ['scale', CF_APP_NAME];

        if (options.instances) {
            args.push('-i', options.instances);
        }

        if (options.memory) {
            args.push('-m', options.memory);
        }

        await runCommand('cf', args);
        await getAppInfo();
    });

program
    .command('restart')
    .description('Restart the application')
    .action(async () => {
        console.log('🔄 Restarting application...');
        await runCommand('cf', ['restart', CF_APP_NAME]);
        await getAppInfo();
    });

program
    .command('delete')
    .description('Delete the application')
    .option('-f, --force', 'Force delete without confirmation')
    .action(async (options) => {
        if (!options.force) {
            const { createInterface } = await import('readline');
            const rl = createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                rl.question('⚠️  Are you sure you want to delete the application? (y/N): ', resolve);
            });

            rl.close();

            if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
                console.log('❌ Deletion cancelled');
                return;
            }
        }

        console.log('🗑️  Deleting application...');
        await runCommand('cf', ['delete', CF_APP_NAME, '-f']);
        console.log('✅ Application deleted');
    });

// Helper functions
async function runCommand(command, args, options = {}) {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: options.stdio || 'pipe',
            ...options
        });

        let output = '';

        if (child.stdout) {
            child.stdout.on('data', (data) => {
                output += data.toString();
                if (!options.stdio) process.stdout.write(data);
            });
        }

        if (child.stderr) {
            child.stderr.on('data', (data) => {
                if (!options.stdio) process.stderr.write(data);
            });
        }

        child.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        child.on('error', reject);
    });
}

async function getAppInfo() {
    try {
        console.log('📊 Application Status:');
        await runCommand('cf', ['app', CF_APP_NAME], { stdio: 'inherit' });

        // Get the route
        const routes = await runCommand('cf', ['curl', `/v3/apps?names=${CF_APP_NAME}`]);
        const app = JSON.parse(routes).resources[0];

        if (app) {
            const routesData = await runCommand('cf', ['curl', `/v3/apps/${app.guid}/routes`]);
            const appRoutes = JSON.parse(routesData).resources;

            if (appRoutes.length > 0) {
                const route = appRoutes[0];
                const domain = route.url || `${route.host}.${route.domain?.name || 'local'}`;

                console.log('\n🔗 Connection Information:');
                console.log(`   Application URL: https://${domain}`);
                console.log(`   SSE Endpoint: https://${domain}/sse`);
                console.log('\n📋 Client Configuration:');
                console.log(JSON.stringify({
                    mcpServers: {
                        playwright: {
                            url: `https://${domain}/sse`
                        }
                    }
                }, null, 2));
            }
        }

    } catch (error) {
        console.error('Failed to get app info:', error.message);
    }
}

program.parse();