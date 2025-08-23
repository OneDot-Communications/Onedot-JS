import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';
import * as yaml from 'yaml';
import { DocumentationGenerator } from '../generator';

export interface Guide {
  title: string;
  slug: string;
  description?: string;
  content: string;
  category?: string;
  order?: number;
  author?: string;
  date?: string;
  tags?: string[];
  related?: string[];
  metadata?: any;
}

export interface GuideCategory {
  name: string;
  slug: string;
  description?: string;
  order?: number;
  guides: string[];
}

export class GuidesDocumentation {
  private generator: DocumentationGenerator;
  private guides: Map<string, Guide> = new Map();
  private categories: Map<string, GuideCategory> = new Map();
  private loaded = false;

  constructor(generator?: DocumentationGenerator) {
    this.generator = generator || new DocumentationGenerator();
  }

  public async load(sourcePath: string): Promise<void> {
    if (this.loaded) return;

    // Load guides from markdown files
    await this.loadFromMarkdown(sourcePath);

    // Load categories from YAML
    await this.loadCategories(path.join(sourcePath, 'categories.yml'));

    // Categorize guides
    this.categorizeGuides();

    this.loaded = true;
  }

  private async loadFromMarkdown(sourcePath: string): Promise<void> {
    if (!await fs.pathExists(sourcePath)) return;

    // Find all markdown files
    const files = glob.sync('**/*.md', {
      cwd: sourcePath,
      ignore: ['**/node_modules/**']
    });

    // Parse each markdown file
    for (const file of files) {
      const filePath = path.join(sourcePath, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Parse front matter and content
      const { data, body } = this.generator.parseFrontMatter(content);

      // Create slug from filename
      const slug = path.basename(file, '.md');

      // Create guide
      const guide: Guide = {
        title: data.title || slug,
        slug,
        description: data.description,
        content: body,
        category: data.category,
        order: data.order,
        author: data.author,
        date: data.date,
        tags: data.tags || [],
        related: data.related || [],
        metadata: data
      };

      this.guides.set(slug, guide);
    }
  }

  private async loadCategories(categoriesPath: string): Promise<void> {
    if (!await fs.pathExists(categoriesPath)) return;

    const content = await fs.readFile(categoriesPath, 'utf8');
    const data = yaml.parse(content);

    if (data.categories && Array.isArray(data.categories)) {
      data.categories.forEach((category: any) => {
        this.categories.set(category.slug, {
          name: category.name,
          slug: category.slug,
          description: category.description,
          order: category.order,
          guides: category.guides || []
        });
      });
    }
  }

  private categorizeGuides(): void {
    // Default categories
    const defaultCategories = [
      { name: 'Getting Started', slug: 'getting-started', order: 1 },
      { name: 'Core Concepts', slug: 'core-concepts', order: 2 },
      { name: 'Advanced Topics', slug: 'advanced-topics', order: 3 },
      { name: 'Migration', slug: 'migration', order: 4 }
    ];

    // Add default categories if not already present
    defaultCategories.forEach(category => {
      if (!this.categories.has(category.slug)) {
        this.categories.set(category.slug, {
          name: category.name,
          slug: category.slug,
          order: category.order,
          guides: []
        });
      }
    });

    // Categorize guides
    for (const [slug, guide] of this.guides) {
      const categorySlug = guide.category || 'getting-started';

      if (this.categories.has(categorySlug)) {
        const category = this.categories.get(categorySlug)!;
        if (!category.guides.includes(slug)) {
          category.guides.push(slug);
        }
      } else {
        // Create new category
        this.categories.set(categorySlug, {
          name: _.startCase(categorySlug),
          slug: categorySlug,
          guides: [slug]
        });
      }
    }

    // Sort guides in each category by order
    for (const category of this.categories.values()) {
      category.guides.sort((a, b) => {
        const guideA = this.guides.get(a);
        const guideB = this.guides.get(b);

        const orderA = guideA?.order || 0;
        const orderB = guideB?.order || 0;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return a.localeCompare(b);
      });
    }
  }

  public getGuides(): Guide[] {
    return Array.from(this.guides.values());
  }

  public getGuide(slug: string): Guide | undefined {
    return this.guides.get(slug);
  }

  public getCategories(): GuideCategory[] {
    return Array.from(this.categories.values())
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public getCategory(slug: string): GuideCategory | undefined {
    return this.categories.get(slug);
  }

  public getCategoryGuides(categorySlug: string): Guide[] {
    const category = this.categories.get(categorySlug);
    if (!category) return [];

    return category.guides
      .map(slug => this.guides.get(slug))
      .filter(Boolean) as Guide[];
  }

  public search(query: string): Guide[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.guides.values()).filter(guide => {
      return (
        guide.title.toLowerCase().includes(lowerQuery) ||
        (guide.description && guide.description.toLowerCase().includes(lowerQuery)) ||
        guide.content.toLowerCase().includes(lowerQuery) ||
        (guide.tags && guide.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    });
  }

  public async generate(outputDir: string): Promise<void> {
    // Create output directory
    await fs.ensureDir(outputDir);

    // Generate guides overview
    await this.generateOverview(outputDir);

    // Generate category pages
    for (const category of this.categories.values()) {
      await this.generateCategoryPage(outputDir, category);
    }

    // Generate individual guide pages
    for (const guide of this.guides.values()) {
      await this.generateGuidePage(outputDir, guide);
    }
  }

  private async generateOverview(outputDir: string): Promise<void> {
    const content = this.generator.renderTemplate('guides-overview', {
      title: 'Guides',
      categories: this.getCategories().map(category => ({
        ...category,
        guides: category.guides.map(slug => this.guides.get(slug)).filter(Boolean)
      })),
      ...this.generator.getCommonTemplateData()
    });

    await fs.writeFile(path.join(outputDir, 'index.html'), content);
  }

  private async generateCategoryPage(outputDir: string, category: GuideCategory): Promise<void> {
    const guides = category.guides
      .map(slug => this.guides.get(slug))
      .filter(Boolean) as Guide[];

    const content = this.generator.renderTemplate('guides-category', {
      title: category.name,
      category,
      guides,
      ...this.generator.getCommonTemplateData()
    });

    await fs.writeFile(path.join(outputDir, `${category.slug}.html`), content);
  }

  private async generateGuidePage(outputDir: string, guide: Guide): Promise<void> {
    const htmlContent = marked(guide.content);

    // Generate table of contents
    const toc = this.generateTableOfContents(htmlContent);

    // Find related guides
    const relatedGuides = guide.related
      ? guide.related.map(slug => this.guides.get(slug)).filter(Boolean) as Guide[]
      : [];

    const content = this.generator.renderTemplate('guide', {
      title: guide.title,
      guide,
      content: htmlContent,
      toc,
      relatedGuides,
      ...this.generator.getCommonTemplateData()
    });

    await fs.writeFile(path.join(outputDir, `${guide.slug}.html`), content);
  }

  private generateTableOfContents(htmlContent: string): any[] {
    const toc: any[] = [];
    const headingRegex = /<h([1-6]) id="([^"]+)">([^<]+)<\/h[1-6]>/g;
    let match;

    while ((match = headingRegex.exec(htmlContent)) !== null) {
      const level = parseInt(match[1]);
      const id = match[2];
      const text = match[3];

      toc.push({
        level,
        id,
        text
      });
    }

    return toc;
  }
}
