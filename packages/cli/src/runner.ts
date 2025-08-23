#!/usr/bin/env node

import { Command } from 'commander';
import { createTask } from './tasks/create';
import { devTask } from './tasks/start';
import { buildTask } from './tasks/build-platform';
import { testTask } from './tasks/test';
import { diagnoseTask } from './tasks/diagnose';
import { migrateTask } from './tasks/migrate';

const program = new Command();

program
  .name('onedot')
  .description('ONEDOT-JS CLI')
  .version('1.0.0');

program
  .command('create <app_name>')
  .description('Create a new ONEDOT-JS application')
  .action(createTask);

program
  .command('create --template <template_name> <app_name>')
  .description('Create a new ONEDOT-JS application from template')
  .action((templateName, appName) => {
    createTask(appName, templateName);
  });

program
  .command('dev')
  .description('Start development server')
  .action(devTask);

program
  .command('start')
  .description('Start application in production mode')
  .action(devTask);

program
  .command('build --platform <platform>')
  .description('Build for specific platform')
  .action(buildTask);

program
  .command('build --all')
  .description('Build for all platforms')
  .action(() => buildTask('all'));

program
  .command('test')
  .description('Run tests')
  .action(testTask);

program
  .command('diagnose')
  .description('Diagnose environment issues')
  .action(diagnoseTask);

program
  .command('migrate --from <framework>')
  .description('Migrate from existing framework')
  .action(migrateTask);

program.parse();
