/**
 * Example plugins for the ONEDOT-JS framework
 */

// Export the environment variable replacement plugin
export { EnvReplacePlugin } from './envReplace';

// Export example plugin manifests
export const EXAMPLE_PLUGINS = [
  {
    name: 'envReplace',
    version: '1.0.0',
    description: 'Replace environment variables in strings',
    main: require('./envReplace').EnvReplacePlugin,
    hooks: {
      'transform:string': 'transformString'
    },
    config: {
      prefix: '${',
      suffix: '}',
      fallback: ''
    }
  }
];

// Default export
export default {
  EnvReplacePlugin,
  EXAMPLE_PLUGINS
};
