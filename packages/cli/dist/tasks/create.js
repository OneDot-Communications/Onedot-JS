import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createCommand(args: string[]) {
  const name = args[0] || 'my-onedot-app';
  const template = args[1] || 'default';
  
  const root = process.cwd();
  const appDir = path.join(root, name);
  const templateDir = path.join(__dirname, '..', '..', 'templates', template);
  
  // Check if directory already exists
  if (fs.existsSync(appDir)) {
    throw new Error(`Directory "${name}" already exists`);
  }
  
  // Check if template exists
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template "${template}" not found. Available templates: default`);
  }
  
  console.log(`🚀 Creating ONEDOT app "${name}" with template "${template}"`);
  
  try {
    // Copy template files recursively
    copyTemplate(templateDir, appDir, name);
    
    console.log(`✅ Successfully created "${name}"`);
    console.log('');
    console.log('📁 Project structure:');
    console.log(`   ${name}/`);
    console.log('   ├── src/');
    console.log('   │   ├── components/    # Reusable UI components');
    console.log('   │   ├── pages/         # File-based routing pages');
    console.log('   │   ├── stores/        # State management');
    console.log('   │   ├── styles/        # Global styles');
    console.log('   │   ├── utils/         # Utility functions');
    console.log('   │   ├── App.tsx        # Main app component');
    console.log('   │   └── main.ts        # Entry point');
    console.log('   ├── public/            # Static assets');
    console.log('   ├── package.json       # Dependencies');
    console.log('   ├── tsconfig.json      # TypeScript config');
    console.log('   └── onedot.config.ts   # Framework config');
    console.log('');
    console.log('🎯 Next steps:');
    console.log(`   cd ${name}`);
    console.log('   npm install');
    console.log('   npm run dev');
    console.log('');
    console.log('🔗 Learn more:');
    console.log('   📖 Documentation: https://onedotjs.dev/docs');
    console.log('   💬 Community: https://discord.gg/onedotjs');
    console.log('   🐛 Issues: https://github.com/onedotjs/onedot/issues');
    
  } catch (error) {
    console.error('❌ Failed to create app:', error instanceof Error ? error.message : error);
    // Clean up on failure
    if (fs.existsSync(appDir)) {
      fs.rmSync(appDir, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

function copyTemplate(templateDir: string, targetDir: string, appName: string) {
  // Create target directory
  fs.mkdirSync(targetDir, { recursive: true });
  
  const items = fs.readdirSync(templateDir);
  
  for (const item of items) {
    const srcPath = path.join(templateDir, item);
    const destPath = path.join(targetDir, item);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      // Recursively copy directories
      copyTemplate(srcPath, destPath, appName);
    } else {
      // Copy and process files
      let content = fs.readFileSync(srcPath, 'utf8');
      
      // Replace template variables
      content = content.replace(/\{\{APP_NAME\}\}/g, appName);
      
      fs.writeFileSync(destPath, content, 'utf8');
    }
  }
}
