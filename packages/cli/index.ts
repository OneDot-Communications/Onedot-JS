export * from './src';
export { CLI } from './src/cli';
export { Command } from './src/command';
export { createCLI } from './src/factory';
export { Runner } from './src/runner';
export { Task } from './src/task';

// Re-export commonly used types
export type {
  CLIOptions,
  CommandOptions, PluginOptions, RunnerOptions, TaskOptions
} from './src/types';

// Re-export utilities
export {
  checkForUpdates, formatOutput, getConfig, handleError, parseArgs, setConfig, validateArgs
} from './src/utils';

// Re-export tasks
export {
  BuildTask, CleanTask, CreateTask, DevTask, DiagnoseTask, HelpTask, MigrateTask,
  StartTask, TestTask, VersionTask
} from './src/tasks';

// Default export
export { createCLI as default } from './src/factory';

