# 🛠️ CLI Commands - ONEDOT Framework

The ONEDOT CLI provides a comprehensive set of commands for creating, developing, building, and deploying ONEDOT applications. This guide covers all available commands and their options.

## 📦 Installation

### Global Installation (Recommended)

```bash
# Install globally for easy access
npm install -g @onedot/cli

# Verify installation
onedot --version
```

### Local Installation

```bash
# Install in project
npm install --save-dev @onedot/cli

# Use with npx
npx onedot --version
```

## 🚀 Project Creation Commands

### Create New Project

```bash
# Create a new ONEDOT project
onedot create <project-name>

# Examples
onedot create my-app
onedot create todo-app
onedot create my-portfolio
```

#### Create Options

```bash
# Specify template
onedot create my-app --template basic
onedot create my-app --template blog
onedot create my-app --template dashboard
onedot create my-app --template ecommerce

# With TypeScript (default)
onedot create my-app --typescript

# With JavaScript
onedot create my-app --no-typescript

# Skip git initialization
onedot create my-app --no-git

# Skip npm install
onedot create my-app --no-install

# Use specific package manager
onedot create my-app --package-manager npm
onedot create my-app --package-manager yarn
onedot create my-app --package-manager pnpm

# Verbose output
onedot create my-app --verbose
```

### Available Templates

```bash
# List all available templates
onedot templates

# Template descriptions:
# basic      - Minimal starter template
# blog       - Blog with routing and markdown
# dashboard  - Admin dashboard with auth
# ecommerce  - E-commerce with cart and checkout
# portfolio  - Personal portfolio site
# docs       - Documentation site
# api        - API-only project with edge functions
```

## 🔧 Development Commands

### Development Server

```bash
# Start development server
onedot dev

# Custom port
onedot dev --port 4000

# Custom host
onedot dev --host 0.0.0.0

# Enable HTTPS
onedot dev --https

# Open browser automatically
onedot dev --open

# Disable hot reload
onedot dev --no-hmr

# Verbose output
onedot dev --verbose
```

#### Development Server Options

```bash
# Full development command with all options
onedot dev \
  --port 3000 \
  --host localhost \
  --https \
  --open \
  --hmr \
  --verbose \
  --config onedot.config.js
```

### File Generation

```bash
# Generate a new page
onedot generate page about
onedot generate page blog/[slug]
onedot generate page user/[id]/profile

# Generate a component
onedot generate component Button
onedot generate component ui/Card
onedot generate component forms/ContactForm

# Generate a store
onedot generate store userStore
onedot generate store cart

# Generate API route
onedot generate api users
onedot generate api auth/login
onedot generate api blog/[id]

# Generate layout
onedot generate layout MainLayout
onedot generate layout DashboardLayout

# Generate service
onedot generate service authService
onedot generate service apiClient

# Generate utility
onedot generate util dateUtils
onedot generate util validation
```

#### Generation Options

```bash
# Generate with TypeScript (default)
onedot generate component Button --typescript

# Generate with JavaScript
onedot generate component Button --javascript

# Generate with test file
onedot generate component Button --with-test

# Generate with story (Storybook)
onedot generate component Button --with-story

# Generate in specific directory
onedot generate component Button --dir src/components/ui

# Dry run (preview without creating)
onedot generate component Button --dry-run
```

## 🏗️ Build Commands

### Production Build

```bash
# Build for production
onedot build

# Build with custom output directory
onedot build --outDir dist

# Build with source maps
onedot build --sourcemap

# Build without minification
onedot build --no-minify

# Build for specific target
onedot build --target es2020
onedot build --target es2018

# Analyze bundle size
onedot build --analyze

# Build with verbose output
onedot build --verbose
```

### Static Site Generation

```bash
# Generate static site
onedot build --static

# Generate for specific routes
onedot build --static --routes /,/about,/contact

# Generate with fallback
onedot build --static --fallback 404.html

# Pre-render dynamic routes
onedot build --static --prerender
```

### Build Analysis

```bash
# Analyze bundle size
onedot analyze

# Generate bundle report
onedot analyze --report

# Open analysis in browser
onedot analyze --open

# Save analysis to file
onedot analyze --output bundle-analysis.json
```

## 🚀 Deployment Commands

### Start Production Server

```bash
# Start production server
onedot start

# Custom port
onedot start --port 8080

# Custom host
onedot start --host 0.0.0.0
```

### Preview Build

```bash
# Preview production build locally
onedot preview

# Custom port for preview
onedot preview --port 4173

# Open browser automatically
onedot preview --open
```

### Export Static Files

```bash
# Export static files
onedot export

# Export to custom directory
onedot export --outDir static

# Export with trailing slashes
onedot export --trailing-slash

# Export with custom base path
onedot export --base-path /my-app
```

## 🧪 Testing Commands

### Run Tests

```bash
# Run all tests
onedot test

# Run tests in watch mode
onedot test --watch

# Run specific test file
onedot test Button.test.ts

# Run tests matching pattern
onedot test --pattern "**/components/**"

# Run tests with coverage
onedot test --coverage

# Run tests in CI mode
onedot test --ci

# Update snapshots
onedot test --update-snapshots
```

