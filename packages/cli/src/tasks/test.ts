import { execSync } from 'child_process';
import chalk from 'chalk';

export function testTask() {
  console.log(chalk.blue('Running tests...'));
  
  try {
    execSync('jest', { stdio: 'inherit' });
    console.log(chalk.green('All tests passed!'));
  } catch (error) {
    console.error(chalk.red('Tests failed:'), error);
    process.exit(1);
  }
}
