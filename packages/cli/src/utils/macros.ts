import chalk from 'chalk';

// import { PKG_VERSION, SST_VERSION } from '../_version.js';
const PKG_VERSION = '0.0.0';
const SST_VERSION = '0.0.0';

export const description =
  'A CLI to make working with rapidstack project easy!';

/**
 * String macro instructing user the next steps after project generation.
 * @param appDir The location of the created app
 * @returns Macro'd string with project info
 */
export function nextSteps(appDir: string): string {
  return `${chalk.bold.green('Successfully created project!')}
    
  ${chalk.underline('Next steps:            ')}
    1: cd ${appDir}
    2: git init
    3: npm install
    4: npm run dev`;
}

export const appStr = chalk.bold.ansi256(166)('rapidstack');

export const versionStr = `v${PKG_VERSION} ${chalk.italic.gray(
  `(utilizing sst@${SST_VERSION})`
)}`;

export const reactStr =
  'Adds a Vite React app to the project with the specified name. Can create several React apps by passing in multiple names separated by spaces.';

export const reactFailure = chalk.red(
  'The react project cannot be named "base", "core", or "root"! It would conflict with existing npm workspace names.'
);
