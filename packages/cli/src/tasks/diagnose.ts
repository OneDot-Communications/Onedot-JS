import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

export function diagnoseTask() {
  console.log(chalk.blue('Diagnosing environment...'));
  
  const issues = [];
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 16) {
    issues.push({
      type: 'error',
      message: `Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 16 or higher.`
    });
  }
  
  // Check if package.json exists
  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    issues.push({
      type: 'error',
      message: 'No package.json found in current directory.'
    });
  }
  
  // Check if onedot-js is installed
  try {
    require.resolve('onedot-js');
  } catch (e) {
    issues.push({
      type: 'error',
      message: 'onedot-js is not installed. Please run: npm install -g onedot-js'
    });
  }
  
  // Check TypeScript
  try {
    execSync('tsc --version', { stdio: 'pipe' });
  } catch (e) {
    issues.push({
      type: 'warning',
      message: 'TypeScript is not installed. Some features may not work properly.'
    });
  }
  
  // Report results
  if (issues.length === 0) {
    console.log(chalk.green('? No issues found! Your environment is ready for ONEDOT-JS development.'));
  } else {
    console.log(chalk.yellow('Found the following issues:'));
    issues.forEach(issue => {
      const color = issue.type === 'error' ? 'red' : 'yellow';
      console.log(chalk[color](`  ${issue.type.toUpperCase()}: ${issue.message}`));
    });
    
    if (issues.some(issue => issue.type === 'error')) {
      process.exit(1);
    }
  }
}
