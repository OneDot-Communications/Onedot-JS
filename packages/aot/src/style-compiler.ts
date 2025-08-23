import * as csstree from 'css-tree';
import { CompilationOptions, CompiledStyle, ComponentMetadata, Diagnostic } from './types';
import { generateComponentId } from './utils';

export class StyleCompiler {
  private diagnostics: Diagnostic[] = [];

  constructor(private options: CompilationOptions) {}

  async compile(metadata: ComponentMetadata): Promise<CompiledStyle[]> {
    const styles: CompiledStyle[] = [];

    if (metadata.styles && metadata.styles.length > 0) {
      for (const style of metadata.styles) {
        styles.push(await this.compileStyleString(style, metadata));
      }
    }

    if (metadata.styleUrls && metadata.styleUrls.length > 0) {
      for (const styleUrl of metadata.styleUrls) {
        const styleContent = await this.loadStyleFile(styleUrl);
        styles.push(await this.compileStyleString(styleContent, metadata));
      }
    }

    return styles;
  }

  private async loadStyleFile(styleUrl: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');

    try {
      const fullPath = path.join(this.options.basePath, styleUrl);
      const content = fs.readFileSync(fullPath, 'utf8');
      return content;
    } catch (error) {
      this.diagnostics.push({
        message: `Failed to load style file: ${styleUrl}`,
        severity: 'error',
        code: 'STYLE_LOAD_ERROR'
      });
      throw error;
    }
  }

  private async compileStyleString(style: string, metadata: ComponentMetadata): Promise<CompiledStyle> {
    let compiledStyle = style;

    // Parse CSS into AST
    const ast = this.parseCss(style);

    // Apply encapsulation
    switch (metadata.encapsulation) {
      case 'shadowdom':
        compiledStyle = this.applyShadowDomEncapsulation(compiledStyle, metadata);
        break;
      case 'emulated':
        compiledStyle = this.applyEmulatedEncapsulation(compiledStyle, metadata);
        break;
      case 'none':
      default:
        // No encapsulation
        break;
    }

    // Apply optimizations
    if (this.options.optimization.enableMinification) {
      compiledStyle = this.minifyCss(compiledStyle);
    }

    return {
      code: compiledStyle,
      dependencies: this.extractDependencies(compiledStyle),
      encapsulation: metadata.encapsulation || 'none',
      sourceMap: this.options.optimization.sourceMap ? this.generateSourceMap(style) : undefined,
      id: generateComponentId(metadata.selector, '')
    };
  }

  private parseCss(css: string): any {
    try {
      return csstree.parse(css);
    } catch (error) {
      this.diagnostics.push({
        message: `Failed to parse CSS: ${error.message}`,
        severity: 'error',
        code: 'CSS_PARSE_ERROR'
      });
      throw error;
    }
  }

  private applyShadowDomEncapsulation(style: string, metadata: ComponentMetadata): string {
    // For Shadow DOM, styles are automatically scoped
    return style;
  }

  private applyEmulatedEncapsulation(style: string, metadata: ComponentMetadata): string {
    // For emulated encapsulation, add component-specific attribute selectors
    const selector = `[${metadata.selector}]`;
    const ast = this.parseCss(style);

    // Transform the AST to add scoping
    this.transformCssAst(ast, selector);

    // Generate CSS from transformed AST
    return csstree.generate(ast);
  }

  private transformCssAst(ast: any, selector: string): void {
    if (ast.type === 'StyleSheet') {
      if (ast.children) {
        ast.children.forEach((rule: any) => {
          if (rule.type === 'Rule') {
            this.transformRule(rule, selector);
          }
        });
      }
    }
  }

  private transformRule(rule: any, selector: string): void {
    if (rule.prelude && rule.prelude.type === 'SelectorList') {
      const newSelectors = [];

      for (const selectorItem of rule.prelude.children) {
        if (selectorItem.type === 'Selector') {
          const newSelector = this.transformSelector(selectorItem, selector);
          newSelectors.push(newSelector);
        }
      }

      rule.prelude.children = newSelectors;
    }
  }

  private transformSelector(selector: any, componentSelector: string): any {
    const newSelector = {
      type: 'Selector',
      children: []
    };

    // Add component selector to the beginning
    newSelector.children.push({
      type: 'TypeSelector',
      name: componentSelector
    });

    // Add a combinator and space
    newSelector.children.push({
      type: 'Combinator',
      name: ' '
    });

    // Add the original selector
    if (selector.children) {
      newSelector.children.push(...selector.children);
    }

    return newSelector;
  }

  private minifyCss(css: string): string {
    try {
      const CleanCSS = require('clean-css');
      return new CleanCSS({
        level: {
          1: {
            specialComments: 0
          },
          2: {
            restructureRules: true
          }
        }
      }).minify(css).styles;
    } catch (error) {
      this.diagnostics.push({
        message: `Failed to minify CSS: ${error.message}`,
        severity: 'warning',
        code: 'CSS_MINIFICATION_ERROR'
      });
      return css;
    }
  }

  private extractDependencies(style: string): string[] {
    const dependencies: string[] = [];

    // Extract dependencies from url() references
    const urlRegex = /url\(['"]?([^'"()]+)['"]?\)/g;
    let match;

    while ((match = urlRegex.exec(style)) !== null) {
      dependencies.push(match[1]);
    }

    // Extract dependencies from @import rules
    const importRegex = /@import\s+(?:url\()?['"]?([^'"()]+)['"]?(?:\))?;/g;
    while ((match = importRegex.exec(style)) !== null) {
      dependencies.push(match[1]);
    }

    return [...new Set(dependencies)];
  }

  private generateSourceMap(style: string): any {
    const SourceMapGenerator = require('source-map').SourceMapGenerator;
    const generator = new SourceMapGenerator({
      file: 'style.css',
      sourceRoot: ''
    });

    // Add mappings for each line
    const lines = style.split('\n');
    lines.forEach((line, index) => {
      generator.addMapping({
        generated: { line: index + 1, column: 0 },
        source: 'style.scss',
        original: { line: index + 1, column: 0 }
      });
    });

    return generator.toJSON();
  }

  getDiagnostics(): Diagnostic[] {
    return this.diagnostics;
  }
}
