import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { initializeZipAssets } from './zip-util.js';

const TMP_DIR_PREFIX = 'rapidstack-tmp';

/**
 * Creates a temporary directory for testing and tears it down after the tests.
 * @param id a unique identifier for the temp directory.
 * @param assetsZipPath an optional path to a zip file containing assets to
 * initialize the temp directory with.
 * @returns The path to the temp directory.
 */
export async function setupTempDir(
  id: string,
  assetsZipPath?: string
): Promise<string> {
  const tempDirPathPrefix = join(
    tmpdir(),
    `${TMP_DIR_PREFIX}-${id}-${Date.now()}-`
  );

  const tempDir = await mkdtemp(tempDirPathPrefix);
  if (assetsZipPath) await initializeZipAssets(assetsZipPath, tempDir);
  return tempDir;
}

/**
 * Deletes the temp directory created by `setupTempDir`.
 * @param tempDir the path to the temp directory to tear down.
 */
export function tearDownTempDir(tempDir: string): void {
  rm(tempDir, { recursive: true });
}
