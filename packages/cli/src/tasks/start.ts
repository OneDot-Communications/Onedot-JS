import { execSync } from 'child_process';
import chalk from 'chalk';

export function devTask() {
  console.log(chalk.blue('Starting development server...'));
  
  try {
    // Development server logic will be implemented here
    console.log(chalk.yellow('Starting server on http://localhost:3000'));
    execSync('node dist/dev-server.js', { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red('Failed to start development server:'), error);
    process.exit(1);
  }
}
