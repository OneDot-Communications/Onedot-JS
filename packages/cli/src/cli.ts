import boxen from 'boxen';
import chalk from 'chalk';
import Configstore from 'configstore';
import { EventEmitter } from 'events';
import updateNotifier from 'update-notifier';
import { Command } from './command';
import { Runner } from './runner';
import { CLIOptions } from './types';
import { getConfig, handleError, parseArgs, validateArgs } from './utils';

export class CLI extends EventEmitter {
  private options: CLIOptions;
  private commands: Map<string, Command> = new Map();
  private runner: Runner;
  private config: Configstore;
  private notifier: updateNotifier.Instance;

  constructor(options: CLIOptions = {}) {
    super();
    this.options = {
      name: 'onedot',
      version: '1.0.0',
      description: 'ONEDOT-JS CLI - Next-generation TypeScript framework',
      ...options
    };

    this.config = new Configstore(this.options.name);
    this.notifier = updateNotifier({
      pkg: {
        name: this.options.name,
        version: this.options.version
      },
      updateCheckInterval: 1000 * 60 * 60 * 24 // Check for updates once a day
    });

    this.runner = new Runner({
      cwd: process.cwd(),
      config: this.config
    });

    this.initializeCommands();
    this.setupEventHandlers();
  }

  private initializeCommands(): void {
    // Initialize built-in commands
    this.addCommand(new CreateCommand(this));
    this.addCommand(new BuildCommand(this));
    this.addCommand(new DevCommand(this));
    this.addCommand(new TestCommand(this));
    this.addCommand(new DiagnoseCommand(this));
    this.addCommand(new MigrateCommand(this));
    this.addCommand(new StartCommand(this));
    this.addCommand(new CleanCommand(this));
    this.addCommand(new HelpCommand(this));
    this.addCommand(new VersionCommand(this));
  }

  private setupEventHandlers(): void {
    this.on('command:before', (command: string) => {
      console.log(chalk.blue(`Executing command: ${command}`));
    });

    this.on('command:after', (command: string, result: any) => {
      console.log(chalk.green(`Command completed: ${command}`));
      if (result) {
        console.log(JSON.stringify(result, null, 2));
      }
    });

    this.on('command:error', (command: string, error: Error) => {
      console.error(chalk.red(`Command failed: ${command}`));
      handleError(error);
    });

    this.on('help', () => {
      this.showHelp();
    });

    this.on('version', () => {
      this.showVersion();
    });
  }

  public addCommand(command: Command): void {
    this.commands.set(command.name, command);
    this.emit('command:added', command.name);
  }

  public removeCommand(name: string): void {
    this.commands.delete(name);
    this.emit('command:removed', name);
  }

  public getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }

  public listCommands(): string[] {
    return Array.from(this.commands.keys());
  }

  public async run(argv: string[] = process.argv.slice(2)): Promise<void> {
    try {
      // Check for updates
      this.checkUpdates();

      // Parse arguments
      const args = parseArgs(argv);

      // Validate arguments
      const validation = validateArgs(args, this.commands);
      if (!validation.valid) {
        console.error(chalk.red(validation.message));
        process.exit(1);
      }

      // Get command
      const commandName = args._[0];
      if (!commandName) {
        this.emit('help');
        return;
      }

      const command = this.getCommand(commandName);
      if (!command) {
        console.error(chalk.red(`Unknown command: ${commandName}`));
        this.emit('help');
        return;
      }

      // Execute command
      this.emit('command:before', commandName);
      const result = await this.runner.execute(command, args);
      this.emit('command:after', commandName, result);
    } catch (error) {
      this.emit('command:error', argv[0] || 'unknown', error);
      process.exit(1);
    }
  }

  private showHelp(): void {
    const helpText = this.generateHelpText();
    console.log(helpText);
  }

  private showVersion(): void {
    console.log(chalk.green(`${this.options.name} v${this.options.version}`));
  }

  private generateHelpText(): string {
    const commands = Array.from(this.commands.values()).sort((a, b) => a.name.localeCompare(b.name));

    let helpText = boxen(
      chalk.green.bold(`${this.options.name} v${this.options.version}`) + '\n' +
      chalk.blue(this.options.description) + '\n\n' +
      chalk.yellow('Usage:') + '\n' +
      `  ${this.options.name} <command> [options]\n\n` +
      chalk.yellow('Commands:'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    );

    // Find the maximum command name length for alignment
    const maxNameLength = Math.max(...commands.map(cmd => cmd.name.length));

    for (const command of commands) {
      const padding = ' '.repeat(maxNameLength - command.name.length + 2);
      helpText += `\n  ${chalk.cyan(command.name)}${padding}${command.description}`;
    }

    helpText += '\n\n' + chalk.yellow('Options:') + '\n';
    helpText += '  ' + chalk.cyan('-h, --help') + '     Show help\n';
    helpText += '  ' + chalk.cyan('-v, --version') + '  Show version\n';
    helpText += '  ' + chalk.cyan('--no-color') + '    Disable colored output\n';

    helpText += '\n\n' + chalk.yellow('Examples:') + '\n';
    helpText += `  ${chalk.cyan('$ onedot create my-app')}\n`;
    helpText += `  ${chalk.cyan('$ onedot build --platform web')}\n`;
    helpText += `  ${chalk.cyan('$ onedot dev')}\n`;
    helpText += `  ${chalk.cyan('$ onedot test')}\n`;

    return helpText;
  }

  private checkUpdates(): void {
    if (this.notifier.update) {
      console.log(
        chalk.yellow(`Update available: ${chalk.green(this.notifier.update.latest)} `) +
        chalk.dim('(current: ' + this.notifier.update.current + ')')
      );
      console.log(chalk.yellow('Run npm install -g ' + this.options.name + ' to update'));
    }
  }

  public getConfig(key?: string): any {
    return getConfig(this.config, key);
  }

  public setConfig(key: string, value: any): void {
    this.config.set(key, value);
    this.emit('config:changed', { key, value });
  }
}

