import * as chalk from 'chalk';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as ora from 'ora';
import * as path from 'path';
import * as prettier from 'prettier';
import { Project, SourceFile } from 'ts-morph';
import * as yaml from 'yaml';

export interface MigrationOptions {
  sourcePath: string;
  outputPath: string;
  framework: 'angular' | 'react' | 'vue';
  dryRun?: boolean;
  verbose?: boolean;
  force?: boolean;
  configPath?: string;
  transformPath?: string;
  exclude?: string[];
  include?: string[];
  customTransforms?: string[];
  reportPath?: string;
  format?: boolean;
  prettierConfig?: any;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  files: {
    processed: number;
    transformed: number;
    failed: number;
    skipped: number;
  };
  errors: string[];
  warnings: string[];
  duration: number;
}

export interface MigrationReport {
  timestamp: string;
  options: MigrationOptions;
  results: MigrationResult;
  transformations: Transformation[];
}

export interface Transformation {
  name: string;
  description: string;
  files: string[];
  stats: {
    total: number;
    transformed: number;
    failed: number;
    skipped: number;
  };
  errors: string[];
  warnings: string[];
}

export interface TransformFunction {
  (sourceFile: SourceFile, project: Project): Promise<TransformResult>;
}

export interface TransformResult {
  transformed: boolean;
  sourceFile: SourceFile;
  errors?: string[];
  warnings?: string[];
}

export class MigrationManager {
  private project: Project | null = null;
  private transforms: Map<string, TransformFunction> = new Map();
  private config: any = {};
  private report: MigrationReport | null = null;

  constructor() {
    this.initializeDefaultTransforms();
  }

  private initializeDefaultTransforms(): void {
    // Initialize default transforms
    this.registerTransform('import-statements', this.transformImports.bind(this));
    this.registerTransform('component-syntax', this.transformComponentSyntax.bind(this));
    this.registerTransform('state-management', this.transformStateManagement.bind(this));
    this.registerTransform('lifecycle-methods', this.transformLifecycleMethods.bind(this));
    this.registerTransform('event-handling', this.transformEventHandling.bind(this));
    this.registerTransform('routing', this.transformRouting.bind(this));
    this.registerTransform('dependency-injection', this.transformDependencyInjection.bind(this));
  }

  public registerTransform(name: string, transform: TransformFunction): void {
    this.transforms.set(name, transform);
  }

  public getTransform(name: string): TransformFunction | undefined {
    return this.transforms.get(name);
  }

  public getTransforms(): Map<string, TransformFunction> {
    return new Map(this.transforms);
  }

