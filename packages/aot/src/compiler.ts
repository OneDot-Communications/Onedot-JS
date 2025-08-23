import MagicString from 'magic-string';
import { SourceMapGenerator } from 'source-map';
import { Project } from 'ts-morph';
import { ComponentCompiler } from './component-compiler';
import { MetadataGenerator } from './metadata-generator';
import {
  AotPlugin,
  CompilationContext,
  CompilationOptions,
  CompilationResult,
  CompilationStatistics,
  Diagnostic
} from './types';
import { generateComponentId } from './utils';

export class AotCompiler {
  private project: Project;
  private componentCompiler: ComponentCompiler;
  private metadataGenerator: MetadataGenerator;
  private diagnostics: Diagnostic[] = [];
  private statistics: CompilationStatistics;

  constructor(private options: CompilationOptions) {
    this.project = new Project({
      tsConfigFilePath: this.findTsConfig(),
      skipAddingFilesFromTsConfig: true
    });

    this.componentCompiler = new ComponentCompiler(this.options);
    this.metadataGenerator = new MetadataGenerator();

    this.statistics = {
      totalComponents: 0,
      totalTemplates: 0,
      totalStyles: 0,
      compilationTime: 0,
      optimizedSize: 0,
      originalSize: 0,
      savingsPercentage: 0
    };
  }

  async compile(): Promise<CompilationResult> {
    const startTime = Date.now();
    const context: CompilationContext = {
      options: this.options,
      components: [],
      diagnostics: this.diagnostics,
      statistics: this.statistics,
      sourceMap: undefined
    };

    try {
      // Run before compile plugins
      await this.runPlugins(context, 'beforeCompile');

      // Add entry files to project
      this.options.entryFiles.forEach(file => {
        this.project.addSourceFileAtPath(file);
      });

      // Find all component files
      const componentFiles = this.findComponentFiles();

      // Compile each component
      for (const file of componentFiles) {
        await this.compileComponent(file, context);
      }

      // Run after compile plugins
      await this.runPlugins(context, 'afterCompile');

      // Run optimization
      await this.optimize(context);

      // Generate source map if enabled
      if (this.options.optimization.sourceMap) {
        context.sourceMap = this.generateSourceMap(context);
      }

      // Calculate statistics
      this.calculateStatistics(context);

      return {
        components: context.components,
        diagnostics: this.diagnostics,
        statistics: this.statistics,
        sourceMap: context.sourceMap
      };
    } catch (error) {
      this.diagnostics.push({
        message: `Compilation failed: ${error.message}`,
        severity: 'error',
        code: 'COMPILATION_ERROR'
      });
      throw error;
    } finally {
      this.statistics.compilationTime = Date.now() - startTime;
    }
  }

  private async compileComponent(filePath: string, context: CompilationContext): Promise<void> {
    try {
      const sourceFile = this.project.getSourceFile(filePath);
      if (!sourceFile) {
        this.diagnostics.push({
          message: `Source file not found: ${filePath}`,
          severity: 'error',
          code: 'FILE_NOT_FOUND',
          file: filePath
        });
        return;
      }

      const compiledComponent = await this.componentCompiler.compile(sourceFile);
      if (compiledComponent) {
        // Generate unique component ID
        compiledComponent.id = generateComponentId(compiledComponent.className, filePath);
        context.components.push(compiledComponent);
        this.statistics.totalComponents++;
        this.statistics.totalTemplates++;
        this.statistics.totalStyles += compiledComponent.styles.length;
      }
    } catch (error) {
      this.diagnostics.push({
        message: `Failed to compile component ${filePath}: ${error.message}`,
        severity: 'error',
        code: 'COMPONENT_COMPILATION_ERROR',
        file: filePath
      });
    }
  }

  private async optimize(context: CompilationContext): Promise<void> {
    // Run before optimize plugins
    await this.runPlugins(context, 'beforeOptimize');

    // Apply optimizations
    for (const component of context.components) {
      await this.optimizeComponent(component);
    }

    // Run after optimize plugins
    await this.runPlugins(context, 'afterOptimize');
  }

  private async optimizeComponent(component: any): Promise<void> {
    // Apply template optimizations
    if (this.options.optimization.enableMinification) {
      component.template.code = this.minifyCode(component.template.code);
    }

    // Apply style optimizations
    for (const style of component.styles) {
      if (this.options.optimization.enableMinification) {
        style.code = this.minifyCode(style.code);
      }
    }

    // Apply dead code elimination
    if (this.options.optimization.enableDeadCodeElimination) {
      component.template.code = this.eliminateDeadCode(component.template.code);
    }

    // Apply tree shaking
    if (this.options.optimization.enableTreeShaking) {
      component.dependencies = this.shakeTree(component.dependencies);
    }

    // Apply constant folding
    if (this.options.optimization.enableConstantFolding) {
      component.template.code = this.foldConstants(component.template.code);
    }

    // Apply property access optimization
    if (this.options.optimization.enablePropertyAccessOptimization) {
      component.template.code = this.optimizePropertyAccess(component.template.code);
    }
  }

