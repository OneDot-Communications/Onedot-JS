export interface CLIOptions {
  name?: string;
  version?: string;
  description?: string;
  bin?: string;
  commands?: string[];
  plugins?: any[];
  config?: any;
}

export interface CommandOptions {
  name: string;
  description: string;
  options?: CommandOption[];
  aliases?: string[];
  hidden?: boolean;
}

export interface TaskOptions {
  name: string;
  description: string;
  options?: TaskOption[];
  aliases?: string[];
  hidden?: boolean;
}

export interface RunnerOptions {
  cwd: string;
  config: any;
  verbose?: boolean;
  dryRun?: boolean;
}

export interface PluginOptions {
  name: string;
  options?: any;
}

export interface ConfigOptions {
  path?: string;
  defaults?: any;
}

export interface CreateOptions {
  name: string;
  template?: string;
  directory?: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  skipInstall?: boolean;
  skipGit?: boolean;
  force?: boolean;
}

export interface BuildOptions {
  platform?: 'web' | 'mobile' | 'desktop' | 'all';
  mode?: 'development' | 'production';
  output?: string;
  analyze?: boolean;
  sourcemap?: boolean;
  minify?: boolean;
}

export interface DevOptions {
  port?: number;
  host?: string;
  open?: boolean;
  https?: boolean;
  hot?: boolean;
}

export interface TestOptions {
  watch?: boolean;
  coverage?: boolean;
  reporter?: string;
  pattern?: string;
  environment?: string;
}

export interface DiagnoseOptions {
  fix?: boolean;
  verbose?: boolean;
  checkUpdates?: boolean;
}

export interface MigrateOptions {
  from: string;
  path?: string;
  dryRun?: boolean;
  force?: boolean;
}

export interface StartOptions {
  port?: number;
  host?: string;
  https?: boolean;
  env?: string;
}

export interface CleanOptions {
  all?: boolean;
  cache?: boolean;
  dist?: boolean;
}

export interface CommandOption {
  name: string;
  description: string;
  defaultValue?: any;
  required?: boolean;
}

export interface TaskOption {
  name: string;
  description: string;
  defaultValue?: any;
  required?: boolean;
}

export interface Plugin {
  name: string;
  apply: (cli: any) => void;
}

export interface Config {
  get(key: string): any;
  set(key: string, value: any): void;
  has(key: string): boolean;
  delete(key: string): void;
  all(): any;
}

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
  success(message: string): void;
}

export interface Spinner {
  start(text: string): void;
  stop(): void;
  succeed(text?: string): void;
  fail(text?: string);
  warn(text?: string);
  info(text?: string);
}

export interface Prompter {
  question(question: string, options?: any): Promise<any>;
  confirm(message: string, options?: any): Promise<boolean>;
  select(message: string, choices: any[], options?: any): Promise<any>;
  checkbox(message: string, choices: any[], options?: any): Promise<any>;
  input(message: string, options?: any): Promise<string>;
  password(message: string, options?: any): Promise<string>;
}

export interface Updater {
  check(): Promise<boolean>;
  download(): Promise<void>;
  install(): Promise<void>;
}

export interface FileSystem {
  readFile(path: string): Promise<Buffer>;
  writeFile(path: string, content: Buffer | string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readdir(path: string): Promise<string[]>;
  mkdirp(path: string): Promise<void>;
  copy(src: string, dest: string): Promise<void>;
  remove(path: string): Promise<void>;
  stat(path: string): Promise<{
    isFile(): boolean;
    isDirectory(): boolean;
    size: number;
    mtime: Date;
  }>;
}

export interface PackageManager {
  install(packages: string[], options?: any): Promise<void>;
  uninstall(packages: string[], options?: any): Promise<void>;
  update(packages?: string[], options?: any): Promise<void>;
  outdated(options?: any): Promise<any>;
  audit(options?: any): Promise<any>;
}

export interface Git {
  init(options?: any): Promise<void>;
  add(files: string[], options?: any): Promise<void>;
  commit(message: string, options?: any): Promise<void>;
  push(options?: any): Promise<void>;
  pull(options?: any): Promise<void>;
  status(options?: any): Promise<any>;
  log(options?: any): Promise<any>;
}

export interface Server {
  start(options?: any): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  status(): Promise<'running' | 'stopped' | 'restarting'>;
}

export interface Bundler {
  bundle(options?: any): Promise<any>;
  watch(options?: any): Promise<void>;
  stats(): Promise<any>;
}

export interface Tester {
  run(options?: any): Promise<any>;
  watch(options?: any): Promise<void>;
  coverage(options?: any): Promise<any>;
}

export interface Linter {
  lint(options?: any): Promise<any>;
  fix(options?: any): Promise<any>;
}

export interface Formatter {
  format(options?: any): Promise<any>;
  check(options?: any): Promise<boolean>;
}
