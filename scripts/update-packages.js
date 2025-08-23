#!/usr/bin/env node

/**
 * Update packages script for ONEDOT-JS framework
 *
 * This script updates all packages in the monorepo to ensure consistent
 * dependencies, scripts, and configuration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const PACKAGE_NAMES = [
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

// Standard package.json template
const PACKAGE_TEMPLATE = {
  "name": "",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "types": "index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src --ext .ts,.js",
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "onedot"
  ],
  "author": "ONEDOT-JS Team",
  "license": "MIT",
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.9.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "rimraf": "^3.0.0"
  },
  "peerDependencies": {},
  "engines": {
    "node": ">=16.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/onedot-js/onedot-js.git",
    "directory": "packages"
  },
  "bugs": {
    "url": "https://github.com/onedot-js/onedot-js/issues"
  },
  "homepage": "https://onedot-js.dev"
};

// Standard tsconfig.json template
const TSCONFIG_TEMPLATE = {
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
};

// Standard jest.config.js template
const JEST_CONFIG_TEMPLATE = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/?(*.)+(spec|test).ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts']
};`;

// Standard .eslintrc.js template
const ESLINT_CONFIG_TEMPLATE = `module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
};`;

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
 * Create a new package
 */
function createPackage(packageName, description, keywords = [], dependencies = {}) {
  const packageDir = path.join(PACKAGES_DIR, packageName);

  // Create package directory if it doesn't exist
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
  }

  // Create src directory
  const srcDir = path.join(packageDir, 'src');
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  // Create package.json
  const packageJson = {
    ...PACKAGE_TEMPLATE,
    name: `@onedot/${packageName}`,
    description,
    keywords: ['onedot', ...keywords],
    dependencies,
    peerDependencies: {}
  };

  fs.writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n'
  );

  // Create tsconfig.json
  fs.writeFileSync(
    path.join(packageDir, 'tsconfig.json'),
    JSON.stringify(TSCONFIG_TEMPLATE, null, 2) + '\n'
  );

  // Create jest.config.js
  fs.writeFileSync(path.join(packageDir, 'jest.config.js'), JEST_CONFIG_TEMPLATE);

  // Create .eslintrc.js
  fs.writeFileSync(path.join(packageDir, '.eslintrc.js'), ESLINT_CONFIG_TEMPLATE);

  // Create src/index.ts
  const indexTs = `/**
 * ONEDOT-JS ${packageName.charAt(0).toUpperCase() + packageName.slice(1)} Package
 *
 * This package provides ${description.toLowerCase()} for the ONEDOT-JS framework.
 */

// Core exports
export * from './src';

// Default export for the ${packageName} package
export default {
  // Version information
  version: require('./package.json').version
};
`;

  fs.writeFileSync(path.join(srcDir, 'index.ts'), indexTs);

  // Create __tests__ directory
  const testsDir = path.join(srcDir, '__tests__');
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }

  // Create test file
  const testFile = `/**
 * Test file for ${packageName} package
 */

describe('${packageName}', () => {
  test('should be defined', () => {
    expect(true).toBe(true);
  });
});
`;

  fs.writeFileSync(path.join(testsDir, `${packageName}.test.ts`), testFile);

  // Create setupTests.ts
  const setupTests = `/**
 * Test setup for ${packageName} package
 */

// Import any test setup utilities here
`;

  fs.writeFileSync(path.join(srcDir, 'setupTests.ts'), setupTests);

  log.success(`Created package: ${packageName}`);
}

/**
 * Update package dependencies
 */
function updatePackageDependencies(packageName) {
  const packageJsonPath = path.join(PACKAGES_DIR, packageName, 'package.json');
  const packageJson = getPackageJson(packageName);

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

  log.success(`Updated dependencies for package: ${packageName}`);
}

/**
 * Update all package dependencies
 */
function updateAllPackageDependencies() {
  log.info('Updating dependencies for all packages...');

  for (const packageName of PACKAGE_NAMES) {
    try {
      updatePackageDependencies(packageName);
    } catch (error) {
      log.error(`Failed to update dependencies for package: ${packageName}`);
      log.error(error.message);
    }
  }

  log.success('Updated dependencies for all packages');
}

/**
 * Create all packages
 */
