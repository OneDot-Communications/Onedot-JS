#!/usr/bin/env node

/**
 * Test script for ONEDOT-JS framework
 *
 * This script runs tests for all packages in the monorepo and handles dependencies
 * between packages.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const TEST_ORDER = [
  'core',
  'rendering',
  'runtime',
  'performance',
  'profiler',
  'plugins',
  'testing',
  'native',
  'web',
  'mobile',
  'desktop',
  'aot',
  'bundler',
  'cli',
  'devtools',
  'docs',
  'migration'
];

// Utility functions
const log = {
  info: (message) => console.log(chalk.blue('ℹ'), message),
  success: (message) => console.log(chalk.green('✓'), message),
  warning: (message) => console.log(chalk.yellow('⚠'), message),
  error: (message) => console.log(chalk.red('✗'), message)
};

/**
 * Get all package directories
 */
function getPackageDirectories() {
  return fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

/**
 * Get package.json content for a package
 */
function getPackageJson(packageName) {
  const packageJsonPath = path.join(PACKAGES_DIR, packageName, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Package.json not found for package: ${packageName}`);
  }

  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

/**
 * Check if a package has test scripts
 */
function hasTestScripts(packageName) {
  const packageJson = getPackageJson(packageName);
  return packageJson.scripts && packageJson.scripts.test;
}

/**
 * Run tests for a package
 */
function testPackage(packageName, options = {}) {
  const { verbose = false, coverage = false } = options;

  log.info(`Running tests for package: ${packageName}`);

  const packageDir = path.join(PACKAGES_DIR, packageName);

  try {
    let command = 'npm test';

    if (coverage) {
      command = 'npm run test:coverage';
    }

    // Run the test script
    execSync(command, {
      cwd: packageDir,
      stdio: verbose ? 'inherit' : 'pipe'
    });

    log.success(`Tests passed for package: ${packageName}`);
    return true;
  } catch (error) {
    log.error(`Tests failed for package: ${packageName}`);

    if (verbose) {
      log.error(error.message);
    }

    return false;
  }
}

/**
 * Run tests for all packages in the correct order
 */
async function testAllPackages(options = {}) {
  const { verbose = false, coverage = false } = options;

  log.info('Starting test process for all packages...');

  const packageDirs = getPackageDirectories();
  const testResults = {};

  // Test packages in the specified order
  for (const packageName of TEST_ORDER) {
    if (packageDirs.includes(packageName) && hasTestScripts(packageName)) {
      const success = testPackage(packageName, { verbose, coverage });
      testResults[packageName] = success;

      // Stop on failure if requested
      if (!success && options.bail) {
        break;
      }
    } else {
      log.warning(`Skipping package: ${packageName} (no test script or not found)`);
      testResults[packageName] = false;
    }
  }

  // Test any remaining packages that weren't in the test order
  for (const packageName of packageDirs) {
    if (!TEST_ORDER.includes(packageName) && hasTestScripts(packageName)) {
      const success = testPackage(packageName, { verbose, coverage });
      testResults[packageName] = success;

      // Stop on failure if requested
      if (!success && options.bail) {
        break;
      }
    }
  }

  // Report results
  const successful = Object.values(testResults).filter(Boolean).length;
  const total = Object.keys(testResults).length;

  log.info(`Tests completed: ${successful}/${total} packages passed`);

  if (successful === total) {
    log.success('All packages passed tests!');
    return true;
  } else {
    log.error(`Failed tests in ${total - successful} packages`);
    return false;
  }
}

/**
 * Run tests with coverage for all packages
 */
async function testWithCoverage() {
  log.info('Running tests with coverage for all packages...');

  const success = await testAllPackages({ coverage: true, bail: true });

  if (!success) {
    process.exit(1);
  }

  // Generate combined coverage report
  log.info('Generating combined coverage report...');

  try {
    execSync('npx nyc merge .nyc_output coverage.json', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });

    execSync('npx nyc report --reporter=html --reporter=text', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });

    log.success('Coverage report generated successfully');
  } catch (error) {
    log.error('Failed to generate coverage report');
    log.error(error.message);
  }
}

/**
 * Run tests in watch mode
 */
function testWatchMode() {
  log.info('Starting test runner in watch mode...');

  try {
    execSync('npx jest --watch', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
  } catch (error) {
    log.error('Failed to start watch mode');
    log.error(error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const coverage = args.includes('--coverage');
  const bail = args.includes('--bail');
  const watch = args.includes('--watch');

  if (watch) {
    testWatchMode();
    return;
  }

  if (coverage) {
    await testWithCoverage();
    return;
  }

  const success = await testAllPackages({ verbose, bail });

  if (!success) {
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log.error('Test run failed with error:');
    log.error(error);
    process.exit(1);
  });
}

module.exports = {
  testAllPackages,
  testPackage,
  testWithCoverage,
  testWatchMode,
  getPackageDirectories,
  getPackageJson
};
