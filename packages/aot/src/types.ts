export interface OptimizationOptions {
  enableMinification: boolean;
  enableDeadCodeElimination: boolean;
  enableTreeShaking: boolean;
  enableInlining: boolean;
  enableConstantFolding: boolean;
  enablePropertyAccessOptimization: boolean;
  sourceMap: boolean;
  target: 'es2015' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022';
  module: 'commonjs' | 'esm' | 'umd';
}

export interface ComponentMetadata {
  selector: string;
  template?: string;
  templateUrl?: string;
  styles?: string[];
  styleUrls?: string[];
  encapsulation?: 'none' | 'emulated' | 'shadowdom';
  changeDetection?: 'default' | 'onpush';
  inputs?: string[];
  outputs?: string[];
  host?: Record<string, string>;
  providers?: any[];
  viewProviders?: any[];
  queries?: any[];
  preserveWhitespaces?: boolean;
  interpolation?: [string, string];
}

export interface CompiledComponent {
  metadata: ComponentMetadata;
  template: CompiledTemplate;
  styles: CompiledStyle[];
  className: string;
  sourceMap?: any;
  dependencies: string[];
  size: number;
  id: string;
}

export interface CompiledTemplate {
  code: string;
  ast: any;
  dependencies: string[];
  size: number;
  sourceMap?: any;
}

export interface CompiledStyle {
  code: string;
  dependencies: string[];
  encapsulation: 'none' | 'emulated' | 'shadowdom';
  sourceMap?: any;
  id: string;
}

export interface CompilationResult {
  components: CompiledComponent[];
  diagnostics: Diagnostic[];
  statistics: CompilationStatistics;
  sourceMap?: any;
}

export interface CompilationOptions {
  basePath: string;
  entryFiles: string[];
  optimization: OptimizationOptions;
  metadata: Record<string, any>;
  plugins: AotPlugin[];
  outputDir?: string;
}

export interface CompilationStatistics {
  totalComponents: number;
  totalTemplates: number;
  totalStyles: number;
  compilationTime: number;
  optimizedSize: number;
  originalSize: number;
  savingsPercentage: number;
}

export interface Diagnostic {
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface AotPlugin {
  name: string;
  beforeCompile?: (context: CompilationContext) => Promise<void>;
  afterCompile?: (context: CompilationContext) => Promise<void>;
  beforeOptimize?: (context: CompilationContext) => Promise<void>;
  afterOptimize?: (context: CompilationContext) => Promise<void>;
}

export interface CompilationContext {
  options: CompilationOptions;
  components: CompiledComponent[];
  diagnostics: Diagnostic[];
  statistics: CompilationStatistics;
  sourceMap?: any;
}
