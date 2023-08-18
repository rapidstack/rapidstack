/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable jsdoc/check-tag-names */

const { builtinModules } = require('module');

module.exports = {
  // @ts-check
  /**
   * @type {import("eslint").Rule.RuleModule}
   */
  'require-node-prefix': {
    // https://github.com/import-js/eslint-plugin-import/issues/2717#issuecomment-1556594437
    create: (context) => ({
      ImportDeclaration(node) {
        const { source } = node;

        if (source?.type === 'Literal' && typeof source.value === 'string') {
          const moduleName = source.value;

          if (
            builtinModules.includes(moduleName) &&
            !moduleName.startsWith('node:')
          ) {
            context.report({
              fix: (fixer) => fixer.replaceText(source, `"node:${moduleName}"`),
              message: `Import of built-in Node.js module "${moduleName}" must use the "node:" prefix.`,
              node: source,
            });
          }
        }
      },
    }),
    meta: {
      docs: {
        category: 'Best Practices',
        description:
          'Disallow imports of built-in Node.js modules without the `node:` prefix',
        recommended: true,
      },
      fixable: 'code',
      schema: [],
      type: 'problem',
    },
  },
};
