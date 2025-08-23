/**
 * TypeScript compiler implementation
 */

import { EventEmitter } from 'events';
import * as ts from 'typescript';

import {
  CompilationResult,
  Diagnostic,
  TypeScriptOptions
} from '../types';
import { RuntimeUtils } from '../utils';

/**
 * TypeScriptCompiler - Compiles TypeScript code to JavaScript
 */
export class TypeScriptCompiler extends EventEmitter {
  private options: TypeScriptOptions;
  private compilerOptions: ts.CompilerOptions;
  private enabled: boolean = true;

  constructor(options: TypeScriptOptions = {}) {
    super();
    this.options = {
      target: 'es2020',
      module: 'esnext',
      moduleResolution: 'node',
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      ...options
    };

    this.compilerOptions = this.convertToCompilerOptions(this.options);
  }

  /**
   * Enable or disable the compiler
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Check if the compiler is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the TypeScript options
   */
  public getOptions(): TypeScriptOptions {
    return { ...this.options };
  }

  /**
   * Update the TypeScript options
   */
  public updateOptions(options: Partial<TypeScriptOptions>): void {
    this.options = { ...this.options, ...options };
    this.compilerOptions = this.convertToCompilerOptions(this.options);
    this.emit('optionsUpdated', this.options);
  }

  /**
   * Compile TypeScript code to JavaScript
   */
  public compile(code: string, filename?: string): CompilationResult {
    if (!this.enabled) {
      return {
        success: false,
        diagnostics: [RuntimeUtils.createErrorDiagnostic('Compiler is disabled')],
        compilationTime: 0
      };
    }

    const startTime = performance.now();

    try {
      // Emit compilation started event
      this.emit('compilationStarted', filename || 'unknown');

      // Create a compiler host
      const compilerHost = this.createCompilerHost();

      // Create a program
      const file = filename || 'input.ts';
      const files: ts.MapLike<ts.ISourceFile> = {};
      files[file] = ts.createSourceFile(file, code, ts.ScriptTarget.Latest);

      const program = ts.createProgram({
        rootNames: [file],
        options: this.compilerOptions,
        host: compilerHost
      });

      // Get diagnostics
      const diagnostics = this.getDiagnostics(program);

      // Emit the JavaScript code
      let outputCode = '';
      let sourceMap: any = null;

      if (!RuntimeUtils.hasErrors(diagnostics)) {
        const result = this.emitProgram(program, file);
        outputCode = result.code;
        sourceMap = result.sourceMap;
      }

      // Calculate compilation time
      const compilationTime = performance.now() - startTime;

      // Create result
      const result: CompilationResult = {
        success: !RuntimeUtils.hasErrors(diagnostics),
        code: outputCode || undefined,
        sourceMap,
        diagnostics,
        compilationTime
      };

      // Emit compilation completed event
      this.emit('compilationCompleted', result);

      return result;
    } catch (error) {
      // Calculate compilation time
      const compilationTime = performance.now() - startTime;

      // Create result
      const result: CompilationResult = {
        success: false,
        diagnostics: [RuntimeUtils.createErrorDiagnostic(
          error instanceof Error ? error.message : String(error),
          filename
        )],
        compilationTime
      };

      // Emit compilation error event
      this.emit('compilationError', error);

      return result;
    }
  }

  /**
   * Convert TypeScript options to compiler options
   */
  private convertToCompilerOptions(options: TypeScriptOptions): ts.CompilerOptions {
    const compilerOptions: ts.CompilerOptions = {};

    // Map TypeScript options to compiler options
    if (options.target) {
      compilerOptions.target = this.convertScriptTarget(options.target);
    }

    if (options.module) {
      compilerOptions.module = this.convertModuleKind(options.module);
    }

    if (options.moduleResolution) {
      compilerOptions.moduleResolution = this.convertModuleResolutionKind(options.moduleResolution);
    }

    if (options.esModuleInterop !== undefined) {
      compilerOptions.esModuleInterop = options.esModuleInterop;
    }

    if (options.allowSyntheticDefaultImports !== undefined) {
      compilerOptions.allowSyntheticDefaultImports = options.allowSyntheticDefaultImports;
    }

    if (options.strict !== undefined) {
      compilerOptions.strict = options.strict;
    }

    if (options.skipLibCheck !== undefined) {
      compilerOptions.skipLibCheck = options.skipLibCheck;
    }

    if (options.forceConsistentCasingInFileNames !== undefined) {
      compilerOptions.forceConsistentCasingInFileNames = options.forceConsistentCasingInFileNames;
    }

    if (options.resolveJsonModule !== undefined) {
      compilerOptions.resolveJsonModule = options.resolveJsonModule;
    }

    // Add source map option
    compilerOptions.sourceMap = true;

    return compilerOptions;
  }

