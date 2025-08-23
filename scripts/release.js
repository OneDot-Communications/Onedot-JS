#!/usr/bin/env node

/**
 * Release script for ONEDOT-JS framework
 *
 * This script handles the release process for all packages in the monorepo,
 * including version bumping, changelog generation, and publishing.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');
const conventionalRecommendedBump = require('conventional-recommended-bump');
const conventionalChangelog = require('conventional-changelog');
const conventionalCommitsParser = require('conventional-commits-parser');

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md');

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
 * Update package.json version
 */
function updatePackageVersion(packageName, newVersion) {
  const packageJsonPath = path.join(PACKAGES_DIR, packageName, 'package.json');
  const packageJson = getPackageJson(packageName);

  packageJson.version = newVersion;

  // Update dependencies on other packages
  if (packageJson.dependencies) {
    for (const [dep, version] of Object.entries(packageJson.dependencies)) {
      if (dep.startsWith('@onedot/')) {
        const depName = dep.replace('@onedot/', '');
        const depPackageJson = getPackageJson(depName);
        packageJson.dependencies[dep] = `^${depPackageJson.version}`;
      }
    }
  }

  // Update peerDependencies on other packages
  if (packageJson.peerDependencies) {
    for (const [dep, version] of Object.entries(packageJson.peerDependencies)) {
      if (dep.startsWith('@onedot/')) {
        const depName = dep.replace('@onedot/', '');
        const depPackageJson = getPackageJson(depName);
        packageJson.peerDependencies[dep] = `^${depPackageJson.version}`;
      }
    }
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  log.success(`Updated version for package: ${packageName} to ${newVersion}`);
}

/**
 * Get the current version from package.json
 */
function getCurrentVersion() {
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

/**
 * Update the root package.json version
 */
function updateRootPackageVersion(newVersion) {
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  packageJson.version = newVersion;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  log.success(`Updated root package version to ${newVersion}`);
}

/**
 * Recommend a version bump based on commit messages
 */
function recommendVersionBump() {
  return new Promise((resolve, reject) => {
    conventionalRecommendedBump({ preset: 'angular' }, (error, recommendation) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(recommendation.releaseType);
    });
  });
}

/**
 * Generate changelog
 */
function generateChangelog(version) {
  return new Promise((resolve, reject) => {
    let changelog = '';

    const context = {
      version,
      repository: 'https://github.com/onedot-js/onedot-js',
      linkCompare: true
    };

    conventionalChangelog({
      preset: 'angular',
      pkg: {
        transform: (commit) => {
          // Skip commits that don't relate to packages
          if (!commit.header.includes('packages/')) {
            return null;
          }
          return commit;
        }
      }
    }, context, (error, log) => {
      if (error) {
        reject(error);
        return;
      }

      log.on('data', (chunk) => {
        changelog += chunk;
      });

      log.on('end', () => {
        resolve(changelog);
      });
    });
  });
}

/**
 * Update changelog file
 */
function updateChangelog(version, changelogContent) {
  let content = '';

  if (fs.existsSync(CHANGELOG_PATH)) {
    content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  }

  // Add the new changelog entry at the top
  const newEntry = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n${changelogContent}\n\n`;

  // Find the position to insert the new entry (after the first heading)
  const headingMatch = content.match(/^# /m);
  if (headingMatch) {
    const insertPosition = content.indexOf('\n', headingMatch.index) + 1;
    content = content.slice(0, insertPosition) + '\n' + newEntry + content.slice(insertPosition);
  } else {
    // If no heading is found, prepend the new entry
    content = '# Changelog\n\n' + newEntry + content;
  }

  fs.writeFileSync(CHANGELOG_PATH, content);

  log.success(`Updated changelog for version ${version}`);
}

/**
 * Commit changes
 */
function commitChanges(version) {
  const message = `chore(release): ${version}`;

  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });

    log.success(`Committed changes with message: ${message}`);
  } catch (error) {
    log.error(`Failed to commit changes: ${error.message}`);
    throw error;
  }
}

/**
 * Create a git tag
 */
function createTag(version) {
  try {
    execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'inherit' });

    log.success(`Created tag: v${version}`);
  } catch (error) {
    log.error(`Failed to create tag: ${error.message}`);
    throw error;
  }
}

/**
 * Push changes and tags
 */
function pushChanges() {
  try {
    execSync('git push', { stdio: 'inherit' });
    execSync('git push --tags', { stdio: 'inherit' });

    log.success('Pushed changes and tags to remote');
  } catch (error) {
    log.error(`Failed to push changes: ${error.message}`);
    throw error;
  }
}

/**
 * Publish packages to npm
 */
async function publishPackages() {
  const packageDirs = getPackageDirectories();

  for (const packageName of packageDirs) {
    const packageDir = path.join(PACKAGES_DIR, packageName);
    const packageJson = getPackageJson(packageName);

    if (packageJson.private) {
      log.info(`Skipping private package: ${packageName}`);
      continue;
    }

    log.info(`Publishing package: ${packageName}`);

    try {
      execSync('npm publish', {
        cwd: packageDir,
        stdio: 'inherit'
      });

      log.success(`Successfully published package: ${packageName}`);
    } catch (error) {
      log.error(`Failed to publish package: ${packageName}`);
      log.error(error.message);

      // Ask if we should continue with the remaining packages
      const { shouldContinue } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldContinue',
          message: 'Do you want to continue publishing the remaining packages?',
          default: false
        }
      ]);

      if (!shouldContinue) {
        break;
      }
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log.info('Starting release process...');

    // Get current version
    const currentVersion = getCurrentVersion();
    log.info(`Current version: ${currentVersion}`);

    // Recommend version bump
    const recommendedBump = await recommendVersionBump();
    log.info(`Recommended version bump: ${recommendedBump}`);

    // Ask for confirmation
    const { versionBump, customVersion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'versionBump',
        message: 'Select version bump type:',
        choices: ['major', 'minor', 'patch', 'custom'],
        default: recommendedBump
      },
      {
        type: 'input',
        name: 'customVersion',
        message: 'Enter custom version:',
        when: (answers) => answers.versionBump === 'custom',
        validate: (input) => {
          if (!input) return 'Version is required';
          if (!/^\d+\.\d+\.\d+$/.test(input)) return 'Version must be in format x.y.z';
          return true;
        }
      }
    ]);

    // Calculate new version
    let newVersion;
    if (versionBump === 'custom') {
      newVersion = customVersion;
    } else {
      const versionParts = currentVersion.split('.').map(Number);

      if (versionBump === 'major') {
        versionParts[0]++;
        versionParts[1] = 0;
        versionParts[2] = 0;
      } else if (versionBump === 'minor') {
        versionParts[1]++;
        versionParts[2] = 0;
      } else if (versionBump === 'patch') {
        versionParts[2]++;
      }

      newVersion = versionParts.join('.');
    }

    log.info(`New version will be: ${newVersion}`);

    // Ask for confirmation
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Do you want to release version ${newVersion}?`,
        default: true
      }
    ]);

    if (!confirmed) {
      log.info('Release cancelled');
      return;
    }

    // Generate changelog
    log.info('Generating changelog...');
    const changelogContent = await generateChangelog(newVersion);

    // Update changelog file
    updateChangelog(newVersion, changelogContent);

    // Update package versions
    log.info('Updating package versions...');
    const packageDirs = getPackageDirectories();

    for (const packageName of packageDirs) {
      updatePackageVersion(packageName, newVersion);
    }

    // Update root package version
    updateRootPackageVersion(newVersion);

    // Commit changes
    commitChanges(newVersion);

    // Create tag
    createTag(newVersion);

    // Ask if we should push changes
    const { shouldPush } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldPush',
        message: 'Do you want to push changes and tags to remote?',
        default: true
      }
    ]);

    if (shouldPush) {
      pushChanges();
    }

    // Ask if we should publish packages
    const { shouldPublish } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldPublish',
        message: 'Do you want to publish packages to npm?',
        default: true
      }
    ]);

    if (shouldPublish) {
      await publishPackages();
    }

    log.success(`Release ${newVersion} completed successfully!`);
  } catch (error) {
    log.error('Release failed with error:');
    log.error(error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  recommendVersionBump,
  generateChangelog,
  updateChangelog,
  updatePackageVersion,
  updateRootPackageVersion,
  commitChanges,
  createTag,
  pushChanges,
  publishPackages
};
