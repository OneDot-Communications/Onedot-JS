import fs from 'node:fs';
import path from 'node:path';

interface ApiItem { 
  file: string; 
  exports: ExportInfo[];
  description?: string;
  examples?: CodeExample[];
}

interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'variable';
  signature?: string;
  description?: string;
  parameters?: ParameterInfo[];
  returnType?: string;
}

interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}

interface CodeExample {
  title: string;
  code: string;
  description?: string;
}

interface DocOptions {
  includePrivate?: boolean;
  outputFormat?: 'json' | 'markdown' | 'html';
  theme?: 'default' | 'dark' | 'minimal';
  includeSource?: boolean;
}

export class DocumentationGenerator {
  private options: Required<DocOptions>;

  constructor(options: DocOptions = {}) {
    this.options = {
      includePrivate: options.includePrivate || false,
      outputFormat: options.outputFormat || 'json',
      theme: options.theme || 'default',
      includeSource: options.includeSource || false
    };
  }

  generateAPI(root: string, outFile: string): void {
    const files: string[] = [];
    this.walk(root, files);
    
    const api: ApiItem[] = [];
    
    for (const f of files) {
      if (!f.endsWith('.ts') && !f.endsWith('.js')) continue;
      
      try {
        const text = fs.readFileSync(f, 'utf8');
        const exports = this.parseExports(text, f);
        
        if (exports.length > 0) {
          const description = this.extractFileDescription(text);
          const examples = this.extractExamples(text);
          
          api.push({ 
            file: path.relative(root, f), 
            exports,
            description,
            examples
          });
        }
      } catch (error) {
        console.warn(`Failed to process ${f}:`, error);
      }
    }

    const documentation = {
      generated: new Date().toISOString(),
      generator: 'ONEDOT Documentation Generator',
      version: '1.0.0',
      api,
      stats: {
        totalFiles: api.length,
        totalExports: api.reduce((sum, item) => sum + item.exports.length, 0),
        fileTypes: this.getFileTypeStats(api)
      }
    };

    switch (this.options.outputFormat) {
      case 'json':
        fs.writeFileSync(outFile, JSON.stringify(documentation, null, 2));
        break;
      case 'markdown':
        fs.writeFileSync(outFile, this.generateMarkdown(documentation));
        break;
      case 'html':
        fs.writeFileSync(outFile, this.generateHTML(documentation));
        break;
    }
  }

