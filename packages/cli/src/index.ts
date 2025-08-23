export { CLI } from './cli';
export { Command } from './command';
export { createCLI } from './factory';
export { Runner } from './runner';
export { Task } from './task';

// Re-export commonly used types
export type {
    CLIOptions,
    CommandOptions, PluginOptions, RunnerOptions, TaskOptions
} from './types';

// Re-export utilities
export {
    checkForUpdates, formatOutput, getConfig, handleError, parseArgs, setConfig, validateArgs
} from './utils';

// Re-export tasks
export {
    BuildTask, CleanTask, CreateTask, DevTask, DiagnoseTask, HelpTask, MigrateTask,
    StartTask, TestTask, VersionTask
} from './src/tasks';

// Default export
export { createCLI as default } from './factory';
