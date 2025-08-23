import chalk from 'chalk';
import { EventEmitter } from 'events';

export abstract class Command extends EventEmitter {
  public readonly name: string;
  public readonly description: string;
  public readonly cli: any;
  public options: CommandOption[] = [];
  public aliases: string[] = [];
  public hidden: boolean = false;

  constructor(name: string, description: string, cli: any) {
    super();
    this.name = name;
    this.description = description;
    this.cli = cli;
  }

  public abstract execute(args: any): Promise<any>;

  public option(name: string, description: string, defaultValue?: any, required?: boolean): this {
    this.options.push({
      name,
      description,
      defaultValue,
      required: required || false
    });
    return this;
  }

  public alias(name: string): this {
    this.aliases.push(name);
    return this;
  }

  public hide(): this {
    this.hidden = true;
    return this;
  }

  public showHelp(): void {
    console.log(chalk.cyan(`Command: ${this.name}`));
    console.log(chalk.gray(`Description: ${this.description}`));

    if (this.options.length > 0) {
      console.log(chalk.yellow('\nOptions:'));
      const maxNameLength = Math.max(...this.options.map(opt => opt.name.length));

      for (const option of this.options) {
        const padding = ' '.repeat(maxNameLength - option.name.length + 2);
        const defaultValue = option.defaultValue !== undefined ? ` (default: ${option.defaultValue})` : '';
        const required = option.required ? chalk.red(' (required)') : '';
        console.log(`  --${option.name}${padding}${option.description}${defaultValue}${required}`);
      }
    }

    if (this.aliases.length > 0) {
      console.log(chalk.yellow('\nAliases:'));
      console.log(`  ${this.aliases.join(', ')}`);
    }
  }

  protected validateArgs(args: any): { valid: boolean; message?: string } {
    // Check for required options
    for (const option of this.options) {
      if (option.required && args[option.name] === undefined) {
        return {
          valid: false,
          message: `Option --${option.name} is required`
        };
      }
    }

    return { valid: true };
  }

  protected handleError(error: Error): void {
    console.error(chalk.red(`Error in command ${this.name}:`));
    console.error(error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
  }
}

export interface CommandOption {
  name: string;
  description: string;
  defaultValue?: any;
  required?: boolean;
}

export abstract class AsyncCommand extends Command {
  constructor(name: string, description: string, cli: any) {
    super(name, description, cli);
  }

  abstract executeAsync(args: any): Promise<any>;

  async execute(args: any): Promise<any> {
    try {
      const validation = this.validateArgs(args);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      return await this.executeAsync(args);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
}

export abstract class SyncCommand extends Command {
  constructor(name: string, description: string, cli: any) {
    super(name, description, cli);
  }

  abstract executeSync(args: any): any;

  async execute(args: any): Promise<any> {
    try {
      const validation = this.validateArgs(args);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      return this.executeSync(args);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
}

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  public register(command: Command): void {
    this.commands.set(command.name, command);

    // Register aliases
    for (const alias of command.aliases) {
      this.commands.set(alias, command);
    }
  }

  public unregister(name: string): void {
    const command = this.commands.get(name);
    if (command) {
      this.commands.delete(name);

      // Remove aliases
      for (const alias of command.aliases) {
        this.commands.delete(alias);
      }
    }
  }

  public get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  public list(): Command[] {
    const uniqueCommands = new Map<string, Command>();

    for (const [name, command] of this.commands) {
      if (!uniqueCommands.has(command.name)) {
        uniqueCommands.set(command.name, command);
      }
    }

    return Array.from(uniqueCommands.values())
      .filter(cmd => !cmd.hidden)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public find(pattern: string): Command[] {
    const regex = new RegExp(pattern, 'i');
    return this.list().filter(cmd =>
      regex.test(cmd.name) || regex.test(cmd.description)
    );
  }
}