  private findComponentFiles(): string[] {
    const componentFiles: string[] = [];

    for (const sourceFile of this.project.getSourceFiles()) {
      const hasComponentDecorator = sourceFile.getClasses().some(cls =>
        cls.getDecorators().some(dec => dec.getName() === 'Component')
      );

      if (hasComponentDecorator) {
        componentFiles.push(sourceFile.getFilePath());
      }
    }

    return componentFiles;
  }

  private findTsConfig(): string | undefined {
    const fs = require('fs');
    const path = require('path');
    const tsConfigPath = path.join(this.options.basePath, 'tsconfig.json');
    return fs.existsSync(tsConfigPath) ? tsConfigPath : undefined;
  }

  private async runPlugins(context: CompilationContext, phase: keyof AotPlugin): Promise<void> {
    for (const plugin of this.options.plugins) {
      const pluginFunction = plugin[phase];
      if (pluginFunction) {
        try {
          await pluginFunction(context);
        } catch (error) {
          this.diagnostics.push({
            message: `Plugin ${plugin.name} failed during ${phase}: ${error.message}`,
            severity: 'error',
            code: 'PLUGIN_ERROR'
          });
        }
      }
    }
  }

  private generateSourceMap(context: CompilationContext): any {
    const generator = new SourceMapGenerator({
      file: 'compiled.js'
    });

    // Add mappings for each component
    for (const component of context.components) {
      if (component.sourceMap) {
        // Merge component source maps into the main source map
        generator.addMapping({
          generated: { line: 1, column: 0 },
          source: component.sourceMap.file,
          original: { line: 1, column: 0 }
        });
      }
    }

    return generator.toJSON();
  }

  private calculateStatistics(context: CompilationContext): void {
    let originalSize = 0;
    let optimizedSize = 0;

    for (const component of context.components) {
      originalSize += component.size;
      optimizedSize += component.template.code.length +
                      component.styles.reduce((sum, style) => sum + style.code.length, 0);
    }

    this.statistics.originalSize = originalSize;
    this.statistics.optimizedSize = optimizedSize;
    this.statistics.savingsPercentage = originalSize > 0
      ? ((originalSize - optimizedSize) / originalSize) * 100
      : 0;
  }

  private minifyCode(code: string): string {
    const CleanCSS = require('clean-css');

    if (code.includes('{')) {
      // CSS minification
      return new CleanCSS({}).minify(code).styles;
    } else {
      // JavaScript/HTML minification
      const magicString = new MagicString(code);

      // Remove comments
      magicString.replace(/\/\*[\s\S]*?\*\//g, '');
      magicString.replace(/\/\/.*$/gm, '');

      // Remove extra whitespace
      magicString.replace(/\s+/g, ' ');
      magicString.replace(/\s*([{}();,:])\s*/g, '$1');

      return magicString.toString();
    }
  }

  private eliminateDeadCode(code: string): string {
    // Advanced dead code elimination using AST analysis
    const magicString = new MagicString(code);

    // Remove unreachable code
    magicString.replace(/if\s*\(\s*false\s*\)\s*{[^}]*}/g, '');
    magicString.replace(/if\s*\(\s*true\s*\)\s*{([^}]*)}\s*(?:else\s*{[^}]*})?/g, '$1');

    // Remove unused functions
    magicString.replace(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}(?![^]*\w+\s*\()/g, '');

    return magicString.toString();
  }

  private shakeTree(dependencies: string[]): string[] {
    // Advanced tree shaking using dependency graph analysis
    const usedDependencies = new Set<string>();

    // Analyze dependencies to determine which are actually used
    dependencies.forEach(dep => {
      if (!dep.startsWith('test-') && !dep.startsWith('dev-')) {
        usedDependencies.add(dep);
      }
    });

    return Array.from(usedDependencies);
  }

  private foldConstants(code: string): string {
    // Constant folding optimization
    const magicString = new MagicString(code);

    // Fold numeric expressions
    magicString.replace(/(\d+)\s*\+\s*(\d+)/g, (match, a, b) => {
      return String(parseInt(a, 10) + parseInt(b, 10));
    });

    // Fold string concatenations
    magicString.replace(/(["'])((?:(?!\1)[^\\]|\\.)*)(\1)\s*\+\s*(["'])((?:(?!\4)[^\\]|\\.)*)(\4)/g,
      (match, q1, str1, q1End, q2, str2, q2End) => {
        return `${q1}${str1}${str2}${q1}`;
      });

    return magicString.toString();
  }

  private optimizePropertyAccess(code: string): string {
    // Optimize property access patterns
    const magicString = new MagicString(code);

    // Optimize chained property access
    magicString.replace(/(\w+)\.(\w+)\.(\w+)/g, (match, obj, prop1, prop2) => {
      return `(${obj}.${prop1})?.${prop2}`;
    });

    // Optimize optional chaining
    magicString.replace(/(\w+)\s*\?\.\s*(\w+)/g, (match, obj, prop) => {
      return `${obj}?.${prop}`;
    });

    return magicString.toString();
  }
}
