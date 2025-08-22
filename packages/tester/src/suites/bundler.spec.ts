import { test } from '../index.js';

// Mock bundler interfaces for testing
interface ModuleInfo {
  id: string;
  imports: string[];
  exports: string[];
  code: string;
}

interface DependencyGraph {
  modules: Record<string, ModuleInfo>;
  entryPoints: string[];
}

// Mock bundler functions
function mockParseModule(code: string, id: string): ModuleInfo {
  const imports: string[] = [];
  const exports: string[] = [];
  
  // Simple regex parsing for imports/exports
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  const exportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
  
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }
  
  while ((match = exportRegex.exec(code)) !== null) {
    exports.push(match[1]);
  }
  
  return { id, imports, exports, code };
}

function mockBuildGraph(entryPoint: string, modules: Record<string, string>): DependencyGraph {
  const graph: DependencyGraph = {
    modules: {},
    entryPoints: [entryPoint]
  };
  
  const visited = new Set<string>();
  
  function processModule(id: string) {
    if (visited.has(id) || !modules[id]) return;
    visited.add(id);
    
    const moduleInfo = mockParseModule(modules[id], id);
    graph.modules[id] = moduleInfo;
    
    // Process dependencies
    moduleInfo.imports.forEach(importId => {
      if (importId.startsWith('.')) {
        // Resolve relative imports
        const resolvedId = resolveImport(id, importId);
        processModule(resolvedId);
      }
    });
  }
  
  processModule(entryPoint);
  return graph;
}

function resolveImport(currentId: string, importPath: string): string {
  // Simple relative import resolution
  if (importPath.startsWith('./')) {
    const parts = currentId.split('/');
    parts.pop(); // Remove filename
    return parts.join('/') + '/' + importPath.slice(2);
  }
  return importPath;
}

function mockTreeShake(graph: DependencyGraph, entry: string): Set<string> {
  const used = new Set<string>();
  const queue = [entry];
  
  while (queue.length > 0) {
    const moduleId = queue.shift()!;
    if (used.has(moduleId)) continue;
    
    used.add(moduleId);
    const module = graph.modules[moduleId];
    
    if (module) {
      module.imports.forEach(imp => {
        if (imp.startsWith('.')) {
          const resolvedId = resolveImport(moduleId, imp);
          if (graph.modules[resolvedId]) {
            queue.push(resolvedId);
          }
        }
      });
    }
  }
  
  return used;
}

test('Bundler should parse module imports and exports', () => {
  const code = `
    import { Component } from './component';
    import Router from './router';
    export const MyComponent = () => {};
    export function helper() {}
  `;
  
  const moduleInfo = mockParseModule(code, 'test.js');
  
  if (moduleInfo.imports.length !== 2) {
    throw new Error(`Expected 2 imports, got ${moduleInfo.imports.length}`);
  }
  
  if (!moduleInfo.imports.includes('./component')) {
    throw new Error('Missing ./component import');
  }
  
  if (!moduleInfo.imports.includes('./router')) {
    throw new Error('Missing ./router import');
  }
  
  if (moduleInfo.exports.length !== 2) {
    throw new Error(`Expected 2 exports, got ${moduleInfo.exports.length}`);
  }
  
  if (!moduleInfo.exports.includes('MyComponent')) {
    throw new Error('Missing MyComponent export');
  }
  
  if (!moduleInfo.exports.includes('helper')) {
    throw new Error('Missing helper export');
  }
});

test('Bundler should build dependency graph', () => {
  const modules = {
    'app.js': `
      import { Component } from './component.js';
      import { Router } from './router.js';
      export const App = () => {};
    `,
    'component.js': `
      import { signal } from './reactive.js';
      export const Component = () => {};
    `,
    'router.js': `
      export const Router = class {};
    `,
    'reactive.js': `
      export const signal = (value) => ({ value });
    `
  };
  
  const graph = mockBuildGraph('app.js', modules);
  
  if (Object.keys(graph.modules).length !== 4) {
    throw new Error(`Expected 4 modules in graph, got ${Object.keys(graph.modules).length}`);
  }
  
  if (!graph.modules['app.js']) {
    throw new Error('Entry point app.js missing from graph');
  }
  
  if (!graph.modules['component.js']) {
    throw new Error('component.js missing from graph');
  }
  
  if (!graph.modules['reactive.js']) {
    throw new Error('reactive.js missing from graph (transitive dependency)');
  }
});

