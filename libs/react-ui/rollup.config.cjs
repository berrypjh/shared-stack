const url = require('@rollup/plugin-url');
const svg = require('@svgr/rollup');

/**
 * Rollup strips module-level directives. `plugin` records modules whose source starts
 * with 'use client'; `banner` re-adds the directive to the chunk that holds them.
 * The banner is an output option, not a plugin hook, so it lands on line 1.
 */
const clientDirective = () => {
  const clientIds = new Set();
  return {
    plugin: {
      name: 'record-use-client',
      transform(code, id) {
        if (/^\s*['"]use client['"]/.test(code)) clientIds.add(id);
      },
    },
    banner: (chunk) => (chunk.moduleIds.some((id) => clientIds.has(id)) ? "'use client';" : ''),
  };
};

module.exports = (config) => {
  const directive = clientDirective();
  config.plugins = config.plugins ?? [];
  // One chunk per module, so server-safe modules (cx, themes, Web) stay free of the directive.
  config.output = config.output.map((output) => ({
    ...output,
    preserveModules: true,
    preserveModulesRoot: 'libs/react-ui/src',
    banner: directive.banner,
  }));

  config.plugins.push(
    directive.plugin,
    svg({
      svgo: false,
      titleProp: true,
      ref: true,
    }),
    url({
      limit: 10000,
    }),
  );

  return config;
};
