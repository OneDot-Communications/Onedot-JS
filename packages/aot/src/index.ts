export { AotCompiler } from './compiler';
export { ComponentCompiler } from './component-compiler';
export { createCompiler } from './factory';
export { MetadataGenerator } from './metadata-generator';
export { OptimizationOptions } from './src/types';
export { StyleCompiler } from './style-compiler';
export { TemplateCompiler } from './template-compiler';

// Re-export commonly used types
export type {
  AotPlugin,
  CompilationContext, CompilationOptions, CompilationResult, CompilationStatistics, CompiledComponent, CompiledStyle, CompiledTemplate, ComponentMetadata, Diagnostic
} from './types';

// Re-export utilities
export {
  extractStyles, extractTemplate, generateComponentId, generateSourceMap, hashString, minifyCode, parseComponentDecorator, parseCss, parseHtml
} from './utils';

// Default export
export { createCompiler as default } from './factory';
