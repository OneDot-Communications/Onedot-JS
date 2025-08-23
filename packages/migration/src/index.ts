export * from './angular';
export * from './common';
export * from './react';
export * from './vue';

import { AngularMigrator } from './angular';
import { MigrationManager } from './common';
import { ReactMigrator } from './react';
import { VueMigrator } from './vue';

export class MigrationTools {
  private manager: MigrationManager;
  private angular: AngularMigrator;
  private react: ReactMigrator;
  private vue: VueMigrator;

  constructor() {
    this.manager = new MigrationManager();
    this.angular = new AngularMigrator(this.manager);
    this.react = new ReactMigrator(this.manager);
    this.vue = new VueMigrator(this.manager);
  }

  public getManager(): MigrationManager {
    return this.manager;
  }

  public getAngularMigrator(): AngularMigrator {
    return this.angular;
  }

  public getReactMigrator(): ReactMigrator {
    return this.react;
  }

  public getVueMigrator(): VueMigrator {
    return this.vue;
  }

  public async migrateFromAngular(options: any): Promise<void> {
    return this.angular.migrate(options);
  }

  public async migrateFromReact(options: any): Promise<void> {
    return this.react.migrate(options);
  }

  public async migrateFromVue(options: any): Promise<void> {
    return this.vue.migrate(options);
  }
}

// Factory function to create migration tools
export function createMigrationTools(): MigrationTools {
  return new MigrationTools();
}