  /**
   * Convert script target string to TypeScript enum
   */
  private convertScriptTarget(target: string): ts.ScriptTarget {
    switch (target.toLowerCase()) {
      case 'es3':
        return ts.ScriptTarget.ES3;
      case 'es5':
        return ts.ScriptTarget.ES5;
      case 'es6':
      case 'es2015':
        return ts.ScriptTarget.ES2015;
      case 'es2016':
        return ts.ScriptTarget.ES2016;
      case 'es2017':
        return ts.ScriptTarget.ES2017;
      case 'es2018':
        return ts.ScriptTarget.ES2018;
      case 'es2019':
        return ts.ScriptTarget.ES2019;
      case 'es2020':
        return ts.ScriptTarget.ES2020;
      case 'es2021':
        return ts.ScriptTarget.ES2021;
      case 'es2022':
        return ts.ScriptTarget.ES2022;
      case 'esnext':
      default:
        return ts.ScriptTarget.ESNext;
    }
  }

  /**
   * Convert module kind string to TypeScript enum
   */
  private convertModuleKind(module: string): ts.ModuleKind {
    switch (module.toLowerCase()) {
      case 'none':
        return ts.ModuleKind.None;
      case 'commonjs':
        return ts.ModuleKind.CommonJS;
      case 'amd':
        return ts.ModuleKind.AMD;
      case 'umd':
        return ts.ModuleKind.UMD;
      case 'system':
        return ts.ModuleKind.System;
      case 'es6':
      case 'es2015':
        return ts.ModuleKind.ES2015;
      case 'es2020':
        return ts.ModuleKind.ES2020;
      case 'es2022':
        return ts.ModuleKind.ES2022;
      case 'esnext':
      default:
        return ts.ModuleKind.ESNext;
    }
  }

  /**
   * Convert module resolution kind string to TypeScript enum
   */
  private convertModuleResolutionKind(moduleResolution: string): ts.ModuleResolutionKind {
    switch (moduleResolution.toLowerCase()) {
      case 'classic':
        return ts.ModuleResolutionKind.Classic;
      case 'node':
      default:
        return ts.ModuleResolutionKind.Node;
    }
  }

  /**
   * Create a compiler host
   */
  private createCompilerHost(): ts.CompilerHost {
    const compilerHost: ts.CompilerHost = {
      getSourceFile: (fileName, languageVersion) => {
        // This is a simplified implementation
        // In a real implementation, we would read the file from the file system
        return undefined;
      },
      getDefaultLibFileName: () => 'lib.d.ts',
      writeFile: (name, text) => {
        // This is a simplified implementation
        // In a real implementation, we would write the file to the file system
      },
      getCurrentDirectory: () => '',
      getDirectories: () => [],
      fileExists: (fileName) => {
        // This is a simplified implementation
        // In a real implementation, we would check if the file exists
        return false;
      },
      readFile: (fileName) => {
        // This is a simplified implementation
        // In a real implementation, we would read the file from the file system
        return undefined;
      },
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => false,
      getNewLine: () => '\n',
      getEnvironmentVariable: (name) => process.env[name]
    };

    return compilerHost;
  }

  /**
   * Get diagnostics from a program
   */
  private getDiagnostics(program: ts.Program): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Get syntactic diagnostics
    const syntacticDiagnostics = program.getSyntacticDiagnostics();
    syntacticDiagnostics.forEach(diagnostic => {
      diagnostics.push(this.convertDiagnostic(diagnostic));
    });

    // Get semantic diagnostics
    const semanticDiagnostics = program.getSemanticDiagnostics();
    semanticDiagnostics.forEach(diagnostic => {
      diagnostics.push(this.convertDiagnostic(diagnostic));
    });

    // Get declaration diagnostics
    const declarationDiagnostics = program.getDeclarationDiagnostics();
    declarationDiagnostics.forEach(diagnostic => {
      diagnostics.push(this.convertDiagnostic(diagnostic));
    });

    return diagnostics;
  }

  /**
   * Convert TypeScript diagnostic to our diagnostic format
   */
  private convertDiagnostic(diagnostic: ts.Diagnostic): Diagnostic {
    const file = diagnostic.file;
    const start = diagnostic.start;
    const length = diagnostic.length;

    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

    let category: 'error' | 'warning' | 'info' | 'hint';

    switch (diagnostic.category) {
      case ts.DiagnosticCategory.Error:
        category = 'error';
        break;
      case ts.DiagnosticCategory.Warning:
        category = 'warning';
        break;
      case ts.DiagnosticCategory.Message:
        category = 'info';
        break;
      case ts.DiagnosticCategory.Suggestion:
        category = 'hint';
        break;
      default:
        category = 'error';
    }

    return {
      file: file ? file.fileName : undefined,
      start,
      length,
      message,
      category,
      code: diagnostic.code
    };
  }

  /**
   * Emit a program to JavaScript
   */
  private emitProgram(program: ts.Program, file: string): { code: string; sourceMap: any } {
    let outputCode = '';
    let sourceMap: any = null;

    // Create an emitter
    const emitter: ts.EmitOutput = {
      outputFiles: [],
      emitSkipped: false
    };

    // Emit the program
    program.emit(
      undefined,
      (name, text) => {
        if (name.endsWith('.js')) {
          outputCode = text;
        } else if (name.endsWith('.js.map')) {
          try {
            sourceMap = JSON.parse(text);
          } catch (e) {
            // Invalid source map
          }
        }
      },
      undefined,
      undefined,
      this.compilerOptions
    );

    return {
      code: outputCode,
      sourceMap
    };
  }
}
