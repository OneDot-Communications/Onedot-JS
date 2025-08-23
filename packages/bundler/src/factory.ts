import { Bundler } from './bundler';
import { BundleConfig, createDefaultConfig, createProductionConfig, mergeConfig } from './config';

export function createBundler(config?: BundleConfig): Bundler {
  const finalConfig = config
    ? mergeConfig(createDefaultConfig(), config)
    : createDefaultConfig();

  return new Bundler(finalConfig);
}

export function createProductionBundler(config?: BundleConfig): Bundler {
  const baseConfig = createProductionConfig();
  const finalConfig = config
    ? mergeConfig(baseConfig, config)
    : baseConfig;

  return new Bundler(finalConfig);
}

export function createDevelopmentBundler(config?: BundleConfig): Bundler {
  const baseConfig = createDefaultConfig();
  const finalConfig = config
    ? mergeConfig(baseConfig, config)
    : baseConfig;

  return new Bundler(finalConfig);
}

export function createCustomBundler(config: BundleConfig): Bundler {
  return new Bundler(config);
}

// Convenience functions for common configurations
export function createLibraryBundler(entry: string, output: string): Bundler {
  return createBundler({
    entry: { main: entry },
    output: {
      path: output,
      filename: '[name].js',
      library: {
        type: 'umd',
        name: 'Library'
      }
    },
    optimization: {
      minimize: true,
      treeShaking: true,
      usedExports: true
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM'
    }
  });
}

export function createWebAppBundler(entry: string, output: string): Bundler {
  return createBundler({
    entry: { main: entry },
    output: {
      path: output,
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].js',
      assetFilename: '[name].[contenthash][ext]'
    },
    optimization: {
      minimize: true,
      splitChunks: true,
      treeShaking: true,
      usedExports: true,
      concatenateModules: true
    },
    plugins: []
  });
}

export function createNodeAppBundler(entry: string, output: string): Bundler {
  return createBundler({
    entry: { main: entry },
    output: {
      path: output,
      filename: '[name].js',
      chunkFilename: '[name].js'
    },
    target: 'node',
    optimization: {
      minimize: false,
      splitChunks: false,
      treeShaking: true,
      usedExports: true
    }
  });
}

export function createMultiEntryBundler(entries: Record<string, string>, output: string): Bundler {
  return createBundler({
    entry: entries,
    output: {
      path: output,
      filename: '[name].js',
      chunkFilename: '[name].[contenthash].js'
    },
    optimization: {
      minimize: true,
      splitChunks: true,
      treeShaking: true,
      usedExports: true
    }
  });
}

// Factory for creating bundler with specific plugins
export function createBundlerWithPlugins(
  config: BundleConfig,
  plugins: any[]
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    plugins: [...(config.plugins || []), ...plugins]
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific optimization options
export function createBundlerWithOptimization(
  config: BundleConfig,
  optimization: any
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    optimization: {
      ...config.optimization,
      ...optimization
    }
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific resolve options
export function createBundlerWithResolve(
  config: BundleConfig,
  resolve: any
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    resolve: {
      ...config.resolve,
      ...resolve
    }
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific output options
export function createBundlerWithOutput(
  config: BundleConfig,
  output: any
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    output: {
      ...config.output,
      ...output
    }
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific devtool options
export function createBundlerWithDevtool(
  config: BundleConfig,
  devtool: string | false
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    devtool
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific mode
export function createBundlerWithMode(
  config: BundleConfig,
  mode: 'development' | 'production'
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    mode
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific target
export function createBundlerWithTarget(
  config: BundleConfig,
  target: string
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    target
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific externals
export function createBundlerWithExternals(
  config: BundleConfig,
  externals: Record<string, string>
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    externals
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific cache options
export function createBundlerWithCache(
  config: BundleConfig,
  cache: boolean
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    cache
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific context
export function createBundlerWithContext(
  config: BundleConfig,
  context: string
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    context
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific stats options
export function createBundlerWithStats(
  config: BundleConfig,
  stats: boolean | 'minimal' | 'normal' | 'verbose'
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    stats
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific bail option
export function createBundlerWithBail(
  config: BundleConfig,
  bail: boolean
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    bail
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific profile option
export function createBundlerWithProfile(
  config: BundleConfig,
  profile: boolean
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    profile
  });

  return new Bundler(finalConfig);
}

// Factory for creating bundler with specific parallelism option
export function createBundlerWithParallelism(
  config: BundleConfig,
  parallelism: number
): Bundler {
  const finalConfig = mergeConfig(createDefaultConfig(), {
    ...config,
    parallelism
  });

  return new Bundler(finalConfig);
}
