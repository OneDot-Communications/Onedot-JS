#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function runCLI() {
  // Try to run the CLI from the built version first
  const builtPath = path.join(__dirname, '..', 'dist', 'cli', 'src', 'runner.js');

  if (fs.existsSync(builtPath)) {
    try {
      require(builtPath);
      return;
    } catch (e) {
      console.warn('Built version failed, falling back to source:', e.message);
    }
  }

  // If built version doesn't exist or fails, run from source
  const cliPath = path.join(__dirname, '..', 'packages', 'cli', 'src', 'runner.ts');

  if (!fs.existsSync(cliPath)) {
    console.error('CLI source not found at:', cliPath);
    process.exit(1);
  }

  try {
    // Check if ts-node is available
    execSync('npx ts-node --version', { stdio: 'pipe' });

    // Run with ts-node
    execSync(`npx ts-node ${cliPath} ${process.argv.slice(2).join(' ')}`, {
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
  } catch (e) {
    console.error('Failed to run CLI with ts-node:', e.message);

    // Try to install ts-node and run again
    try {
      console.log('Installing ts-node...');
      execSync('npm install -g ts-node', { stdio: 'inherit' });
      console.log('Retrying CLI execution...');
      execSync(`npx ts-node ${cliPath} ${process.argv.slice(2).join(' ')}`, {
        stdio: 'inherit',
        cwd: path.dirname(__dirname)
      });
    } catch (installError) {
      console.error('Failed to install ts-node:', installError.message);
      console.error('Please install ts-node globally: npm install -g ts-node');
      process.exit(1);
    }
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run CLI
runCLI();
