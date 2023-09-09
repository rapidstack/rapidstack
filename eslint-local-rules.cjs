// @ts-check

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable jsdoc/check-tag-names */

const { builtinModules } = require('module');

/**
 * @type {Record<string, import("eslint").Rule.RuleModule>}
 */
const rules = {
  'jsdoc-require-throws-async': {
    create: (context) => ({
      FunctionDeclaration(node) {
        if (!node.async) return;

        const jsdoc = context.sourceCode.getJSDocComment(node);
        const hasThrow = checkForThrows(node);
        const jsDocHasThrows = jsdoc?.value?.includes('@throws');

        if (hasThrow && !jsDocHasThrows) {
          context.report({
            message: `Missing JSDoc @throws for function`,
            node,
          });
        }
      },
    }),
  },
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

module.exports = rules;

/**
 * Determines if a function contains a throw statement.
 * Used in the 'jsdoc-require-throws-async' rule.
 * @param node {object}
 * @returns value
 */
function checkForThrows(node) {
  if (node.type === 'ThrowStatement') return true;
  const nodeToCheck = node.body || node.consequent || node.alternate;
  if (!nodeToCheck) return false;

  if (!nodeToCheck.body) return checkForThrows(nodeToCheck);
  if (!Array.isArray(nodeToCheck.body)) return checkForThrows(nodeToCheck.body);

  for (const child of nodeToCheck.body) {
    if (checkForThrows(child)) return true;
  }
}
