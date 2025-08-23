import { ClassDeclaration, Decorator, SourceFile } from 'ts-morph';
import { MetadataGenerator } from './metadata-generator';
import { StyleCompiler } from './style-compiler';
import { TemplateCompiler } from './template-compiler';
import { CompilationOptions, CompiledComponent, Diagnostic } from './types';
import { generateComponentId } from './utils';

export class ComponentCompiler {
  private templateCompiler: TemplateCompiler;
  private styleCompiler: StyleCompiler;
  private metadataGenerator: MetadataGenerator;
  private diagnostics: Diagnostic[] = [];

  constructor(private options: CompilationOptions) {
    this.templateCompiler = new TemplateCompiler(options);
    this.styleCompiler = new StyleCompiler(options);
    this.metadataGenerator = new MetadataGenerator();
  }

  async compile(sourceFile: SourceFile): Promise<CompiledComponent | null> {
    const componentClass = this.findComponentClass(sourceFile);
    if (!componentClass) {
      this.diagnostics.push({
        message: `No component decorator found in ${sourceFile.getFilePath()}`,
        severity: 'warning',
        code: 'NO_COMPONENT_DECORATOR',
        file: sourceFile.getFilePath()
      });
      return null;
    }

    const componentDecorator = this.getComponentDecorator(componentClass);
    if (!componentDecorator) {
      this.diagnostics.push({
        message: `Component class has no @Component decorator`,
        severity: 'error',
        code: 'MISSING_COMPONENT_DECORATOR',
        file: sourceFile.getFilePath()
      });
      return null;
    }

    try {
      const metadata = this.metadataGenerator.generate(componentDecorator);
      const template = await this.templateCompiler.compile(metadata);
      const styles = await this.styleCompiler.compile(metadata);
      const className = componentClass.getName() || 'AnonymousComponent';

      return {
        metadata,
        template,
        styles,
        className,
        dependencies: this.extractDependencies(componentClass),
        size: this.calculateSize(template, styles),
        id: generateComponentId(className, sourceFile.getFilePath())
      };
    } catch (error) {
      this.diagnostics.push({
        message: `Failed to compile component: ${error.message}`,
        severity: 'error',
        code: 'COMPONENT_COMPILATION_ERROR',
        file: sourceFile.getFilePath()
      });
      return null;
    }
  }

  private findComponentClass(sourceFile: SourceFile): ClassDeclaration | undefined {
    return sourceFile.getClasses().find(cls =>
      cls.getDecorators().some(dec => dec.getName() === 'Component')
    );
  }

  private getComponentDecorator(componentClass: ClassDeclaration): Decorator | undefined {
    return componentClass.getDecorators().find(dec => dec.getName() === 'Component');
  }

  private extractDependencies(componentClass: ClassDeclaration): string[] {
    const dependencies: string[] = [];

    // Extract constructor dependencies
    const constructor = componentClass.getConstructor();
    if (constructor) {
      constructor.getParameters().forEach(param => {
        const type = param.getType();
        const symbol = type.getSymbol();
        if (symbol) {
          dependencies.push(symbol.getName());
        }
      });
    }

    // Extract property dependencies
    componentClass.getProperties().forEach(prop => {
      const type = prop.getType();
      const symbol = type.getSymbol();
      if (symbol) {
        dependencies.push(symbol.getName());
      }
    });

    // Extract method dependencies
    componentClass.getMethods().forEach(method => {
      const returnType = method.getReturnType();
      const symbol = returnType.getSymbol();
      if (symbol) {
        dependencies.push(symbol.getName());
      }
    });

    return [...new Set(dependencies)];
  }

  private calculateSize(template: any, styles: any[]): number {
    const templateSize = template.code.length;
    const stylesSize = styles.reduce((sum, style) => sum + style.code.length, 0);
    return templateSize + stylesSize;
  }

  getDiagnostics(): Diagnostic[] {
    return this.diagnostics;
  }
}
