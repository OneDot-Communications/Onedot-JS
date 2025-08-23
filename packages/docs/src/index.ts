export * from './api';
export * from './generator';
export * from './guides';
export * from './tutorials';

import { APIDocumentation } from './api';
import { DocumentationGenerator } from './generator';
import { GuidesDocumentation } from './guides';
import { TutorialsDocumentation } from './tutorials';

export class Docs {
  private generator: DocumentationGenerator;
  private api: APIDocumentation;
  private guides: GuidesDocumentation;
  private tutorials: TutorialsDocumentation;

  constructor() {
    this.generator = new DocumentationGenerator();
    this.api = new APIDocumentation();
    this.guides = new GuidesDocumentation();
    this.tutorials = new TutorialsDocumentation();
  }

  public getGenerator(): DocumentationGenerator {
    return this.generator;
  }

  public getAPI(): APIDocumentation {
    return this.api;
  }

  public getGuides(): GuidesDocumentation {
    return this.guides;
  }

  public getTutorials(): TutorialsDocumentation {
    return this.tutorials;
  }

  public async generateAll(): Promise<void> {
    await this.generator.generateAll();
  }

  public async generateAPI(): Promise<void> {
    await this.generator.generateAPI();
  }

  public async generateGuides(): Promise<void> {
    await this.generator.generateGuides();
  }

  public async generateTutorials(): Promise<void> {
    await this.generator.generateTutorials();
  }

  public async serve(port: number = 3000): Promise<void> {
    await this.generator.serve(port);
  }
}

// Factory function to create docs
export function createDocs(): Docs {
  return new Docs();
}