  public async loadConfig(configPath: string): Promise<void> {
    try {
      if (await fs.pathExists(configPath)) {
        const ext = path.extname(configPath);

        if (ext === '.js' || ext === '.json') {
          this.config = require(configPath);
        } else if (ext === '.yml' || ext === '.yaml') {
          const content = await fs.readFile(configPath, 'utf8');
          this.config = yaml.parse(content);
        } else {
          throw new Error(`Unsupported config file format: ${ext}`);
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error loading config file: ${error}`));
      throw error;
    }
  }

  public async loadCustomTransforms(transformPaths: string[]): Promise<void> {
    for (const transformPath of transformPaths) {
      try {
        const transformModule = require(transformPath);

        if (transformModule.default && typeof transformModule.default === 'function') {
          this.registerTransform(path.basename(transformPath, '.js'), transformModule.default);
        } else if (typeof transformModule === 'function') {
          this.registerTransform(path.basename(transformPath, '.js'), transformModule);
        } else {
          console.warn(chalk.yellow(`Invalid transform module: ${transformPath}`));
        }
      } catch (error) {
        console.error(chalk.red(`Error loading transform module: ${error}`));
      }
    }
  }

  public async initializeProject(sourcePath: string): Promise<void> {
    try {
      // Find TypeScript config file
      const tsConfigPath = this.findTsConfigPath(sourcePath);

      if (tsConfigPath) {
        this.project = new Project({
          tsConfigFilePath: tsConfigPath,
          skipAddingFilesFromTsConfig: true
        });
      } else {
        this.project = new Project({
          compilerOptions: {
            target: 'esnext',
            module: 'esnext',
            moduleResolution: 'node',
            allowSyntheticDefaultImports: true,
           esModuleInterop: true,
            jsx: 'react-jsx',
            strict: true
          }
        });
      }

      // Add source files to project
      await this.addSourceFiles(sourcePath);
    } catch (error) {
      console.error(chalk.red(`Error initializing project: ${error}`));
      throw error;
    }
  }

  private findTsConfigPath(sourcePath: string): string | null {
    const tsConfigPaths = [
      path.join(sourcePath, 'tsconfig.json'),
      path.join(sourcePath, 'src', 'tsconfig.json'),
      path.join(sourcePath, 'tsconfig.app.json'),
      path.join(sourcePath, 'src', 'tsconfig.app.json')
    ];

    for (const tsConfigPath of tsConfigPaths) {
      if (fs.existsSync(tsConfigPath)) {
        return tsConfigPath;
      }
    }

    return null;
  }

  private async addSourceFiles(sourcePath: string): Promise<void> {
    if (!this.project) return;

    // Find all TypeScript/JavaScript files
    const patterns = [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx'
    ];

    const excludePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/*.d.ts'
    ];

    const filePaths: string[] = [];

    for (const pattern of patterns) {
      const files = glob.sync(pattern, {
        cwd: sourcePath,
        ignore: excludePatterns
      });

      filePaths.push(...files.map(file => path.join(sourcePath, file)));
    }

    // Add files to project
    for (const filePath of filePaths) {
      try {
        this.project.addSourceFileAtPath(filePath);
      } catch (error) {
        console.warn(chalk.yellow(`Error adding file to project: ${filePath}`));
      }
    }
  }

  public async executeTransforms(options: MigrationOptions): Promise<MigrationResult> {
    if (!this.project) {
      throw new Error('Project not initialized');
    }

    const startTime = Date.now();
    const spinner = ora('Running transforms...').start();

    const result: MigrationResult = {
      success: true,
      message: 'Migration completed successfully',
      files: {
        processed: 0,
        transformed: 0,
        failed: 0,
        skipped: 0
      },
      errors: [],
      warnings: [],
      duration: 0
    };

    const transformations: Transformation[] = [];

    try {
      // Get source files
      const sourceFiles = this.project.getSourceFiles();

      // Execute each transform
      for (const [transformName, transform] of this.transforms) {
        const transformStartTime = Date.now();
        const transformSpinner = ora(`Running ${transformName} transform...`).start();

        const transformation: Transformation = {
          name: transformName,
          description: this.getTransformDescription(transformName),
          files: [],
          stats: {
            total: sourceFiles.length,
            transformed: 0,
            failed: 0,
            skipped: 0
          },
          errors: [],
          warnings: []
        };

        try {
          // Apply transform to each source file
          for (const sourceFile of sourceFiles) {
            const filePath = sourceFile.getFilePath();

            try {
              const transformResult = await transform(sourceFile, this.project);

              transformation.files.push(filePath);

              if (transformResult.transformed) {
                transformation.stats.transformed++;
                result.files.transformed++;
              } else {
                transformation.stats.skipped++;
                result.files.skipped++;
              }

              if (transformResult.errors) {
                transformation.errors.push(...transformResult.errors);
                result.errors.push(...transformResult.errors.map(e => `${filePath}: ${e}`));
              }

              if (transformResult.warnings) {
                transformation.warnings.push(...transformResult.warnings);
                result.warnings.push(...transformResult.warnings.map(w => `${filePath}: ${w}`));
              }
            } catch (error) {
              transformation.stats.failed++;
              result.files.failed++;
              transformation.errors.push(`${filePath}: ${error}`);
              result.errors.push(`${filePath}: ${error}`);
            }

            result.files.processed++;
          }

          transformSpinner.succeed(`${transformName} transform completed in ${Date.now() - transformStartTime}ms`);
        } catch (error) {
          transformSpinner.fail(`${transformName} transform failed`);
          transformation.errors.push(`Transform error: ${error}`);
          result.errors.push(`Transform error: ${error}`);
          result.success = false;
        }

        transformations.push(transformation);
      }

      // Save transformed files
      if (!options.dryRun) {
        await this.saveTransformedFiles(options.outputPath, options.format, options.prettierConfig);
      }

      // Generate report
      this.report = {
        timestamp: new Date().toISOString(),
        options,
        results: result,
        transformations
      };

      // Save report if path is provided
      if (options.reportPath) {
        await this.saveReport(options.reportPath);
      }

      spinner.succeed(`Migration completed in ${Date.now() - startTime}ms`);

      if (result.errors.length > 0) {
        result.success = false;
        result.message = `Migration completed with ${result.errors.length} errors`;
      }

      result.duration = Date.now() - startTime;
    } catch (error) {
      spinner.fail(`Migration failed: ${error}`);
      result.success = false;
      result.message = `Migration failed: ${error}`;
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  private getTransformDescription(transformName: string): string {
    const descriptions: Record<string, string> = {
      'import-statements': 'Transform import statements to ONEDOT-JS format',
      'component-syntax': 'Transform component syntax to ONEDOT-JS format',
      'state-management': 'Transform state management to ONEDOT-JS format',
      'lifecycle-methods': 'Transform lifecycle methods to ONEDOT-JS format',
      'event-handling': 'Transform event handling to ONEDOT-JS format',
      'routing': 'Transform routing to ONEDOT-JS format',
      'dependency-injection': 'Transform dependency injection to ONEDOT-JS format'
    };

    return descriptions[transformName] || 'Custom transform';
  }

  private async saveTransformedFiles(outputPath: string, format: boolean = true, prettierConfig?: any): Promise<void> {
    if (!this.project) return;

    await fs.ensureDir(outputPath);

    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      const relativePath = path.relative(process.cwd(), filePath);
      const outputFilePath = path.join(outputPath, relativePath);

      // Create output directory if it doesn't exist
      await fs.ensureDir(path.dirname(outputFilePath));

      // Get transformed code
      let code = sourceFile.getFullText();

      // Format code if requested
      if (format) {
        try {
          const parser = path.extname(filePath) === '.tsx' || path.extname(filePath) === '.jsx'
            ? 'babel'
            : 'typescript';

          code = prettier.format(code, {
            parser,
            ...prettierConfig
          });
        } catch (error) {
          console.warn(chalk.yellow(`Error formatting file ${filePath}: ${error}`));
        }
      }

      // Save file
      await fs.writeFile(outputFilePath, code);
    }
  }

  private async saveReport(reportPath: string): Promise<void> {
    if (!this.report) return;

    await fs.ensureDir(path.dirname(reportPath));

    const ext = path.extname(reportPath);

    if (ext === '.json') {
      await fs.writeFile(reportPath, JSON.stringify(this.report, null, 2));
    } else if (ext === '.yml' || ext === '.yaml') {
      await fs.writeFile(reportPath, yaml.stringify(this.report));
    } else {
      await fs.writeFile(reportPath, JSON.stringify(this.report, null, 2));
    }
  }

  public getReport(): MigrationReport | null {
    return this.report;
  }

  // Default transform implementations
  private async transformImports(sourceFile: SourceFile, project: Project): Promise<TransformResult> {
    const result: TransformResult = {
      transformed: false,
      sourceFile
    };

    try {
      // Find all import declarations
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDeclaration of importDeclarations) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

        // Transform framework-specific imports
        if (moduleSpecifier.startsWith('@angular/')) {
          // Transform Angular imports to ONEDOT-JS
          const newModuleSpecifier = this.transformAngularImport(moduleSpecifier);
          importDeclaration.setModuleSpecifier(newModuleSpecifier);
          result.transformed = true;
        } else if (moduleSpecifier.startsWith('react')) {
          // Transform React imports to ONEDOT-JS
          const newModuleSpecifier = this.transformReactImport(moduleSpecifier);
          importDeclaration.setModuleSpecifier(newModuleSpecifier);
          result.transformed = true;
        } else if (moduleSpecifier.startsWith('vue')) {
          // Transform Vue imports to ONEDOT-JS
          const newModuleSpecifier = this.transformVueImport(moduleSpecifier);
          importDeclaration.setModuleSpecifier(newModuleSpecifier);
          result.transformed = true;
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private transformAngularImport(moduleSpecifier: string): string {
    const importMap: Record<string, string> = {
      '@angular/core': '@onedot/core',
      '@angular/common': '@onedot/common',
      '@angular/router': '@onedot/router',
      '@angular/forms': '@onedot/forms'
    };

    return importMap[moduleSpecifier] || moduleSpecifier;
  }

  private transformReactImport(moduleSpecifier: string): string {
    const importMap: Record<string, string> = {
      'react': '@onedot/core',
      'react-dom': '@onedot/dom',
      'react-router': '@onedot/router',
      'react-redux': '@onedot/state'
    };

    return importMap[moduleSpecifier] || moduleSpecifier;
  }

  private transformVueImport(moduleSpecifier: string): string {
    const importMap: Record<string, string> = {
      'vue': '@onedot/core',
      'vue-router': '@onedot/router',
      'vuex': '@onedot/state'
    };

    return importMap[moduleSpecifier] || moduleSpecifier;
  }

  private async transformComponentSyntax(sourceFile: SourceFile, project: Project): Promise<TransformResult> {
    const result: TransformResult = {
      transformed: false,
      sourceFile
    };

    try {
      // This is a simplified implementation
      // In a real implementation, you would transform component syntax
      // based on the source framework

      // Find class declarations with component decorators
      const classes = sourceFile.getClasses();

      for (const classDeclaration of classes) {
        const decorators = classDeclaration.getDecorators();

        for (const decorator of decorators) {
          const decoratorName = decorator.getName();

          if (decoratorName === 'Component' || decoratorName === 'Directive') {
            // Transform Angular component/directive to ONEDOT-JS component
            this.transformAngularComponent(classDeclaration, decorator);
            result.transformed = true;
          }
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private transformAngularComponent(classDeclaration: any, decorator: any): void {
    // This is a simplified implementation
    // In a real implementation, you would transform Angular component
    // to ONEDOT-JS component

    // Remove Angular decorator
    decorator.remove();

    // Add ONEDOT-JS component decorator
    classDeclaration.addDecorator({
      name: 'Component',
      arguments: []
    });
  }

  private async transformStateManagement(sourceFile: SourceFile, project: Project): Promise<TransformResult> {
    const result: TransformResult = {
      transformed: false,
      sourceFile
    };

    try {
      // This is a simplified implementation
      // In a real implementation, you would transform state management
      // based on the source framework

      // Find service classes
      const classes = sourceFile.getClasses();

      for (const classDeclaration of classes) {
        const decorators = classDeclaration.getDecorators();

        for (const decorator of decorators) {
          const decoratorName = decorator.getName();

          if (decoratorName === 'Injectable') {
            // Transform Angular service to ONEDOT-JS service
            this.transformAngularService(classDeclaration, decorator);
            result.transformed = true;
          }
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private transformAngularService(classDeclaration: any, decorator: any): void {
    // This is a simplified implementation
    // In a real implementation, you would transform Angular service
    // to ONEDOT-JS service

    // Remove Angular decorator
    decorator.remove();

    // Add ONEDOT-JS service decorator
    classDeclaration.addDecorator({
      name: 'Service',
      arguments: []
    });
  }

  private async transformLifecycleMethods(sourceFile: SourceFile, project: Project): Promise<TransformResult> {
    const result: TransformResult = {
      transformed: false,
      sourceFile
    };

    try {
      // This is a simplified implementation
      // In a real implementation, you would transform lifecycle methods
      // based on the source framework

      // Find class methods
      const classes = sourceFile.getClasses();

      for (const classDeclaration of classes) {
        const methods = classDeclaration.getMethods();

        for (const method of methods) {
          const methodName = method.getName();

          // Transform Angular lifecycle methods
          if (methodName === 'ngOnInit' || methodName === 'ngOnDestroy') {
            // Transform to ONEDOT-JS lifecycle methods
            this.transformAngularLifecycleMethod(method);
            result.transformed = true;
          }
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private transformAngularLifecycleMethod(method: any): void {
    // This is a simplified implementation
    // In a real implementation, you would transform Angular lifecycle method
    // to ONEDOT-JS lifecycle method

    const methodName = method.getName();

    if (methodName === 'ngOnInit') {
      method.rename('onMounted');
    } else if (methodName === 'ngOnDestroy') {
      method.rename('onUnmounted');
    }
  }

  private async transformEventHandling(sourceFile: SourceFile, project: Project): Promise<TransformResult> {
    const result: TransformResult = {
      transformed: false,
      sourceFile
    };

    try {
      // This is a simplified implementation
      // In a real implementation, you would transform event handling
      // based on the source framework

      // Find event bindings in templates
      // This would require parsing HTML templates

      // For now, we'll just look for event handler methods in classes
      const classes = sourceFile.getClasses();

      for (const classDeclaration of classes) {
        const methods = classDeclaration.getMethods();

        for (const method of methods) {
          const methodName = method.getName();

          // Transform Angular event handlers
          if (methodName.startsWith('on')) {
            // Transform to ONEDOT-JS event handlers
            this.transformAngularEventHandler(method);
            result.transformed = true;
          }
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private transformAngularEventHandler(method: any): void {
    // This is a simplified implementation
    // In a real implementation, you would transform Angular event handler
    // to ONEDOT-JS event handler

    // No transformation needed for now
  }

  private async transformRouting(sourceFile: SourceFile, project: Project): Promise<TransformResult> {
    const result: TransformResult = {
      transformed: false,
      sourceFile
    };

    try {
      // This is a simplified implementation
      // In a real implementation, you would transform routing
      // based on the source framework

      // Find routing module imports
      const importDeclarations = sourceFile.getImportDeclarations();

      for (const importDeclaration of importDeclarations) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

        if (moduleSpecifier === '@angular/router') {
          // Transform Angular router imports to ONEDOT-JS router imports
          importDeclaration.setModuleSpecifier('@onedot/router');
          result.transformed = true;
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private async transformDependencyInjection(sourceFile: SourceFile, project: Project): Promise<TransformResult> {
    const result: TransformResult = {
      transformed: false,
      sourceFile
    };

    try {
      // This is a simplified implementation
      // In a real implementation, you would transform dependency injection
      // based on the source framework

      // Find constructor parameters
      const classes = sourceFile.getClasses();

      for (const classDeclaration of classes) {
        const constructor = classDeclaration.getConstructor();

        if (constructor) {
          const parameters = constructor.getParameters();

          for (const parameter of parameters) {
            // Transform Angular dependency injection
            const decorators = parameter.getDecorators();

            for (const decorator of decorators) {
              const decoratorName = decorator.getName();

              if (decoratorName === 'Inject') {
                // Transform Angular Inject decorator to ONEDOT-JS Inject decorator
                this.transformAngularInjectDecorator(decorator);
                result.transformed = true;
              }
            }
          }
        }
      }
    } catch (error) {
      result.errors = [error.message];
    }

    return result;
  }

  private transformAngularInjectDecorator(decorator: any): void {
    // This is a simplified implementation
    // In a real implementation, you would transform Angular Inject decorator
    // to ONEDOT-JS Inject decorator

    // No transformation needed for now
  }
}
