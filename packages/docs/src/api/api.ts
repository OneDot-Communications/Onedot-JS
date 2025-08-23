import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';
import * as yaml from 'yaml';
import { DocumentationGenerator } from '../generator';

export interface APIEntry {
  name: string;
  type: 'class' | 'interface' | 'function' | 'variable' | 'type' | 'enum';
  description?: string;
  signature?: string;
  parameters?: Parameter[];
  returns?: ReturnType;
  properties?: Property[];
  methods?: Method[];
  events?: Event[];
  examples?: Example[];
  deprecated?: boolean;
  since?: string;
  seeAlso?: string[];
  source?: {
    file: string;
    line: number;
  };
}

export interface Parameter {
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
  defaultValue?: any;
}

export interface ReturnType {
  type: string;
  description?: string;
}

export interface Property {
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
  defaultValue?: any;
  readonly?: boolean;
}

export interface Method {
  name: string;
  signature?: string;
  description?: string;
  parameters?: Parameter[];
  returns?: ReturnType;
  examples?: Example[];
  deprecated?: boolean;
  since?: string;
}

export interface Event {
  name: string;
  description?: string;
  parameters?: Parameter[];
  examples?: Example[];
  since?: string;
}

export interface Example {
  description?: string;
  code: string;
  language?: string;
}

export class APIDocumentation {
  private generator: DocumentationGenerator;
  private entries: Map<string, APIEntry> = new Map();
  private categories: Map<string, string[]> = new Map();
  private loaded = false;

  constructor(generator?: DocumentationGenerator) {
    this.generator = generator || new DocumentationGenerator();
  }

  public async load(sourcePath: string): Promise<void> {
    if (this.loaded) return;

    // Load API entries from TypeScript files
    await this.loadFromTypeScript(sourcePath);

    // Load additional metadata from YAML files
    await this.loadFromYAML(path.join(sourcePath, 'api'));

    // Categorize entries
    this.categorizeEntries();

    this.loaded = true;
  }

  private async loadFromTypeScript(sourcePath: string): Promise<void> {
    // Find all TypeScript files
    const files = glob.sync('**/*.ts', {
      cwd: sourcePath,
      ignore: ['**/*.d.ts', '**/node_modules/**', '**/dist/**', '**/test/**', '**/spec/**']
    });

    // Parse each file for API entries
    for (const file of files) {
      const filePath = path.join(sourcePath, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Extract API entries using AST parsing
      const entries = this.parseTypeScriptFile(content, file);

      // Add entries to the map
      entries.forEach(entry => {
        this.entries.set(entry.name, entry);
      });
    }
  }

  private parseTypeScriptFile(content: string, file: string): APIEntry[] {
    // This is a simplified implementation
    // In a real implementation, you would use TypeScript compiler API to parse the file

    const entries: APIEntry[] = [];

    // Extract exports
    const exportRegex = /export\s+(class|interface|function|const|let|var|type|enum)\s+(\w+)/g;
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      const type = match[1] as APIEntry['type'];
      const name = match[2];

      const entry: APIEntry = {
        name,
        type,
        source: {
          file,
          line: content.substring(0, match.index).split('\n').length
        }
      };

      // Extract JSDoc comments
      const jsdocMatch = this.extractJSDoc(content, match.index);
      if (jsdocMatch) {
        entry.description = jsdocMatch.description;
        entry.deprecated = jsdocMatch.deprecated;
        entry.since = jsdocMatch.since;
        entry.examples = jsdocMatch.examples;
        entry.seeAlso = jsdocMatch.seeAlso;
      }

      // Extract signature for functions and methods
      if (type === 'function') {
        const signatureMatch = content.substring(match.index).match(/function\s+\w+\s*\(([^)]*)\)/);
        if (signatureMatch) {
          entry.signature = `function ${name}(${signatureMatch[1]})`;

          // Parse parameters
          const params = signatureMatch[1].split(',').filter(p => p.trim());
          if (params.length > 0) {
            entry.parameters = params.map(param => {
              const [name, type] = param.split(':').map(p => p.trim());
              return {
                name,
                type: type || 'any'
              };
            });
          }
        }
      }

      // Extract properties for interfaces and classes
      if (type === 'interface' || type === 'class') {
        const classMatch = content.substring(match.index).match(/(?:class|interface)\s+\w+\s*{([^}]*)}/);
        if (classMatch) {
          const properties = this.parseProperties(classMatch[1]);
          if (properties.length > 0) {
            entry.properties = properties;
          }

          // Extract methods
          const methods = this.parseMethods(classMatch[1]);
          if (methods.length > 0) {
            entry.methods = methods;
          }
        }
      }

