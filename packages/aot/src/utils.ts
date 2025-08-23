import * as csstree from 'css-tree';
import * as htmlparser from 'htmlparser2';
import MagicString from 'magic-string';
import { SourceMapGenerator } from 'source-map';
import { Project } from 'ts-morph';

export function parseComponentDecorator(sourceCode: string): any {
  const project = new Project();
  const sourceFile = project.createSourceFile('temp.ts', sourceCode);

  const componentClass = sourceFile.getClasses().find(cls =>
    cls.getDecorators().some(dec => dec.getName() === 'Component')
  );

  if (!componentClass) {
    throw new Error('No component decorator found');
  }

  const decorator = componentClass.getDecorator('Component');
  if (!decorator) {
    throw new Error('Component decorator not found');
  }

  return decorator;
}

export function extractTemplate(decorator: any): string {
  const config = decorator.getArguments()[0];
  if (!config) return '';

  const templateProperty = config.getProperty('template');
  if (templateProperty) {
    return templateProperty.getInitializer()?.getLiteralValue() || '';
  }

  return '';
}

export function extractStyles(decorator: any): string[] {
  const config = decorator.getArguments()[0];
  if (!config) return [];

  const stylesProperty = config.getProperty('styles');
  if (stylesProperty) {
    const initializer = stylesProperty.getInitializer();
    if (initializer && initializer.isKind(237)) { // SyntaxKind.ArrayLiteralExpression
      return initializer.getElements().map(element =>
        element.isKind(10) ? element.getLiteralValue() : ''
      );
    }
  }

  return [];
}

export function generateSourceMap(originalCode: string, generatedCode: string): any {
  const generator = new SourceMapGenerator({
    file: 'generated.js',
    sourceRoot: ''
  });

  // Simple source map generation - in practice you'd need more sophisticated mapping
  generator.addMapping({
    generated: { line: 1, column: 0 },
    source: 'original.ts',
    original: { line: 1, column: 0 }
  });

  return generator.toJSON();
}

export function minifyCode(code: string): string {
  const magicString = new MagicString(code);

  // Remove comments
  magicString.replace(/\/\*[\s\S]*?\*\//g, '');
  magicString.replace(/\/\/.*$/gm, '');

  // Remove extra whitespace
  magicString.replace(/\s+/g, ' ');
  magicString.replace(/\s*([{}();,:])\s*/g, '$1');

  return magicString.toString();
}

export function parseHtml(html: string): any {
  const ast: any = {
    type: 'document',
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

  parser.write(html);
  parser.end();

  return ast;
}

export function parseCss(css: string): any {
  try {
    return csstree.parse(css);
  } catch (error) {
    throw new Error(`Failed to parse CSS: ${error.message}`);
  }
}

export function generateComponentId(className: string, filePath: string): string {
  const path = require('path');
  const basename = path.basename(filePath, path.extname(filePath));
  return `${basename}-${className}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}