function createAllPackages() {
  log.info('Creating all packages...');

  // Package definitions
  const packageDefinitions = [
    {
      name: 'core',
      description: 'Core functionality for ONEDOT-JS framework',
      keywords: ['onedot', 'core', 'framework']
    },
    {
      name: 'rendering',
      description: 'Rendering system for ONEDOT-JS framework',
      keywords: ['onedot', 'rendering', 'graphics'],
      dependencies: {
        '@onedot/core': '^1.0.0'
      }
    },
    {
      name: 'runtime',
      description: 'Runtime execution environment for ONEDOT-JS framework',
      keywords: ['onedot', 'runtime', 'execution'],
      dependencies: {
        '@onedot/core': '^1.0.0',
        '@onedot/plugins': '^1.0.0'
      }
    },
    {
      name: 'performance',
      description: 'Performance optimization and monitoring tools for ONEDOT-JS framework',
      keywords: ['onedot', 'performance', 'optimization'],
      dependencies: {
        '@onedot/core': '^1.0.0',
        '@onedot/native': '^1.0.0'
      }
    },
    {
      name: 'profiler',
      description: 'Performance profiling tools for ONEDOT-JS framework',
      keywords: ['onedot', 'profiler', 'benchmarking'],
      dependencies: {
        '@onedot/core': '^1.0.0',
        '@onedot/performance': '^1.0.0'
      }
    },
    {
      name: 'plugins',
      description: 'Plugin system for ONEDOT-JS framework',
      keywords: ['onedot', 'plugins', 'extensibility'],
      dependencies: {
        '@onedot/core': '^1.0.0',
        '@onedot/performance': '^1.0.0'
      }
    },
    {
      name: 'testing',
      description: 'Testing framework for ONEDOT-JS applications',
      keywords: ['onedot', 'testing', 'unit', 'integration', 'e2e'],
      dependencies: {
        '@onedot/core': '^1.0.0',
        '@onedot/runtime': '^1.0.0',
        'jest': '^29.0.0',
        'puppeteer': '^19.0.0'
      }
    },
    {
      name: 'native',
      description: 'Native platform integration for ONEDOT-JS framework',
      keywords: ['onedot', 'native', 'cross-platform'],
      dependencies: {
        '@onedot/core': '^1.0.0',
        '@onedot/rendering': '^1.0.0'
      }
    },
    {
      name: 'web',
      description: 'Web platform implementation for ONEDOT-JS framework',
      keywords: ['onedot', 'web', 'csr', 'ssr', 'ssg', 'pwa', 'seo'],
      dependencies: {
        '@onedot/core': '^1.0.0',
        '@onedot/rendering': '^1.0.0',
        '@onedot/runtime': '^1.0.0'
      }
    },
    {
      name: 'mobile',
      description: 'Mobile platform implementation for ONEDOT-JS framework',
      keywords: ['onedot', 'mobile', 'ios', 'android'],
      dependencies: {
        '@onedot/core': '^1.0.0',
        '@onedot/native': '^1.0.0'
      }
    },
    {
      name: 'desktop',
      description: 'Desktop platform implementation for ONEDOT-JS framework',
      keywords: ['onedot', 'desktop', 'windows', 'macos', 'linux'],
      dependencies: {
        '@onedot/core': '^1.0.0',
        '@onedot/native': '^1.0.0'
      }
    },
    {
      name: 'aot',
      description: 'Ahead-of-Time compilation for ONEDOT-JS framework',
      keywords: ['onedot', 'aot', 'compilation'],
      dependencies: {
        '@onedot/core': '^1.0.0'
      }
    },
    {
      name: 'bundler',
      description: 'Bundler for ONEDOT-JS applications',
      keywords: ['onedot', 'bundler', 'webpack', 'build'],
      dependencies: {
        '@onedot/core': '^1.0.0'
      }
    },
    {
      name: 'cli',
      description: 'Command-line interface for ONEDOT-JS framework',
      keywords: ['onedot', 'cli', 'command-line'],
      dependencies: {
        '@onedot/core': '^1.0.0'
      }
    },
    {
      name: 'devtools',
      description: 'Developer tools for ONEDOT-JS framework',
      keywords: ['onedot', 'devtools', 'debugging'],
      dependencies: {
        '@onedot/core': '^1.0.0'
      }
    },
    {
      name: 'docs',
      description: 'Documentation generation for ONEDOT-JS framework',
      keywords: ['onedot', 'docs', 'documentation'],
      dependencies: {
        '@onedot/core': '^1.0.0'
      }
    },
    {
      name: 'migration',
      description: 'Migration tools for ONEDOT-JS framework',
      keywords: ['onedot', 'migration', 'upgrade'],
      dependencies: {
        '@onedot/core': '^1.0.0'
      }
    }
  ];

  // Create each package
  for (const packageDef of packageDefinitions) {
    try {
      createPackage(packageDef.name, packageDef.description, packageDef.keywords, packageDef.dependencies);
    } catch (error) {
      log.error(`Failed to create package: ${packageDef.name}`);
      log.error(error.message);
    }
  }

  log.success('Created all packages');
}

/**
 * Update root package.json
 */
function updateRootPackage() {
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Update workspaces
  packageJson.workspaces = PACKAGE_NAMES.map(name => `packages/${name}`);

  // Update scripts
  packageJson.scripts = {
    "build": "lerna run build",
    "test": "lerna run test",
    "lint": "lerna run lint",
    "clean": "lerna run clean",
    "release": "node scripts/release.js",
    "bootstrap": "lerna bootstrap",
    "updated": "node scripts/update-packages.js"
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  log.success('Updated root package.json');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const create = args.includes('--create');
  const update = args.includes('--update');

  if (create) {
    createAllPackages();
    updateRootPackage();
    updateAllPackageDependencies();
    return;
  }

  if (update) {
    updateAllPackageDependencies();
    return;
  }

  // Default behavior - update dependencies
  updateAllPackageDependencies();
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log.error('Package update failed with error:');
    log.error(error);
    process.exit(1);
  });
}

module.exports = {
  createPackage,
  updatePackageDependencies,
  updateAllPackageDependencies,
  createAllPackages,
  updateRootPackage
};