      entries.push(entry);
    }

    return entries;
  }

  private extractJSDoc(content: string, index: number): {
    description?: string;
    deprecated?: boolean;
    since?: string;
    examples?: Example[];
    seeAlso?: string[];
  } {
    // Find JSDoc comment before the export
    const lines = content.substring(0, index).split('\n');
    const jsdocLines: string[] = [];
    let inJSDoc = false;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();

      if (line === '/**') {
        inJSDoc = true;
        continue;
      }

      if (line === '*/' && inJSDoc) {
        break;
      }

      if (inJSDoc) {
        jsdocLines.unshift(line.replace(/^\s*\*\s?/, ''));
      }
    }

    if (jsdocLines.length === 0) {
      return {};
    }

    const result: any = {};
    let currentExample: Example | null = null;

    for (const line of jsdocLines) {
      // Description
      if (!line.startsWith('@')) {
        if (!result.description) {
          result.description = line;
        } else {
          result.description += ' ' + line;
        }
        continue;
      }

      // Tags
      const tagMatch = line.match(/^@(\w+)\s*(.*)$/);
      if (tagMatch) {
        const tag = tagMatch[1];
        const value = tagMatch[2];

        switch (tag) {
          case 'deprecated':
            result.deprecated = true;
            break;

          case 'since':
            result.since = value;
            break;

          case 'example':
            if (!result.examples) {
              result.examples = [];
            }

            if (currentExample) {
              result.examples.push(currentExample);
            }

            currentExample = {
              description: value,
              code: '',
              language: 'typescript'
            };
            break;

          case 'see':
            if (!result.seeAlso) {
              result.seeAlso = [];
            }
            result.seeAlso.push(value);
            break;

          default:
            // Other tags
            break;
        }
      } else if (currentExample) {
        // Continuation of example code
        currentExample.code += line + '\n';
      }
    }

    // Add the last example if exists
    if (currentExample) {
      if (!result.examples) {
        result.examples = [];
      }
      result.examples.push(currentExample);
    }

    return result;
  }

  private parseProperties(content: string): Property[] {
    const properties: Property[] = [];

    // Match property declarations
    const propRegex = /(\w+)\s*:\s*([^;]+);/g;
    let match;

    while ((match = propRegex.exec(content)) !== null) {
      const name = match[1];
      const type = match[2].trim();

      properties.push({
        name,
        type
      });
    }

    return properties;
  }

  private parseMethods(content: string): Method[] {
    const methods: Method[] = [];

    // Match method declarations
    const methodRegex = /(\w+)\s*\(([^)]*)\)\s*[:;]/g;
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      const name = match[1];
      const params = match[2];

      const method: Method = {
        name,
        signature: `${name}(${params})`
      };

      // Parse parameters
      if (params.trim()) {
        const paramList = params.split(',').filter(p => p.trim());
        method.parameters = paramList.map(param => {
          const [name, type] = param.split(':').map(p => p.trim());
          return {
            name,
            type: type || 'any'
          };
        });
      }

      methods.push(method);
    }

    return methods;
  }

  private async loadFromYAML(apiDir: string): Promise<void> {
    if (!await fs.pathExists(apiDir)) return;

    // Find all YAML files
    const files = glob.sync('**/*.yml', {
      cwd: apiDir
    });

    // Parse each YAML file
    for (const file of files) {
      const filePath = path.join(apiDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const data = yaml.parse(content);

      // Update entries with additional metadata
      if (data.entries && Array.isArray(data.entries)) {
        data.entries.forEach((entry: any) => {
          if (entry.name && this.entries.has(entry.name)) {
            const existing = this.entries.get(entry.name)!;
            Object.assign(existing, entry);
          }
        });
      }

      // Add categories
      if (data.categories) {
        Object.entries(data.categories).forEach(([category, entries]) => {
          this.categories.set(category, entries as string[]);
        });
      }
    }
  }

  private categorizeEntries(): void {
    // Default categories
    const defaultCategories = {
      'Core': ['OneDot', 'Component', 'State', 'Router'],
      'Reactivity': ['reactive', 'ref', 'computed', 'watchEffect'],
      'Dependency Injection': ['DIContainer', 'Injectable', 'Inject'],
      'Utilities': ['batch', 'nextTick', 'unref', 'isRef']
    };

    // Add default categories if not already present
    Object.entries(defaultCategories).forEach(([category, entries]) => {
      if (!this.categories.has(category)) {
        this.categories.set(category, entries);
      }
    });

    // Categorize remaining entries
    const uncategorized = Array.from(this.entries.keys())
      .filter(name => !Array.from(this.categories.values()).flat().includes(name));

    if (uncategorized.length > 0 && !this.categories.has('Other')) {
      this.categories.set('Other', uncategorized);
    }
  }

  public getEntries(): APIEntry[] {
    return Array.from(this.entries.values());
  }

  public getEntry(name: string): APIEntry | undefined {
    return this.entries.get(name);
  }

  public getCategories(): Map<string, string[]> {
    return new Map(this.categories);
  }

  public getCategoryEntries(category: string): APIEntry[] {
    const entryNames = this.categories.get(category) || [];
    return entryNames.map(name => this.entries.get(name)).filter(Boolean) as APIEntry[];
  }

  public search(query: string): APIEntry[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.entries.values()).filter(entry => {
      return (
        entry.name.toLowerCase().includes(lowerQuery) ||
        (entry.description && entry.description.toLowerCase().includes(lowerQuery)) ||
        (entry.type && entry.type.toLowerCase().includes(lowerQuery))
      );
    });
  }

  public async generate(outputDir: string): Promise<void> {
    // Create output directory if it doesn't exist
    await fs.ensureDir(outputDir);

    // Generate API overview
    await this.generateOverview(outputDir);

    // Generate category pages
    for (const [category, entryNames] of this.categories) {
      await this.generateCategoryPage(outputDir, category, entryNames);
    }

    // Generate individual entry pages
    for (const entry of this.entries.values()) {
      await this.generateEntryPage(outputDir, entry);
    }

    // Generate search index
    await this.generateSearchIndex(outputDir);
  }

  private async generateOverview(outputDir: string): Promise<void> {
    const content = this.generator.renderTemplate('api-overview', {
      title: 'API Reference',
      categories: Array.from(this.categories.entries()).map(([name, entries]) => ({
        name,
        entries: entries.map(entryName => this.entries.get(entryName)).filter(Boolean)
      }))
    });

    await fs.writeFile(path.join(outputDir, 'index.html'), content);
  }

  private async generateCategoryPage(outputDir: string, category: string, entryNames: string[]): Promise<void> {
    const entries = entryNames.map(name => this.entries.get(name)).filter(Boolean) as APIEntry[];

    const content = this.generator.renderTemplate('api-category', {
      title: `${category} API`,
      category,
      entries
    });

    await fs.writeFile(path.join(outputDir, `${category.toLowerCase().replace(/\s+/g, '-')}.html`), content);
  }

  private async generateEntryPage(outputDir: string, entry: APIEntry): Promise<void> {
    const content = this.generator.renderTemplate('api-entry', {
      title: entry.name,
      entry
    });

    await fs.writeFile(path.join(outputDir, `${entry.name.toLowerCase().replace(/\s+/g, '-')}.html`), content);
  }

  private async generateSearchIndex(outputDir: string): Promise<void> {
    const searchIndex = Array.from(this.entries.values()).map(entry => ({
      name: entry.name,
      type: entry.type,
      description: entry.description || '',
      category: this.getEntryCategory(entry.name) || 'Other'
    }));

    await fs.writeFile(
      path.join(outputDir, 'search-index.json'),
      JSON.stringify(searchIndex, null, 2)
    );
  }

  private getEntryCategory(entryName: string): string | undefined {
    for (const [category, entries] of this.categories) {
      if (entries.includes(entryName)) {
        return category;
      }
    }
    return undefined;
  }
}
