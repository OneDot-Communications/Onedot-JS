import { AotCompiler } from './compiler';
import { CompilationOptions, OptimizationOptions } from './types';

export function createCompiler(options: CompilationOptions): AotCompiler {
  return new AotCompiler(options);
}

export function createDefaultOptions(): CompilationOptions {
  return {
    basePath: process.cwd(),
    entryFiles: [],
    optimization: {
      enableMinification: true,
      enableDeadCodeElimination: true,
      enableTreeShaking: true,
      enableInlining: true,
      enableConstantFolding: true,
      enablePropertyAccessOptimization: true,
      sourceMap: true,
      target: 'es2020',
      module: 'esm'
    },
    metadata: {},
    plugins: []
  };
}

export function createOptimizationOptions(overrides: Partial<OptimizationOptions> = {}): OptimizationOptions {
  return {
    enableMinification: true,
    enableDeadCodeElimination: true,
    enableTreeShaking: true,
    enableInlining: true,
    enableConstantFolding: true,
    enablePropertyAccessOptimization: true,
    sourceMap: true,
    target: 'es2020',
    module: 'esm',
    ...overrides
  };
}
