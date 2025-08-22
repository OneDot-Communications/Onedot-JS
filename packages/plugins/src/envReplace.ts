import { definePlugin, PluginContext } from './index.js';

export const envReplace = definePlugin({
  name: 'env-replace',
  async setup(ctx: PluginContext) {
    ctx.addTransform({
      name: 'env-inline',
      test: (id) => /\.[jt]s$/.test(id),
      transform(code) {
        return code.replace(/process\.env\.([A-Z0-9_]+)/g, (_m, key) => JSON.stringify(process.env[key] || ''));
      }
    });
  }
});