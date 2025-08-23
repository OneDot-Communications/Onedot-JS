import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

export function createTask(appName: string, templateName?: string) {
  console.log(chalk.blue(`Creating new ONEDOT-JS app: ${appName}`));
  
  const template = templateName || 'basic';
  const templatePath = path.join(__dirname, '..', '..', '..', 'templates', template);
  const targetPath = path.join(process.cwd(), appName);
  
  try {
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      console.error(chalk.red(`Template "${template}" not found`));
      process.exit(1);
    }
    
    // Create app directory
    fs.ensureDirSync(targetPath);
    
    // Copy template files
    fs.copySync(templatePath, targetPath);
    
    // Update package.json with app name
    const packageJsonPath = path.join(targetPath, 'package.json');
    const packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.name = appName;
    fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
    
    // Install dependencies
    console.log(chalk.yellow('Installing dependencies...'));
    process.chdir(targetPath);
    execSync('npm install', { stdio: 'inherit' });
    
    console.log(chalk.green(`App "${appName}" created successfully!`));
    console.log(chalk.cyan(`\nNext steps:`));
    console.log(chalk.cyan(`  cd ${appName}`));
    console.log(chalk.cyan(`  onedot dev`));
  } catch (error) {
    console.error(chalk.red('Failed to create app:'), error);
    process.exit(1);
  }
}