// Built-in commands
class CreateCommand extends Command {
  constructor(cli: CLI) {
    super('create', 'Create a new ONEDOT-JS application', cli);
  }

  async execute(args: any): Promise<any> {
    const { CreateTask } = await import('./tasks/create');
    const task = new CreateTask(this.cli);
    return task.execute(args);
  }
}

class BuildCommand extends Command {
  constructor(cli: CLI) {
    super('build', 'Build the application for production', cli);
    this.option('platform', 'Target platform (web, mobile, desktop, all)', 'all');
    this.option('mode', 'Build mode (development, production)', 'production');
    this.option('output', 'Output directory', 'dist');
    this.option('analyze', 'Analyze bundle size', false);
  }

  async execute(args: any): Promise<any> {
    const { BuildTask } = await import('./tasks/build-platform');
    const task = new BuildTask(this.cli);
    return task.execute(args);
  }
}

class DevCommand extends Command {
  constructor(cli: CLI) {
    super('dev', 'Start the development server', cli);
    this.option('port', 'Port number', 3000);
    this.option('host', 'Host address', 'localhost');
    this.option('open', 'Open browser', false);
    this.option('https', 'Use HTTPS', false);
  }

  async execute(args: any): Promise<any> {
    const { StartTask } = await import('./tasks/start');
    const task = new StartTask(this.cli);
    return task.execute(args);
  }
}

class TestCommand extends Command {
  constructor(cli: CLI) {
    super('test', 'Run tests', cli);
    this.option('watch', 'Watch mode', false);
    this.option('coverage', 'Generate coverage report', false);
    this.option('reporter', 'Test reporter', 'spec');
    this.option('pattern', 'Test file pattern', '**/*.test.ts');
  }

  async execute(args: any): Promise<any> {
    const { TestTask } = await import('./tasks/test');
    const task = new TestTask(this.cli);
    return task.execute(args);
  }
}

class DiagnoseCommand extends Command {
  constructor(cli: CLI) {
    super('diagnose', 'Diagnose environment issues', cli);
    this.option('fix', 'Attempt to fix issues automatically', false);
    this.option('verbose', 'Verbose output', false);
  }

  async execute(args: any): Promise<any> {
    const { DiagnoseTask } = await import('./tasks/diagnose');
    const task = new DiagnoseTask(this.cli);
    return task.execute(args);
  }
}

class MigrateCommand extends Command {
  constructor(cli: CLI) {
    super('migrate', 'Migrate from another framework', cli);
    this.option('from', 'Source framework (react, angular, vue)', '', true);
    this.option('path', 'Source project path', process.cwd());
    this.option('dry-run', 'Show changes without applying them', false);
  }

  async execute(args: any): Promise<any> {
    const { MigrateTask } = await import('./tasks/migrate');
    const task = new MigrateTask(this.cli);
    return task.execute(args);
  }
}

class StartCommand extends Command {
  constructor(cli: CLI) {
    super('start', 'Start the application in production mode', cli);
    this.option('port', 'Port number', 3000);
    this.option('host', 'Host address', 'localhost');
    this.option('https', 'Use HTTPS', false);
  }

  async execute(args: any): Promise<any> {
    const { StartTask } = await import('./tasks/start');
    const task = new StartTask(this.cli);
    return task.execute({ ...args, production: true });
  }
}

class CleanCommand extends Command {
  constructor(cli: CLI) {
    super('clean', 'Clean build artifacts', cli);
    this.option('all', 'Clean all artifacts including node_modules', false);
    this.option('cache', 'Clean cache files', true);
  }

  async execute(args: any): Promise<any> {
    const fs = require('fs-extra');
    const path = require('path');

    const distPath = path.join(process.cwd(), 'dist');
    const cachePath = path.join(process.cwd(), '.cache');
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');

    if (await fs.pathExists(distPath)) {
      await fs.remove(distPath);
      console.log(chalk.green('Removed dist directory'));
    }

    if (args.cache && await fs.pathExists(cachePath)) {
      await fs.remove(cachePath);
      console.log(chalk.green('Removed cache directory'));
    }

    if (args.all && await fs.pathExists(nodeModulesPath)) {
      await fs.remove(nodeModulesPath);
      console.log(chalk.green('Removed node_modules directory'));
    }

    return { success: true };
  }
}

class HelpCommand extends Command {
  constructor(cli: CLI) {
    super('help', 'Show help information', cli);
  }

  async execute(args: any): Promise<any> {
    this.cli.emit('help');
    return {};
  }
}

class VersionCommand extends Command {
  constructor(cli: CLI) {
    super('version', 'Show version information', cli);
  }

  async execute(args: any): Promise<any> {
    this.cli.emit('version');
    return {};
  }
}
