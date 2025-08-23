import { execSync } from 'child_process';
import chalk from 'chalk';

export function buildTask(platform: string) {
  console.log(chalk.blue(`Building for platform: ${platform}`));
  
  try {
    if (platform === 'all') {
      const platforms = ['web', 'android', 'ios', 'linux', 'windows', 'macos'];
      platforms.forEach(p => {
        console.log(chalk.yellow(`Building for ${p}...`));
        execSync(`onedot build --platform ${p}`, { stdio: 'inherit' });
      });
    } else {
      console.log(chalk.yellow(`Building for ${platform}...`));
      // Platform-specific build logic will be implemented here
      execSync(`tsc --build`, { stdio: 'inherit' });
    }
    
    console.log(chalk.green('Build completed successfully!'));
  } catch (error) {
    console.error(chalk.red('Build failed:'), error);
    process.exit(1);
  }
}