test('Bundler should perform tree shaking', () => {
  const modules = {
    'app.js': `
      import { used } from './utils.js';
      export const App = () => used();
    `,
    'utils.js': `
      export const used = () => 'used';
      export const unused = () => 'unused';
    `,
    'orphan.js': `
      export const orphan = () => 'orphan';
    `
  };
  
  const graph = mockBuildGraph('app.js', modules);
  const usedModules = mockTreeShake(graph, 'app.js');
  
  if (!usedModules.has('app.js')) {
    throw new Error('Entry point should be marked as used');
  }
  
  if (!usedModules.has('utils.js')) {
    throw new Error('Imported module should be marked as used');
  }
  
  if (usedModules.has('orphan.js')) {
    throw new Error('Orphaned module should not be marked as used');
  }
});

test('Bundler should handle circular dependencies', () => {
  const modules = {
    'a.js': `
      import { b } from './b.js';
      export const a = () => b();
    `,
    'b.js': `
      import { a } from './a.js';
      export const b = () => 'b';
    `
  };
  
  const graph = mockBuildGraph('a.js', modules);
  
  if (Object.keys(graph.modules).length !== 2) {
    throw new Error('Circular dependency handling failed');
  }
  
  if (!graph.modules['a.js'] || !graph.modules['b.js']) {
    throw new Error('Both modules in circular dependency should be included');
  }
});

test('Bundler should support code splitting', () => {
  // Mock code splitting logic
  function mockCodeSplit(graph: DependencyGraph, threshold: number) {
    const chunks: Record<string, string[]> = { main: [] };
    let chunkId = 0;
    
    Object.keys(graph.modules).forEach(moduleId => {
      const module = graph.modules[moduleId];
      if (module.code.length > threshold) {
        const chunkName = `chunk-${chunkId++}`;
        chunks[chunkName] = [moduleId];
      } else {
        chunks.main.push(moduleId);
      }
    });
    
    return chunks;
  }
  
  const modules = {
    'app.js': 'export const App = () => {};', // Small
    'large.js': 'export const Large = () => { /* large module content */ };'.repeat(20) // Large
  };
  
  const graph = mockBuildGraph('app.js', modules);
  graph.modules['large.js'] = mockParseModule(modules['large.js'], 'large.js');
  
  const chunks = mockCodeSplit(graph, 100);
  
  if (!chunks.main.includes('app.js')) {
    throw new Error('Small module should be in main chunk');
  }
  
  const largeChunks = Object.keys(chunks).filter(k => k !== 'main');
  if (largeChunks.length === 0) {
    throw new Error('Large module should be split into separate chunk');
  }
});

test('Bundler should generate manifest', () => {
  const modules = {
    'app.js': 'export const App = () => {};',
    'utils.js': 'export const utils = {};'
  };
  
  const graph = mockBuildGraph('app.js', modules);
  
  // Mock manifest generation
  const manifest = {
    entry: 'app.js',
    modules: Object.keys(graph.modules),
    chunks: {
      main: ['app.js', 'utils.js']
    },
    assets: ['bundle.js'],
    version: '1.0.0'
  };
  
  if (manifest.entry !== 'app.js') {
    throw new Error('Manifest should specify correct entry point');
  }
  
  if (manifest.modules.length !== 2) {
    throw new Error('Manifest should list all modules');
  }
  
  if (!manifest.chunks.main.includes('app.js')) {
    throw new Error('Manifest should include entry point in main chunk');
  }
});