### Testing Options

```bash
# Run tests with custom config
onedot test --config jest.config.js

# Run tests with custom reporter
onedot test --reporter verbose

# Run tests with specific timeout
onedot test --timeout 10000

# Run tests in parallel
onedot test --parallel

# Run tests with debugging
onedot test --debug
```

## 🔍 Code Quality Commands

### Linting

```bash
# Lint all files
onedot lint

# Lint specific files
onedot lint src/components/**/*.ts

# Fix linting errors automatically
onedot lint --fix

# Lint with custom config
onedot lint --config .eslintrc.js

# Lint with specific rules
onedot lint --rules "no-console:error"
```

### Type Checking

```bash
# Run TypeScript type checking
onedot type-check

# Type check with watch mode
onedot type-check --watch

# Type check with custom config
onedot type-check --config tsconfig.json

# Generate type declarations
onedot type-check --declaration
```

### Code Formatting

```bash
# Format all files
onedot format

# Format specific files
onedot format src/**/*.ts

# Check if files are formatted
onedot format --check

# Format with custom config
onedot format --config prettier.config.js
```

## 📊 Project Management Commands

### Project Information

```bash
# Show project info
onedot info

# Show detailed environment info
onedot info --verbose

# Show dependency tree
onedot deps

# Check for updates
onedot check-updates

# Show bundle size
onedot size
```

### Dependency Management

```bash
# Add dependency
onedot add axios
onedot add @types/node --dev

# Remove dependency
onedot remove axios

# Update dependencies
onedot update

# Audit dependencies
onedot audit

# Clean node_modules and reinstall
onedot clean-install
```

## 🔧 Configuration Commands

### Initialize Configuration

```bash
# Initialize ONEDOT config file
onedot init

# Initialize with TypeScript
onedot init --typescript

# Initialize with specific template
onedot init --template config-advanced
```

### Environment Management

```bash
# Set up environment variables
onedot env setup

# Copy environment template
onedot env copy

# Validate environment variables
onedot env validate

# Show environment info
onedot env info
```

## 🛠️ Advanced Commands

### Database Operations (if using @onedot/db)

```bash
# Generate database migration
onedot db generate migration create_users

# Run migrations
onedot db migrate

# Rollback migration
onedot db rollback

# Seed database
onedot db seed

# Reset database
onedot db reset
```

### Component Library

```bash
# Create component library
onedot lib create my-ui-lib

# Build component library
onedot lib build

# Publish component library
onedot lib publish
```

### Plugin Management

```bash
# List installed plugins
onedot plugins list

# Install plugin
onedot plugins install @onedot/plugin-pwa

# Remove plugin
onedot plugins remove @onedot/plugin-pwa

# Create plugin
onedot plugins create my-plugin
```

## 🔍 Debugging Commands

### Debug Information

```bash
# Debug development server
onedot dev --debug

# Debug build process
onedot build --debug

# Show debug logs
onedot debug

# Profile performance
onedot profile
```

### Cache Management

```bash
# Clear all caches
onedot cache clear

# Clear specific cache
onedot cache clear --type build
onedot cache clear --type deps

# Show cache info
onedot cache info
```

## ⚙️ Global Options

All commands support these global options:

```bash
# Show help
onedot --help
onedot <command> --help

# Show version
onedot --version

# Verbose output
onedot <command> --verbose

# Quiet output
onedot <command> --quiet

# Use custom config file
onedot <command> --config custom.config.js

# Set working directory
onedot <command> --cwd /path/to/project

# Disable color output
onedot <command> --no-color

# Output as JSON
onedot <command> --json
```

## 📝 Common Command Combinations

### Development Workflow

```bash
# Create and start new project
onedot create my-app && cd my-app && onedot dev

# Generate component with test
onedot generate component Button --with-test

# Build and preview
onedot build && onedot preview

# Test and build
onedot test && onedot build
```

### Quality Assurance

```bash
# Full quality check
onedot lint && onedot type-check && onedot test

# Fix and format
onedot lint --fix && onedot format

# Clean build
onedot cache clear && onedot build
```

### Deployment Workflow

```bash
# Production deployment check
onedot test && onedot build && onedot start

# Static site deployment
onedot build --static && onedot export
```

## 🔧 Configuration File

Create an `onedot.config.js` file to customize CLI behavior:

```javascript
export default {
  // CLI-specific settings
  cli: {
    // Default template for new projects
    defaultTemplate: 'basic',
    
    // Default package manager
    packageManager: 'npm',
    
    // Auto-open browser in dev mode
    openBrowser: true,
    
    // Default ports
    devPort: 3000,
    previewPort: 4173,
  },
  
  // Command aliases
  aliases: {
    'd': 'dev',
    'b': 'build',
    's': 'start',
    'g': 'generate',
  },
  
  // Custom generators
  generators: {
    component: {
      template: './templates/component.hbs',
      destination: 'src/components/{{name}}.ts',
    },
  },
};
```

This comprehensive CLI provides everything you need to develop, build, test, and deploy ONEDOT applications efficiently.
