import { devCommand } from './tasks/dev.js';
import { buildCommand } from './tasks/build.js';
import { createCommand } from './tasks/create.js';
import { testCommand } from './tasks/test.js';
import { diagnoseCommand } from './tasks/diagnose.js';

export async function run(args: string[]) {
  const cmd = args[0];
  switch(cmd) {
    case 'dev': return devCommand();
    case 'build': return buildCommand();
    case 'create': return createCommand(args.slice(1));
  case 'test': return testCommand();
  case 'diagnose': return diagnoseCommand();
    default:
  console.log('ONEDOT-JS CLI\nCommands: dev, build, create <name>, test, diagnose');
  }
}
