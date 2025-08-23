import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';
import * as yaml from 'yaml';
import { DocumentationGenerator } from '../generator';

export interface Tutorial {
  title: string;
  slug: string;
  description?: string;
  content: string;
  category?: string;
  order?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  author?: string;
  date?: string;
  tags?: string[];
  prerequisites?: string[];
  steps?: TutorialStep[];
  metadata?: any;
}

export interface TutorialStep {
  title: string;
  content: string;
  code?: string;
  language?: string;
  file?: string;
  result?: string;
  order?: number;
}

export class TutorialsDocumentation {
  private generator: DocumentationGenerator;
  private tutorials: Map<string, Tutorial> = new Map();
  private categories: Map<string, { name: string; description?: string; tutorials: string[] }> = new Map();
  private loaded = false;

  constructor(generator?: DocumentationGenerator) {
    this.generator = generator || new DocumentationGenerator();
  }

  public async load(sourcePath: string): Promise<void> {
    if (this.loaded) return;

    // Load tutorials from markdown files
    await this.loadFromMarkdown(sourcePath);

    // Load categories from YAML
    await this.loadCategories(path.join(sourcePath, 'categories.yml'));

    // Categorize tutorials
    this.categorizeTutorials();

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

      // Create tutorial
      const tutorial: Tutorial = {
        title: data.title || slug,
        slug,
        description: data.description,
        content: body,
        category: data.category,
        order: data.order,
        difficulty: data.difficulty,
        duration: data.duration,
        author: data.author,
        date: data.date,
        tags: data.tags || [],
        prerequisites: data.prerequisites || [],
        metadata: data
      };

      // Parse steps if present
      if (data.steps && Array.isArray(data.steps)) {
        tutorial.steps = data.steps.map((step: any, index: number) => ({
          title: step.title || `Step ${index + 1}`,
          content: step.content || '',
          code: step.code,
          language: step.language || 'typescript',
          file: step.file,
          result: step.result,
          order: step.order || index
        }));
      }

      this.tutorials.set(slug, tutorial);
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
          description: category.description,
          tutorials: category.tutorials || []
        });
      });
    }
  }

  private categorizeTutorials(): void {
    // Default categories
    const defaultCategories = [
      { name: 'Getting Started', slug: 'getting-started' },
      { name: 'Components', slug: 'components' },
      { name: 'State Management', slug: 'state-management' },
      { name: 'Routing', slug: 'routing' },
      { name: 'Advanced', slug: 'advanced' }
    ];

    // Add default categories if not already present
    defaultCategories.forEach(category => {
      if (!this.categories.has(category.slug)) {
        this.categories.set(category.slug, {
          name: category.name,
          slug: category.slug,
          tutorials: []
        });
      }
    });

    // Categorize tutorials
    for (const [slug, tutorial] of this.tutorials) {
      const categorySlug = tutorial.category || 'getting-started';

      if (this.categories.has(categorySlug)) {
        const category = this.categories.get(categorySlug)!;
        if (!category.tutorials.includes(slug)) {
          category.tutorials.push(slug);
        }
      } else {
        // Create new category
        this.categories.set(categorySlug, {
          name: _.startCase(categorySlug),
          slug: categorySlug,
          tutorials: [slug]
        });
      }
    }

    // Sort tutorials in each category by order
    for (const category of this.categories.values()) {
      category.tutorials.sort((a, b) => {
        const tutorialA = this.tutorials.get(a);
        const tutorialB = this.tutorials.get(b);

        const orderA = tutorialA?.order || 0;
        const orderB = tutorialB?.order || 0;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return a.localeCompare(b);
      });
    }
  }

  public getTutorials(): Tutorial[] {
    return Array.from(this.tutorials.values());
  }

  public getTutorial(slug: string): Tutorial | undefined {
    return this.tutorials.get(slug);
  }

  public getCategories(): { name: string; slug: string; description?: string; tutorials: string[] }[] {
    return Array.from(this.categories.values());
  }

  public getCategory(slug: string): { name: string; slug: string; description?: string; tutorials: string[] } | undefined {
    return this.categories.get(slug);
  }

  public getCategoryTutorials(categorySlug: string): Tutorial[] {
    const category = this.categories.get(categorySlug);
    if (!category) return [];

    return category.tutorials
      .map(slug => this.tutorials.get(slug))
      .filter(Boolean) as Tutorial[];
  }

  public search(query: string): Tutorial[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.tutorials.values()).filter(tutorial => {
      return (
        tutorial.title.toLowerCase().includes(lowerQuery) ||
        (tutorial.description && tutorial.description.toLowerCase().includes(lowerQuery)) ||
        tutorial.content.toLowerCase().includes(lowerQuery) ||
        (tutorial.tags && tutorial.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    });
  }

  public async generate(outputDir: string): Promise<void> {
    // Create output directory
    await fs.ensureDir(outputDir);

    // Generate tutorials overview
    await this.generateOverview(outputDir);

    // Generate category pages
    for (const [slug, category] of this.categories) {
      await this.generateCategoryPage(outputDir, slug, category);
    }

    // Generate individual tutorial pages
    for (const tutorial of this.tutorials.values()) {
      await this.generateTutorialPage(outputDir, tutorial);
    }
  }

  private async generateOverview(outputDir: string): Promise<void> {
    const content = this.generator.renderTemplate('tutorials-overview', {
      title: 'Tutorials',
      categories: Array.from(this.categories.entries()).map(([slug, category]) => ({
        slug,
        ...category,
        tutorials: category.tutorials.map(tutorialSlug => this.tutorials.get(tutorialSlug)).filter(Boolean)
      })),
      ...this.generator.getCommonTemplateData()
    });

    await fs.writeFile(path.join(outputDir, 'index.html'), content);
  }

  private async generateCategoryPage(outputDir: string, categorySlug: string, category: any): Promise<void> {
    const tutorials = category.tutorials
      .map((slug: string) => this.tutorials.get(slug))
      .filter(Boolean) as Tutorial[];

    const content = this.generator.renderTemplate('tutorials-category', {
      title: category.name,
      category: {
        slug: categorySlug,
        name: category.name,
        description: category.description
      },
      tutorials,
      ...this.generator.getCommonTemplateData()
    });

    await fs.writeFile(path.join(outputDir, `${categorySlug}.html`), content);
  }

  private async generateTutorialPage(outputDir: string, tutorial: Tutorial): Promise<void> {
    const htmlContent = marked(tutorial.content);

    // Generate table of contents
    const toc = this.generateTableOfContents(htmlContent);

    // Find related tutorials
    const relatedTutorials = this.findRelatedTutorials(tutorial);

    const content = this.generator.renderTemplate('tutorial', {
      title: tutorial.title,
      tutorial,
      content: htmlContent,
      toc,
      relatedTutorials,
      ...this.generator.getCommonTemplateData()
    });

    await fs.writeFile(path.join(outputDir, `${tutorial.slug}.html`), content);
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

  private findRelatedTutorials(tutorial: Tutorial): Tutorial[] {
    // Find tutorials with similar tags
    const relatedByTags = Array.from(this.tutorials.values())
      .filter(t => t.slug !== tutorial.slug && t.tags && tutorial.tags)
      .filter(t => t.tags!.some(tag => tutorial.tags!.includes(tag)))
      .slice(0, 3);

    // Find tutorials in the same category
    const category = tutorial.category || 'getting-started';
    const relatedByCategory = Array.from(this.tutorials.values())
      .filter(t => t.slug !== tutorial.slug && t.category === category)
      .slice(0, 3);

    // Combine and remove duplicates
    const related = [...relatedByTags, ...relatedByCategory];
    const uniqueRelated = _.uniqBy(related, 'slug');

    return uniqueRelated.slice(0, 3);
  }
}