  private parseExports(text: string, filePath: string): ExportInfo[] {
    const exports: ExportInfo[] = [];
    
    // Function exports
    const functionMatches = text.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{;]+))?/g);
    for (const match of functionMatches) {
      const [, name, params, returnType] = match;
      exports.push({
        name,
        type: 'function',
        signature: `${name}(${params})${returnType ? `: ${returnType}` : ''}`,
        parameters: this.parseParameters(params),
        returnType: returnType?.trim(),
        description: this.extractJSDoc(text, match.index!)
      });
    }

    // Class exports
    const classMatches = text.matchAll(/export\s+(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+[\w<>]+)?(?:\s+implements\s+[\w<>,\s]+)?/g);
    for (const match of classMatches) {
      const [, name] = match;
      exports.push({
        name,
        type: 'class',
        signature: match[0],
        description: this.extractJSDoc(text, match.index!)
      });
    }

    // Interface exports
    const interfaceMatches = text.matchAll(/export\s+interface\s+(\w+)(?:\s+extends\s+[\w<>,\s]+)?/g);
    for (const match of interfaceMatches) {
      const [, name] = match;
      exports.push({
        name,
        type: 'interface',
        signature: match[0],
        description: this.extractJSDoc(text, match.index!)
      });
    }

    // Type exports
    const typeMatches = text.matchAll(/export\s+type\s+(\w+)(?:<[^>]*>)?\s*=\s*([^;]+);?/g);
    for (const match of typeMatches) {
      const [, name, definition] = match;
      exports.push({
        name,
        type: 'type',
        signature: `type ${name} = ${definition}`,
        description: this.extractJSDoc(text, match.index!)
      });
    }

    // Const/variable exports
    const constMatches = text.matchAll(/export\s+const\s+(\w+)(?:\s*:\s*([^=]+))?\s*=/g);
    for (const match of constMatches) {
      const [, name, type] = match;
      exports.push({
        name,
        type: 'const',
        signature: `const ${name}${type ? `: ${type}` : ''}`,
        description: this.extractJSDoc(text, match.index!)
      });
    }

    return exports.filter(exp => this.options.includePrivate || !exp.name.startsWith('_'));
  }

  private parseParameters(paramString: string): ParameterInfo[] {
    if (!paramString.trim()) return [];
    
    const params: ParameterInfo[] = [];
    const paramParts = paramString.split(',');
    
    for (const part of paramParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      
      const optional = trimmed.includes('?');
      const [nameAndType] = trimmed.split('='); // Remove default values
      const [name, type] = nameAndType.split(':').map(s => s.trim().replace('?', ''));
      
      params.push({
        name: name || 'unknown',
        type: type || 'any',
        optional
      });
    }
    
    return params;
  }

  private extractJSDoc(text: string, position: number): string | undefined {
    const beforePosition = text.substring(0, position);
    const lines = beforePosition.split('\n');
    
    let docLines: string[] = [];
    let inDoc = false;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      
      if (line.endsWith('*/')) {
        inDoc = true;
        const content = line.replace(/\*\/$/, '').replace(/^\*\s?/, '').trim();
        if (content) docLines.unshift(content);
        continue;
      }
      
      if (line.startsWith('/**')) {
        if (inDoc) {
          const content = line.replace(/^\/\*\*\s?/, '').trim();
          if (content) docLines.unshift(content);
          break;
        }
      }
      
      if (inDoc) {
        if (line.startsWith('*')) {
          const content = line.replace(/^\*\s?/, '').trim();
          if (content) docLines.unshift(content);
        } else if (line === '') {
          continue;
        } else {
          break;
        }
      } else if (line !== '') {
        break;
      }
    }
    
    return docLines.length > 0 ? docLines.join(' ') : undefined;
  }

  private extractFileDescription(text: string): string | undefined {
    const firstComment = text.match(/^\/\*\*\s*([\s\S]*?)\*\//);
    if (firstComment) {
      return firstComment[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line && !line.startsWith('@'))
        .join(' ');
    }
    return undefined;
  }

  private extractExamples(text: string): CodeExample[] {
    const examples: CodeExample[] = [];
    const exampleBlocks = text.matchAll(/@example\s+(.*?)(?=@|\*\/|$)/gs);
    
    for (const match of exampleBlocks) {
      const content = match[1].trim();
      const lines = content.split('\n').map(line => line.replace(/^\s*\*\s?/, ''));
      
      let title = 'Example';
      let code = '';
      let description = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('```')) {
          // Extract code block
          i++; // Skip opening ```
          const codeLines: string[] = [];
          while (i < lines.length && !lines[i].trim().startsWith('```')) {
            codeLines.push(lines[i].replace(/^\s*\*\s?/, ''));
            i++;
          }
          code = codeLines.join('\n');
        } else if (i === 0) {
          title = line || title;
        } else {
          description += line + ' ';
        }
      }
      
      examples.push({
        title,
        code,
        description: description.trim() || undefined
      });
    }
    
    return examples;
  }

  private getFileTypeStats(api: ApiItem[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const item of api) {
      for (const exp of item.exports) {
        stats[exp.type] = (stats[exp.type] || 0) + 1;
      }
    }
    
    return stats;
  }

  private generateMarkdown(documentation: any): string {
    let md = `# ONEDOT Framework API Documentation\n\n`;
    md += `Generated: ${documentation.generated}\n\n`;
    md += `## Statistics\n\n`;
    md += `- **Total Files**: ${documentation.stats.totalFiles}\n`;
    md += `- **Total Exports**: ${documentation.stats.totalExports}\n\n`;
    
    md += `### Export Types\n\n`;
    for (const [type, count] of Object.entries(documentation.stats.fileTypes)) {
      md += `- **${type}**: ${count}\n`;
    }
    md += '\n';

    md += `## API Reference\n\n`;
    
    for (const item of documentation.api) {
      md += `### ${item.file}\n\n`;
      
      if (item.description) {
        md += `${item.description}\n\n`;
      }
      
      for (const exp of item.exports) {
        md += `#### \`${exp.name}\` (${exp.type})\n\n`;
        
        if (exp.description) {
          md += `${exp.description}\n\n`;
        }
        
        if (exp.signature) {
          md += `\`\`\`typescript\n${exp.signature}\n\`\`\`\n\n`;
        }
        
        if (exp.parameters && exp.parameters.length > 0) {
          md += `**Parameters:**\n\n`;
          for (const param of exp.parameters) {
            md += `- \`${param.name}\` (\`${param.type}\`)${param.optional ? ' *optional*' : ''}\n`;
            if (param.description) {
              md += `  ${param.description}\n`;
            }
          }
          md += '\n';
        }
        
        if (exp.returnType) {
          md += `**Returns:** \`${exp.returnType}\`\n\n`;
        }
      }
      
      if (item.examples && item.examples.length > 0) {
        md += `**Examples:**\n\n`;
        for (const example of item.examples) {
          md += `##### ${example.title}\n\n`;
          if (example.description) {
            md += `${example.description}\n\n`;
          }
          md += `\`\`\`typescript\n${example.code}\n\`\`\`\n\n`;
        }
      }
      
      md += '---\n\n';
    }
    
    return md;
  }

  private generateHTML(documentation: any): string {
    const css = this.getThemeCSS();
    
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ONEDOT Framework API Documentation</title>
    <style>${css}</style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>ONEDOT Framework API Documentation</h1>
            <p>Generated: ${documentation.generated}</p>
        </header>
        
        <div class="stats">
            <h2>Statistics</h2>
            <div class="stat-grid">
                <div class="stat-item">
                    <span class="stat-value">${documentation.stats.totalFiles}</span>
                    <span class="stat-label">Files</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${documentation.stats.totalExports}</span>
                    <span class="stat-label">Exports</span>
                </div>
            </div>
        </div>
        
        <nav class="navigation">
            <h3>Quick Navigation</h3>
            <ul>`;
    
    for (const item of documentation.api) {
      html += `<li><a href="#${item.file.replace(/[^a-zA-Z0-9]/g, '-')}">${item.file}</a></li>`;
    }
    
    html += `</ul>
        </nav>
        
        <main class="content">`;
    
    for (const item of documentation.api) {
      const id = item.file.replace(/[^a-zA-Z0-9]/g, '-');
      html += `<section id="${id}" class="api-section">
                <h2>${item.file}</h2>`;
      
      if (item.description) {
        html += `<p class="file-description">${item.description}</p>`;
      }
      
      for (const exp of item.exports) {
        html += `<div class="export-item">
                  <h3 class="export-name">
                    <code>${exp.name}</code>
                    <span class="export-type">${exp.type}</span>
                  </h3>`;
        
        if (exp.description) {
          html += `<p class="export-description">${exp.description}</p>`;
        }
        
        if (exp.signature) {
          html += `<pre class="signature"><code>${this.escapeHtml(exp.signature)}</code></pre>`;
        }
        
        html += `</div>`;
      }
      
      html += `</section>`;
    }
    
    html += `</main>
    </div>
</body>
</html>`;
    
    return html;
  }

  private getThemeCSS(): string {
    switch (this.options.theme) {
      case 'dark':
        return `
          body { background: #1a1a1a; color: #e0e0e0; font-family: -apple-system, sans-serif; }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .stats { background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 20px; }
          .stat-item { text-align: center; }
          .stat-value { display: block; font-size: 2em; font-weight: bold; color: #4CAF50; }
          .export-item { border-left: 3px solid #4CAF50; padding-left: 15px; margin: 20px 0; }
          .signature { background: #2a2a2a; padding: 15px; border-radius: 4px; overflow-x: auto; }
          code { background: #333; padding: 2px 6px; border-radius: 3px; }
        `;
      case 'minimal':
        return `
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1, h2, h3 { color: #333; }
          .export-item { margin: 30px 0; }
          .signature { background: #f8f8f8; padding: 10px; border-left: 4px solid #007acc; }
          code { background: #f0f0f0; padding: 1px 4px; border-radius: 2px; }
        `;
      default:
        return `
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          .header { border-bottom: 3px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
          .stats { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
          .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 15px; }
          .stat-item { text-align: center; padding: 15px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .stat-value { display: block; font-size: 2em; font-weight: bold; color: #007acc; margin-bottom: 5px; }
          .stat-label { color: #64748b; font-size: 0.9em; }
          .navigation { background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .navigation ul { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
          .navigation a { color: #007acc; text-decoration: none; padding: 5px 10px; display: block; border-radius: 4px; }
          .navigation a:hover { background: #e2e8f0; }
          .api-section { margin-bottom: 50px; padding-bottom: 30px; border-bottom: 1px solid #e2e8f0; }
          .export-item { border-left: 4px solid #007acc; padding-left: 20px; margin: 30px 0; background: #fafbfc; padding: 20px; border-radius: 0 8px 8px 0; }
          .export-name { display: flex; align-items: center; gap: 10px; margin: 0 0 10px 0; }
          .export-type { background: #007acc; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; }
          .signature { background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; overflow-x: auto; margin: 10px 0; }
          code { background: #e2e8f0; padding: 2px 6px; border-radius: 3px; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; }
          .file-description { color: #64748b; font-style: italic; margin-bottom: 20px; }
          .export-description { color: #475569; margin-bottom: 15px; }
        `;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private walk(dir: string, out: string[]): void {
    try {
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        
        if (stat.isDirectory()) {
          // Skip node_modules and hidden directories
          if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist') {
            this.walk(full, out);
          }
        } else {
          out.push(full);
        }
      }
    } catch (error) {
      console.warn(`Cannot read directory ${dir}:`, error);
    }
  }
}

// Legacy compatibility
export function generateAPI(root: string, outFile: string): void {
  const generator = new DocumentationGenerator();
  generator.generateAPI(root, outFile);
}

function walk(dir: string, out: string[]): void {
  const generator = new DocumentationGenerator();
  (generator as any).walk(dir, out);
}

export default DocumentationGenerator;
