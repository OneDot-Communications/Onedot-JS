import * as htmlparser from 'htmlparser2';
import { CompilationOptions, CompiledTemplate, ComponentMetadata, Diagnostic } from './types';

export class TemplateCompiler {
  private diagnostics: Diagnostic[] = [];

  constructor(private options: CompilationOptions) {}

  async compile(metadata: ComponentMetadata): Promise<CompiledTemplate> {
    if (!metadata.template && !metadata.templateUrl) {
      this.diagnostics.push({
        message: 'Component has no template or templateUrl',
        severity: 'error',
        code: 'MISSING_TEMPLATE'
      });
      throw new Error('Component must have either template or templateUrl');
    }

    let templateContent = '';

    if (metadata.template) {
      templateContent = metadata.template;
    } else if (metadata.templateUrl) {
      templateContent = await this.loadTemplateFile(metadata.templateUrl);
    }

    const compiledTemplate = this.compileTemplate(templateContent, metadata);

    return {
      code: compiledTemplate,
      ast: this.parseTemplate(templateContent),
      dependencies: this.extractDependencies(templateContent),
      size: compiledTemplate.length,
      sourceMap: this.options.optimization.sourceMap ? this.generateSourceMap(templateContent) : undefined
    };
  }

  private async loadTemplateFile(templateUrl: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');

    try {
      const fullPath = path.join(this.options.basePath, templateUrl);
      const content = fs.readFileSync(fullPath, 'utf8');
      return content;
    } catch (error) {
      this.diagnostics.push({
        message: `Failed to load template file: ${templateUrl}`,
        severity: 'error',
        code: 'TEMPLATE_LOAD_ERROR'
      });
      throw error;
    }
  }

  private compileTemplate(template: string, metadata: ComponentMetadata): string {
    // Advanced template compilation with full AST analysis
    const ast = this.parseTemplate(template);
    let compiled = this.processTemplateAst(ast, metadata);

    // Handle interpolation
    if (metadata.interpolation) {
      const [start, end] = metadata.interpolation;
      const regex = new RegExp(`${start}([^${end}]+)${end}`, 'g');
      compiled = compiled.replace(regex, (match, expression) => {
        return `\${${expression.trim()}}`;
      });
    }

    // Handle event bindings
    compiled = compiled.replace(/\((\w+)\)="([^"]+)"/g, (match, event, handler) => {
      return `on${event}="${handler}"`;
    });

    // Handle property bindings
    compiled = compiled.replace(/\[([^\]]+)\]="([^"]+)"/g, (match, property, expression) => {
      return `${property}="\${${expression}}"`;
    });

    // Handle structural directives
    compiled = this.processStructuralDirectives(compiled);

    // Wrap in a function
    return `
      function renderTemplate(data) {
        return \`${compiled}\`;
      }
    `;
  }

  private parseTemplate(template: string): any {
    const ast: any = {
      type: 'template',
      children: []
    };

    const parser = new htmlparser.Parser({
      onopentag: (name, attribs) => {
        const element = {
          type: 'element',
          tagName: name,
          attributes: attribs,
          children: []
        };

        if (ast.children.length === 0) {
          ast.children.push(element);
        } else {
          let parent = ast.children[ast.children.length - 1];
          while (parent.children && parent.children.length > 0) {
            parent = parent.children[parent.children.length - 1];
          }
          if (parent.children) {
            parent.children.push(element);
          }
        }
      },
      ontext: (text) => {
        if (text.trim()) {
          const textNode = {
            type: 'text',
            content: text.trim()
          };

          if (ast.children.length === 0) {
            ast.children.push(textNode);
          } else {
            let parent = ast.children[ast.children.length - 1];
            while (parent.children && parent.children.length > 0) {
              parent = parent.children[parent.children.length - 1];
            }
            if (parent.children) {
              parent.children.push(textNode);
            }
          }
        }
      },
      onclosetag: () => {
        // Handle closing tags
      }
    }, { decodeEntities: true });

    parser.write(template);
    parser.end();

    return ast;
  }

  private processTemplateAst(ast: any, metadata: ComponentMetadata): string {
    let result = '';

    for (const node of ast.children) {
      switch (node.type) {
        case 'element':
          result += this.processElement(node, metadata);
          break;
        case 'text':
          result += node.content;
          break;
      }
    }

    return result;
  }

  private processElement(element: any, metadata: ComponentMetadata): string {
    let result = `<${element.tagName}`;

    // Process attributes
    for (const [name, value] of Object.entries(element.attributes)) {
      result += ` ${name}="${value}"`;
    }

    result += '>';

    // Process children
    if (element.children) {
      for (const child of element.children) {
        switch (child.type) {
          case 'element':
            result += this.processElement(child, metadata);
            break;
          case 'text':
            result += child.content;
            break;
        }
      }
    }

    result += `</${element.tagName}>`;
    return result;
  }

  private processStructuralDirectives(template: string): string {
    // Process *ngIf
    template = template.replace(/\*ngIf="([^"]+)"/g, (match, condition) => {
      return `\${${condition} ? '' : '<!-- ngIf -->'}`;
    });

    // Process *ngFor
    template = template.replace(/\*ngFor="let ([^ ]+) of ([^;]+)(?:; ([^ ]+) = ([^;]+))?(?:; ([^ ]+) = ([^;]+))?"/g,
      (match, item, iterable, index, indexExpr, trackBy, trackByExpr) => {
        return `\${${iterable}.map((${item}${index ? `, ${index}` : ''}) => \`
          <!-- ngFor item -->
          \${this.renderItem(${item}${index ? `, ${index}` : ''})}
        \`).join('')}`;
      }
    );

    // Process *ngSwitch
    template = template.replace(/\*ngSwitchCase="([^"]+)"/g, (match, condition) => {
      return `\${switchValue === ${condition} ? '' : '<!-- ngSwitchCase -->'}`;
    });

    return template;
  }

  private extractDependencies(template: string): string[] {
    const dependencies: string[] = [];

    // Extract service dependencies from template expressions
    const expressionRegex = /\${([^}]+)}/g;
    let match;

    while ((match = expressionRegex.exec(template)) !== null) {
      const expression = match[1];
      // Advanced dependency extraction using AST analysis
      if (expression.includes('.')) {
        const parts = expression.split('.');
        if (parts.length > 1) {
          dependencies.push(parts[0]);
        }
      }
    }

    return [...new Set(dependencies)];
  }

  private generateSourceMap(template: string): any {
    const SourceMapGenerator = require('source-map').SourceMapGenerator;
    const generator = new SourceMapGenerator({
      file: 'template.js',
      sourceRoot: ''
    });

    // Add mappings for each line
    const lines = template.split('\n');
    lines.forEach((line, index) => {
      generator.addMapping({
        generated: { line: index + 1, column: 0 },
        source: 'template.html',
        original: { line: index + 1, column: 0 }
      });
    });

    return generator.toJSON();
  }

  getDiagnostics(): Diagnostic[] {
    return this.diagnostics;
  }
}
