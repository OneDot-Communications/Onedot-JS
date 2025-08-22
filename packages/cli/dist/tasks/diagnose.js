import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

export async function diagnoseCommand(): Promise<void> {
  const root = process.cwd();
  const summary = {
    platform: os.platform(),
    node: process.version,
    cpus: os.cpus().length,
    memoryGB: (os.totalmem()/1024/1024/1024).toFixed(2),
    hasRust: !!which('cargo'),
    packages: listPackages(root)
  };
  console.log(JSON.stringify(summary,null,2));
}

function which(bin: string): string | null {
  const paths = process.env.PATH?.split(path.delimiter) || [];
  for (const p of paths) {
    const full = path.join(p, process.platform === 'win32' ? bin + '.exe' : bin);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function listPackages(root: string) {
  const pkgsDir = path.join(root,'packages');
  if (!fs.existsSync(pkgsDir)) return [];
  return fs.readdirSync(pkgsDir).filter((f: string)=>fs.existsSync(path.join(pkgsDir,f,'package.json')));
}
