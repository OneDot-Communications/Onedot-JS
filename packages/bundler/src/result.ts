import * as fs from 'fs-extra';
import * as path from 'path';
import { AssetInfo, BundleEntry, BundleResult, BundleStats, Diagnostic } from './config';

export class BundleResultBuilder {
  private result: BundleResult;

  constructor() {
    this.result = {
      entries: {},
      assets: [],
      stats: {
        time: 0,
        size: 0,
        modules: 0,
        assets: 0
      },
      diagnostics: [],
      warnings: [],
      errors: []
    };
  }

  addEntry(name: string, entry: BundleEntry): this {
    this.result.entries[name] = entry;
    return this;
  }

  addAsset(asset: AssetInfo): this {
    this.result.assets.push(asset);
    return this;
  }

  setStats(stats: Partial<BundleStats>): this {
    this.result.stats = { ...this.result.stats, ...stats };
    return this;
  }

  addDiagnostic(diagnostic: Diagnostic): this {
    this.result.diagnostics.push(diagnostic);

    if (diagnostic.severity === 'warning') {
      this.result.warnings.push(diagnostic);
    } else if (diagnostic.severity === 'error') {
      this.result.errors.push(diagnostic);
    }

    return this;
  }

  addDiagnostics(diagnostics: Diagnostic[]): this {
    diagnostics.forEach(diagnostic => this.addDiagnostic(diagnostic));
    return this;
  }

  build(): BundleResult {
    return { ...this.result };
  }
}

export class BundleResultWriter {
  static async writeResult(result: BundleResult, outputDir: string): Promise<void> {
    // Write entry files
    for (const [name, entry] of Object.entries(result.entries)) {
      await fs.ensureDir(path.dirname(entry.path));
      await fs.writeFile(entry.path, await this.getEntryContent(entry));

      if (entry.map) {
        await fs.writeFile(`${entry.path}.map`, JSON.stringify(entry.map));
      }
    }

    // Write asset files
    for (const asset of result.assets) {
      const assetPath = path.join(outputDir, asset.path);
      await fs.ensureDir(path.dirname(assetPath));
      await fs.writeFile(assetPath, asset.source);
    }

    // Write stats file
    const statsPath = path.join(outputDir, 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(result.stats, null, 2));
  }

  private static async getEntryContent(entry: BundleEntry): Promise<string> {
    if (entry.path.endsWith('.js')) {
      return fs.readFile(entry.path, 'utf8');
    }
    return '';
  }
}

export class BundleResultAnalyzer {
  static analyze(result: BundleResult): BundleAnalysis {
    const analysis: BundleAnalysis = {
      totalSize: result.stats.size,
      entryPoints: Object.keys(result.entries).length,
      assets: result.assets.length,
      modules: result.stats.modules,
      errors: result.errors.length,
      warnings: result.warnings.length,
      largestAsset: this.getLargestAsset(result),
      largestEntry: this.getLargestEntry(result),
      assetTypes: this.getAssetTypes(result),
      loadTime: this.estimateLoadTime(result)
    };

    return analysis;
  }

  private static getLargestAsset(result: BundleResult): AssetInfo | null {
    if (result.assets.length === 0) return null;

    return result.assets.reduce((largest, asset) =>
      asset.size > largest.size ? asset : largest
    );
  }

  private static getLargestEntry(result: BundleResult): BundleEntry | null {
    const entries = Object.values(result.entries);
    if (entries.length === 0) return null;

    return entries.reduce((largest, entry) =>
      entry.size > largest.size ? entry : largest
    );
  }

  private static getAssetTypes(result: BundleResult): Record<string, number> {
    const types: Record<string, number> = {};

    for (const asset of result.assets) {
      const ext = path.extname(asset.path).slice(1);
      types[ext] = (types[ext] || 0) + 1;
    }

    return types;
  }

  private static estimateLoadTime(result: BundleResult): number {
    // Simple estimation based on total size
    // In a real implementation, this would consider network conditions
    const totalSize = result.stats.size;
    const avgSpeed = 5000000; // 5Mbps
    return (totalSize * 8) / avgSpeed; // Convert to seconds
  }
}

export interface BundleAnalysis {
  totalSize: number;
  entryPoints: number;
  assets: number;
  modules: number;
  errors: number;
  warnings: number;
  largestAsset: AssetInfo | null;
  largestEntry: BundleEntry | null;
  assetTypes: Record<string, number>;
  loadTime: number;
}
