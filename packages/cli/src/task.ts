import chalk from 'chalk';
import { EventEmitter } from 'events';

export abstract class Task extends EventEmitter {
  public readonly name: string;
  public readonly description: string;
  public readonly cli: any;
  public options: TaskOption[] = [];
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
    console.error(chalk.red(`Error in task ${this.name}:`));
    console.error(error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
  }

  protected log(message: string): void {
    console.log(chalk.blue(`[${this.name}] ${message}`));
  }

  protected warn(message: string): void {
    console.log(chalk.yellow(`[${this.name}] ${message}`));
  }

  protected error(message: string): void {
    console.error(chalk.red(`[${this.name}] ${message}`));
  }

  protected success(message: string): void {
    console.log(chalk.green(`[${this.name}] ${message}`));
  }
}

export interface TaskOption {
  name: string;
  description: string;
  defaultValue?: any;
  required?: boolean;
}

export abstract class AsyncTask extends Task {
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

export abstract class SyncTask extends Task {
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

export class TaskRegistry {
  private tasks: Map<string, Task> = new Map();

  public register(task: Task): void {
    this.tasks.set(task.name, task);

    // Register aliases
    for (const alias of task.aliases) {
      this.tasks.set(alias, task);
    }
  }

  public unregister(name: string): void {
    const task = this.tasks.get(name);
    if (task) {
      this.tasks.delete(name);

      // Remove aliases
      for (const alias of task.aliases) {
        this.tasks.delete(alias);
      }
    }
  }

  public get(name: string): Task | undefined {
    return this.tasks.get(name);
  }

  public list(): Task[] {
    const uniqueTasks = new Map<string, Task>();

    for (const [name, task] of this.tasks) {
      if (!uniqueTasks.has(task.name)) {
        uniqueTasks.set(task.name, task);
      }
    }

    return Array.from(uniqueTasks.values())
      .filter(task => !task.hidden)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public find(pattern: string): Task[] {
    const regex = new RegExp(pattern, 'i');
    return this.list().filter(task =>
      regex.test(task.name) || regex.test(task.description)
    );
  }
}
