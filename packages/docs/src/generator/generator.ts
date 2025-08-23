import * as chokidar from 'chokidar';
import * as express from 'express';
import * as fs from 'fs-extra';
import * as hljs from 'highlight.js';
import * as marked from 'marked';
import * as open from 'open';
import * as path from 'path';
import { APIDocumentation } from '../api';
import { GuidesDocumentation } from '../guides';
import { TutorialsDocumentation } from '../tutorials';

export interface GeneratorOptions {
  sourceDir?: string;
  outputDir?: string;
  templateDir?: string;
  assetsDir?: string;
  staticDir?: string;
  port?: number;
  host?: string;
  watch?: boolean;
  openBrowser?: boolean;
  baseUrl?: string;
  title?: string;
  description?: string;
  logo?: string;
  favicon?: string;
  theme?: 'default' | 'dark' | 'light';
  sidebar?: boolean;
  search?: boolean;
  copyButton?: boolean;
  lineNumbers?: boolean;
  anchors?: boolean;
  includeSource?: boolean;
  exclude?: string[];
  include?: string[];
}

export interface TemplateData {
  title: string;
  description?: string;
  content: string;
  toc?: any[];
  navigation?: any[];
  metadata?: any;
  [key: string]: any;
}

export class DocumentationGenerator {
  private options: GeneratorOptions;
  private api: APIDocumentation;
  private guides: GuidesDocumentation;
  private tutorials: TutorialsDocumentation;
  private server: express.Express | null = null;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(options: GeneratorOptions = {}) {
    this.options = {
      sourceDir: path.join(process.cwd(), 'docs'),
      outputDir: path.join(process.cwd(), 'docs-dist'),
      templateDir: path.join(__dirname, '..', 'templates'),
      assetsDir: path.join(__dirname, '..', 'assets'),
      staticDir: path.join(process.cwd(), 'docs', 'static'),
      port: 3000,
      host: 'localhost',
      watch: false,
      openBrowser: true,
      baseUrl: '/',
      title: 'ONEDOT-JS Documentation',
      description: 'Documentation for the ONEDOT-JS framework',
      logo: '/assets/logo.png',
      favicon: '/assets/favicon.ico',
      theme: 'default',
      sidebar: true,
      search: true,
      copyButton: true,
      lineNumbers: true,
      anchors: true,
      includeSource: false,
      exclude: [],
      include: [],
      ...options
    };

    this.api = new APIDocumentation(this);
    this.guides = new GuidesDocumentation(this);
    this.tutorials = new TutorialsDocumentation(this);

    // Set up marked renderer
    this.setupMarked();
  }

