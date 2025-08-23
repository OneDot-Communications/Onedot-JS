#!/usr/bin/env node

/**
 * Build script for ONEDOT-JS framework
 *
 * This script builds all packages in the monorepo and handles dependencies
 * between packages.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const BUILD_ORDER = [
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
 * Check if a package has build scripts
 */
function hasBuildScripts(packageName) {
  const packageJson = getPackageJson(packageName);
  return packageJson.scripts && packageJson.scripts.build;
}

/**
 * Build a package
 */
function buildPackage(packageName) {
  log.info(`Building package: ${packageName}`);

  const packageDir = path.join(PACKAGES_DIR, packageName);

  try {
    // Run the build script
    execSync('npm run build', {
      cwd: packageDir,
      stdio: 'inherit'
    });

    log.success(`Successfully built package: ${packageName}`);
    return true;
  } catch (error) {
    log.error(`Failed to build package: ${packageName}`);
    log.error(error.message);
    return false;
  }
}

/**
 * Build all packages in the correct order
 */
async function buildAllPackages() {
  log.info('Starting build process for all packages...');

  const packageDirs = getPackageDirectories();
  const buildResults = {};

  // Build packages in the specified order
  for (const packageName of BUILD_ORDER) {
    if (packageDirs.includes(packageName) && hasBuildScripts(packageName)) {
      const success = buildPackage(packageName);
      buildResults[packageName] = success;
    } else {
      log.warning(`Skipping package: ${packageName} (no build script or not found)`);
      buildResults[packageName] = false;
    }
  }

  // Build any remaining packages that weren't in the build order
  for (const packageName of packageDirs) {
    if (!BUILD_ORDER.includes(packageName) && hasBuildScripts(packageName)) {
      const success = buildPackage(packageName);
      buildResults[packageName] = success;
    }
  }

  // Report results
  const successful = Object.values(buildResults).filter(Boolean).length;
  const total = Object.keys(buildResults).length;

  log.info(`Build completed: ${successful}/${total} packages built successfully`);

  if (successful === total) {
    log.success('All packages built successfully!');
    return true;
  } else {
    log.error(`Failed to build ${total - successful} packages`);
    return false;
  }
}

/**
 * Clean build artifacts
 */
function cleanBuildArtifacts() {
  log.info('Cleaning build artifacts...');

  const packageDirs = getPackageDirectories();

  for (const packageName of packageDirs) {
    const packageDir = path.join(PACKAGES_DIR, packageName);
    const distDir = path.join(packageDir, 'dist');

    if (fs.existsSync(distDir)) {
      log.info(`Removing dist directory for package: ${packageName}`);
      fs.rmSync(distDir, { recursive: true, force: true });
    }
  }

  log.success('All build artifacts cleaned');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const clean = args.includes('--clean');

  if (clean) {
    cleanBuildArtifacts();
  }

  const success = await buildAllPackages();

  if (!success) {
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log.error('Build failed with error:');
    log.error(error);
    process.exit(1);
  });
}

module.exports = {
  buildAllPackages,
  cleanBuildArtifacts,
  buildPackage,
  getPackageDirectories,
  getPackageJson
};
