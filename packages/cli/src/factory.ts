import { CLI } from './cli';
import { CLIOptions } from './types';

export function createCLI(options: CLIOptions = {}): CLI {
  return new CLI(options);
}

export function createProductionCLI(options: CLIOptions = {}): CLI {
  return new CLI({
    ...options,
    mode: 'production'
  });
}

export function createDevelopmentCLI(options: CLIOptions = {}): CLI {
  return new CLI({
    ...options,
    mode: 'development'
  });
}

// Factory functions for creating CLI with specific configurations
export function createWebAppCLI(options: CLIOptions = {}): CLI {
  return new CLI({
    ...options,
    name: 'onedot-web',
    description: 'ONEDOT-JS Web Application CLI',
    commands: ['create', 'build', 'dev', 'test', 'diagnose']
  });
}

export function createMobileAppCLI(options: CLIOptions = {}): CLI {
  return new CLI({
    ...options,
    name: 'onedot-mobile',
    description: 'ONEDOT-JS Mobile Application CLI',
    commands: ['create', 'build', 'dev', 'test', 'diagnose']
  });
}

export function createDesktopAppCLI(options: CLIOptions = {}): CLI {
  return new CLI({
    ...options,
    name: 'onedot-desktop',
    description: 'ONEDOT-JS Desktop Application CLI',
    commands: ['create', 'build', 'dev', 'test', 'diagnose']
  });
}

export function createLibraryCLI(options: CLIOptions = {}): CLI {
  return new CLI({
    ...options,
    name: 'onedot-lib',
    description: 'ONEDOT-JS Library CLI',
    commands: ['build', 'test', 'diagnose']
  });
}

export function createMonorepoCLI(options: CLIOptions = {}): CLI {
  return new CLI({
    ...options,
    name: 'onedot-monorepo',
    description: 'ONEDOT-JS Monorepo CLI',
    commands: ['create', 'build', 'dev', 'test', 'diagnose', 'clean']
  });
}

// Factory functions for creating CLI with specific plugins
export function createCLIWithPlugins(options: CLIOptions = {}, plugins: any[] = []): CLI {
  return new CLI({
    ...options,
    plugins
  });
}

// Factory functions for creating CLI with specific commands
export function createCLIWithCommands(options: CLIOptions = {}, commands: string[] = []): CLI {
  return new CLI({
    ...options,
    commands
  });
}

// Factory functions for creating CLI with specific configuration
export function createCLIWithConfig(options: CLIOptions = {}, config: any = {}): CLI {
  return new CLI({
    ...options,
    config
  });
}

// Factory functions for creating CLI with specific bin name
export function createCLIWithBin(options: CLIOptions = {}, bin: string = 'onedot'): CLI {
  return new CLI({
    ...options,
    bin
  });
}

// Factory functions for creating CLI with specific version
export function createCLIWithVersion(options: CLIOptions = {}, version: string = '1.0.0'): CLI {
  return new CLI({
    ...options,
    version
  });
}

// Factory functions for creating CLI with specific description
export function createCLIWithDescription(options: CLIOptions = {}, description: string): CLI {
  return new CLI({
    ...options,
    description
  });
}

// Factory functions for creating CLI with specific name
export function createCLIWithName(options: CLIOptions = {}, name: string): CLI {
  return new CLI({
    ...options,
    name
  });
}

// Factory functions for creating CLI with specific options
export function createCLIWithOptions(options: CLIOptions = {}, cliOptions: Partial<CLIOptions> = {}): CLI {
  return new CLI({
    ...options,
    ...cliOptions
  });
}

// Factory functions for creating CLI with all options
export function createFullCLI(options: FullCLIOptions = {}): CLI {
  return new CLI({
    name: options.name || 'onedot',
    version: options.version || '1.0.0',
    description: options.description || 'ONEDOT-JS CLI - Next-generation TypeScript framework',
    bin: options.bin || 'onedot',
    commands: options.commands || ['create', 'build', 'dev', 'test', 'diagnose'],
    plugins: options.plugins || [],
    config: options.config || {}
  });
}

export interface FullCLIOptions extends CLIOptions {
  name?: string;
  version?: string;
  description?: string;
  bin?: string;
  commands?: string[];
  plugins?: any[];
  config?: any;
}