  private setupMarked(): void {
    // Set up marked options
    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (err) {
            console.error(err);
          }
        }
        return hljs.highlightAuto(code).value;
      },
      langPrefix: 'hljs language-',
      headerIds: this.options.anchors,
      headerPrefix: '',
      mangle: false,
      gfm: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: false,
      xhtml: false
    });

    // Set up custom renderer
    const renderer = new marked.Renderer();

    // Custom heading renderer to add anchor links
    renderer.heading = (text, level, raw) => {
      const anchor = this.options.anchors
        ? `<a href="#${raw.toLowerCase().replace(/[^\w]+/g, '-')}" class="anchor-link">#</a>`
        : '';

      return `<h${level} id="${raw.toLowerCase().replace(/[^\w]+/g, '-')}">${text} ${anchor}</h${level}>`;
    };

    // Custom code renderer to add copy button
    renderer.code = (code, language, escaped) => {
      const lang = language || 'text';
      const highlightedCode = hljs.highlight(code, { language: lang }).value;
      const copyButton = this.options.copyButton
        ? `<button class="copy-button" data-code="${encodeURIComponent(code)}">Copy</button>`
        : '';

      return `<pre><code class="hljs language-${lang}">${highlightedCode}</code>${copyButton}</pre>`;
    };

    // Custom table renderer to add table class
    renderer.table = (header, body) => {
      return `<table class="docs-table"><thead>${header}</thead><tbody>${body}</tbody></table>`;
    };

    marked.setOptions({ renderer });
  }

  public async generateAll(): Promise<void> {
    // Create output directory
    await fs.ensureDir(this.options.outputDir!);

    // Copy assets
    await this.copyAssets();

    // Copy static files
    await this.copyStaticFiles();

    // Generate API documentation
    await this.generateAPI();

    // Generate guides
    await this.generateGuides();

    // Generate tutorials
    await this.generateTutorials();

    // Generate home page
    await this.generateHomePage();

    // Generate search index
    await this.generateSearchIndex();

    // Generate 404 page
    await this.generate404Page();
  }

  public async generateAPI(): Promise<void> {
    console.log('Generating API documentation...');

    // Load API documentation
    await this.api.load(this.options.sourceDir!);

    // Generate API pages
    await this.api.generate(path.join(this.options.outputDir!, 'api'));

    console.log('API documentation generated successfully.');
  }

  public async generateGuides(): Promise<void> {
    console.log('Generating guides...');

    // Load guides
    await this.guides.load(path.join(this.options.sourceDir!, 'guides'));

    // Generate guide pages
    await this.guides.generate(path.join(this.options.outputDir!, 'guides'));

    console.log('Guides generated successfully.');
  }

  public async generateTutorials(): Promise<void> {
    console.log('Generating tutorials...');

    // Load tutorials
    await this.tutorials.load(path.join(this.options.sourceDir!, 'tutorials'));

    // Generate tutorial pages
    await this.tutorials.generate(path.join(this.options.outputDir!, 'tutorials'));

    console.log('Tutorials generated successfully.');
  }

  private async copyAssets(): Promise<void> {
    const assetsOutputDir = path.join(this.options.outputDir!, 'assets');
    await fs.ensureDir(assetsOutputDir);

    // Copy assets from template directory
    if (await fs.pathExists(this.options.assetsDir!)) {
      await fs.copy(this.options.assetsDir!, assetsOutputDir);
    }

    // Copy theme-specific assets
    const themeAssetsDir = path.join(this.options.templateDir!, 'themes', this.options.theme!, 'assets');
    if (await fs.pathExists(themeAssetsDir)) {
      await fs.copy(themeAssetsDir, assetsOutputDir);
    }
  }

  private async copyStaticFiles(): Promise<void> {
    if (await fs.pathExists(this.options.staticDir!)) {
      await fs.copy(this.options.staticDir!, this.options.outputDir!);
    }
  }

  private async generateHomePage(): Promise<void> {
    const homePagePath = path.join(this.options.sourceDir!, 'index.md');

    let content = '';
    let metadata: any = {};

    if (await fs.pathExists(homePagePath)) {
      const sourceContent = await fs.readFile(homePagePath, 'utf8');
      const { content: mdContent, data } = this.parseFrontMatter(sourceContent);
      content = mdContent;
      metadata = data;
    } else {
      // Generate default home page
      content = `
# Welcome to ONEDOT-JS Documentation

ONEDOT-JS is a modern, lightweight, and powerful JavaScript framework for building user interfaces.

## Getting Started

- [Installation](/guides/installation)
- [Quick Start](/tutorials/quick-start)
- [API Reference](/api)

## Features

- **Component-Based**: Build encapsulated components that manage their own state.
- **Reactive State**: Automatically update the UI when state changes.
- **Dependency Injection**: Easily manage dependencies between components.
- **Router**: Client-side routing with a simple, powerful API.
- **Developer Tools**: Comprehensive debugging and profiling tools.

## Community

- [GitHub](https://github.com/onedot-js/onedot-js)
- [Discord](https://discord.gg/onedot-js)
- [Twitter](https://twitter.com/onedot_js)
`;
    }

    const htmlContent = marked(content);

    const templateData: TemplateData = {
      title: metadata.title || this.options.title,
      description: metadata.description || this.options.description,
      content: htmlContent,
      metadata,
      navigation: this.getNavigation(),
      ...this.getCommonTemplateData()
    };

    const output = this.renderTemplate('home', templateData);

    await fs.writeFile(path.join(this.options.outputDir!, 'index.html'), output);
  }

  private async generateSearchIndex(): Promise<void> {
    const searchIndex = {
      api: await this.api.getEntries().map(entry => ({
        title: entry.name,
        type: 'api',
        url: `/api/${entry.name.toLowerCase().replace(/\s+/g, '-')}.html`,
        content: entry.description || '',
        category: this.api.getEntryCategory(entry.name) || 'Other'
      })),
      guides: await this.guides.getGuides().map(guide => ({
        title: guide.title,
        type: 'guide',
        url: `/guides/${guide.slug}.html`,
        content: guide.description || '',
        category: guide.category || 'General'
      })),
      tutorials: await this.tutorials.getTutorials().map(tutorial => ({
        title: tutorial.title,
        type: 'tutorial',
        url: `/tutorials/${tutorial.slug}.html`,
        content: tutorial.description || '',
        category: tutorial.category || 'Getting Started'
      }))
    };

    await fs.writeFile(
      path.join(this.options.outputDir!, 'search-index.json'),
      JSON.stringify(searchIndex, null, 2)
    );
  }

  private async generate404Page(): Promise<void> {
    const templateData: TemplateData = {
      title: 'Page Not Found',
      content: `
<div class="error-page">
  <h1>404 - Page Not Found</h1>
  <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
  <p><a href="/">Go to Homepage</a></p>
</div>
      `,
      ...this.getCommonTemplateData()
    };

    const output = this.renderTemplate('404', templateData);

    await fs.writeFile(path.join(this.options.outputDir!, '404.html'), output);
  }

  private getNavigation(): any[] {
    return [
      {
        title: 'Getting Started',
        path: '/',
        children: [
          { title: 'Installation', path: '/guides/installation' },
          { title: 'Quick Start', path: '/tutorials/quick-start' }
        ]
      },
      {
        title: 'Guides',
        path: '/guides',
        children: this.guides.getGuides().map(guide => ({
          title: guide.title,
          path: `/guides/${guide.slug}`
        }))
      },
      {
        title: 'Tutorials',
        path: '/tutorials',
        children: this.tutorials.getTutorials().map(tutorial => ({
          title: tutorial.title,
          path: `/tutorials/${tutorial.slug}`
        }))
      },
      {
        title: 'API Reference',
        path: '/api',
        children: Array.from(this.api.getCategories().entries()).map(([category]) => ({
          title: category,
          path: `/api/${category.toLowerCase().replace(/\s+/g, '-')}`
        }))
      }
    ];
  }

  private getCommonTemplateData(): any {
    return {
      baseUrl: this.options.baseUrl,
      logo: this.options.logo,
      favicon: this.options.favicon,
      theme: this.options.theme,
      sidebar: this.options.sidebar,
      search: this.options.search,
      currentYear: new Date().getFullYear()
    };
  }

  public renderTemplate(templateName: string, data: TemplateData): string {
    // This is a simplified template rendering implementation
    // In a real implementation, you would use a proper template engine like Handlebars or EJS

    const templatePath = path.join(this.options.templateDir!, 'themes', this.options.theme!, `${templateName}.html`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    let template = fs.readFileSync(templatePath, 'utf8');

    // Simple template variable replacement
    template = template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value: any = data;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return match;
        }
      }

      return value !== undefined ? String(value) : match;
    });

    return template;
  }

  public parseFrontMatter(content: string): { content: string; data: any } {
    const fm = require('front-matter');
    const parsed = fm(content);

    return {
      content: parsed.body,
      data: parsed.attributes
    };
  }

  public async serve(port?: number): Promise<void> {
    const serverPort = port || this.options.port;

    // Create Express app
    this.server = express();

    // Serve static files
    this.server.use(express.static(this.options.outputDir!));

    // Set up live reload if watching
    if (this.options.watch) {
      this.setupLiveReload();
    }

    // Start server
    this.server.listen(serverPort, this.options.host, () => {
      console.log(`Documentation server running at http://${this.options.host}:${serverPort}`);

      if (this.options.openBrowser) {
        open(`http://${this.options.host}:${serverPort}`);
      }
    });

    // Set up file watching if enabled
    if (this.options.watch) {
      this.setupFileWatcher();
    }
  }

  private setupLiveReload(): void {
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({ port: this.options.port! + 1 });

    this.server!.get('/reload.js', (req, res) => {
      res.setHeader('Content-Type', 'text/javascript');
      res.send(`
        (function() {
          const ws = new WebSocket('ws://${this.options.host}:${this.options.port! + 1}');

          ws.onmessage = function(event) {
            if (event.data === 'reload') {
              console.log('Reloading page...');
              window.location.reload();
            }
          };

          ws.onclose = function() {
            console.log('Live reload connection closed');
          };
        })();
      `);
    });

    // Inject live reload script into HTML pages
    this.server!.use((req, res, next) => {
      if (req.path.endsWith('.html')) {
        const originalEnd = res.end;

        res.end = function(chunk: any, encoding?: any) {
          if (chunk && typeof chunk === 'string') {
            const script = `<script src="/reload.js"></script>`;
            chunk = chunk.replace('</body>', `${script}</body>`);
          }

          originalEnd.call(res, chunk, encoding);
        };
      }

      next();
    });

    // Store WebSocket server for sending reload messages
    (this.server as any).wss = wss;
  }

  private setupFileWatcher(): void {
    const watchPaths = [
      this.options.sourceDir!,
      path.join(process.cwd(), 'packages', 'core', 'src'),
      path.join(process.cwd(), 'packages', 'desktop', 'src'),
      path.join(process.cwd(), 'packages', 'devtools', 'src')
    ];

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });

    this.watcher.on('change', async (path) => {
      console.log(`File changed: ${path}`);

      // Regenerate documentation
      await this.generateAll();

      // Send reload message to connected clients
      const wss = (this.server as any).wss;
      if (wss) {
        wss.clients.forEach((client: any) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send('reload');
          }
        });
      }
    });

    console.log('Watching for file changes...');
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
