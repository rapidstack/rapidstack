import { build } from 'esbuild';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { RapidstackCliError, TMP_DIR_PREFIX } from '../../index.js';
import { CONFIG_SUBDIRECTORY, MANIFEST_FILENAME } from './constants.js';

type ManifestFile = {
  manifest: {
    [key: string]: {
      config: string;
      directory: string;
    };
  };
  version: string;
};

/**
 * Looks for a rapidstack template directory and returns the contents of the
 * manifest file for all templates within.
 * @param templatePath the base path to the template directory
 * @returns the contents of the manifest file
 * @throws a `RapidstackCliError` if the template directory was not found,
 * manifest file doesn't exist, or if manifest does not contain any templates.
 */
export async function getTemplateManifest(
  templatePath: string
): Promise<ManifestFile> {
  if (!(await stat(templatePath).catch(() => false))) {
    throw new RapidstackCliError(
      `Template directory [${templatePath}] not found.`
    );
  }

  const manifestPath = join(templatePath, MANIFEST_FILENAME);

  const file = await readFile(manifestPath, 'utf-8').catch(() => {
    throw new RapidstackCliError('Could not read manifest file');
  });
  const parsedFile = JSON.parse(file) as ManifestFile;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!parsedFile.manifest || Object.keys(parsedFile.manifest).length === 0) {
    throw new RapidstackCliError(
      'Manifest file does not contain any templates'
    );
  }

  return parsedFile;
}

/**
 * Creates a temporary directory for use in the create command.
 * @returns the path to the temporary directory
 * @throws a `RapidstackCliError` if the temporary directory could not be
 * created
 */
export async function createProjectStagingDirectory(): Promise<string> {
  const tempDirPathPrefix = join(
    tmpdir(),
    `${TMP_DIR_PREFIX}-create-${Date.now()}-`
  );
  const tempDir = await mkdtemp(tempDirPathPrefix).catch((err) => {
    throw new RapidstackCliError(
      `Could not create temporary directory - ${err.toString()}`
    );
  });
  return tempDir;
}

export type TemplateConfig = {
  parameters: {
    action: () => Promise<boolean>;
    default: string;
    name: string;
    prompt: () => Promise<string>;
    token: string;
    type: string;
  }[];
  version: string;
};

/**
 * Compiles the template config file to a temporary directory and returns the
 * compiled config file.
 * @param templateConfigPath the path to the template config file
 * @param tempDir the path to the temporary directory
 * @returns the config for the given template
 * @throws a `RapidstackCliError` if the config file could not be compiled or
 * found
 */
export async function getTemplateConfig(
  templateConfigPath: string,
  tempDir: string
): Promise<TemplateConfig> {
  const compiledConfigPath = join(tempDir, CONFIG_SUBDIRECTORY, 'config.mjs');
  await build({
    banner: {
      js: [
        `import { createRequire as topLevelCreateRequire } from 'module';`,
        `const require = topLevelCreateRequire(import.meta.url);`,
      ].join(''),
    },
    bundle: true,
    entryPoints: [templateConfigPath],
    format: 'esm',
    keepNames: true,
    logLevel: process.env.DEBUG_LOGGING ? 'debug' : 'silent',
    outfile: compiledConfigPath,
    platform: 'node',
    target: 'esnext',
  });

  const config = await import(compiledConfigPath)
    .then((exports) => exports.default)
    .catch((err) => {
      throw new RapidstackCliError(
        `Could not import config [${compiledConfigPath}] - ${err.toString()}`
      );
    });

  if (!config) {
    throw new RapidstackCliError(
      `Could not import config [${compiledConfigPath}]. Import returned falsy.`
    );
  }

  return config;
}

/**
 * Cleans the process.argv array to remove any rapidstack cli arguments that
 * relate to calls aimed towards `rapidstack create`. This includes the
 * `--template` and `--template-dir` flags which are used by the outer command.
 * @param args the rapidstack cli arguments to be cleaned
 * @returns the cleaned arguments
 */
export function cleanCliArgs(args: string[]): string[] {
  const createCmdIndex = args.indexOf('create');
  const cleanArgs = process.argv.slice(createCmdIndex + 1);

  const templateIndex = args.indexOf('--template');
  if (templateIndex !== -1) cleanArgs.splice(templateIndex, 2);

  const templateDirIndex = args.indexOf('--template-dir');
  if (templateDirIndex !== -1) cleanArgs.splice(templateDirIndex, 2);
  return cleanArgs;
}
