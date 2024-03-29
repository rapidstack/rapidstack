/*
 * Note: This file requires a build before running.
 */

import {
  mockShell,
  setupTempDir,
  tearDownTempDir,
} from '@rapidstack/test-utils';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const cli = `node ${join(__dirname, '../../../bin/rapidstack-cli.mjs')}`;
const cmd = `version-all`;

const testTemplateAssets = join(__dirname, 'test', 'assets.zip');
let tempDir = '';
beforeAll(async () => {
  tempDir = await setupTempDir(cmd, testTemplateAssets);
});
afterAll(async () => void tearDownTempDir(tempDir));

describe(`${cmd} integration tests:`, () => {
  describe('fail cases', () => {
    test('should return error if no version is provided', async () => {
      const { stderr } = await mockShell({
        cmd: `${cli} ${cmd}`,
        dir: tempDir,
      });

      expect(stderr).toContain('error: missing required argument');
    });
    test('should return error if semver is invalid', async () => {
      const { stderr } = await mockShell({
        cmd: `${cli} ${cmd} abc123`,
        dir: tempDir,
      });

      expect(stderr).toContain('Please use a valid semver format');
    });
  });
  describe('success cases', () => {
    test('should version all nested package.json `version` keys', async () => {
      const rootPkg = join(tempDir, 'package.json');
      const nested1Pkg = join(tempDir, 'nest1', 'package.json');
      const nested2Pkg = join(tempDir, 'nest1', 'nest2', 'package.json');
      const { stderr } = await mockShell({
        cmd: `${cli} ${cmd} v1.2.3`,
        dir: tempDir,
      });

      expect(stderr).toBeFalsy();
      expect(getPackageJson(rootPkg).version).toBe('1.2.3');
      expect(getPackageJson(nested1Pkg).version).toBe('1.2.3');
      expect(getPackageJson(nested2Pkg).version).toBe('1.2.3');
    });
    test('should version all org deps in nested package.json', async () => {
      const rootPkg = join(tempDir, 'package.json');
      const nested1Pkg = join(tempDir, 'nest1', 'package.json');
      const nested2Pkg = join(tempDir, 'nest1', 'nest2', 'package.json');
      const { stderr } = await mockShell({
        cmd: `${cli} ${cmd} v1.2.3`,
        dir: tempDir,
      });
      const output = {
        '@rapidstack/asterisk-dep': '1.2.3',
        '@rapidstack/versioned-dep': '1.2.3',
        '@unrelated-pkg/dep': '0.0.0',
      };

      expect(stderr).toBeFalsy();
      expect(getPackageJson(rootPkg).dependencies).toStrictEqual(output);
      expect(getPackageJson(nested1Pkg).dependencies).toStrictEqual(output);
      expect(getPackageJson(nested2Pkg).dependencies).toStrictEqual(output);
    });
    test('should version all org dev-deps in nested package.json', async () => {
      const rootPkg = join(tempDir, 'package.json');
      const nested1Pkg = join(tempDir, 'nest1', 'package.json');
      const nested2Pkg = join(tempDir, 'nest1', 'nest2', 'package.json');
      const { stderr } = await mockShell({
        cmd: `${cli} ${cmd} v1.2.3`,
        dir: tempDir,
      });
      const output = {
        '@rapidstack/asterisk-dev': '1.2.3',
        '@rapidstack/versioned-dev': '1.2.3',
        '@unrelated-pkg/dev': '0.0.0',
      };

      expect(stderr).toBeFalsy();
      expect(getPackageJson(rootPkg).devDependencies).toStrictEqual(output);
      expect(getPackageJson(nested1Pkg).devDependencies).toStrictEqual(output);
      expect(getPackageJson(nested2Pkg).devDependencies).toStrictEqual(output);
    });
  });
});

function getPackageJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8')) as {
    dependencies: { [key: string]: string };
    devDependencies: { [key: string]: string };
    version: string;
  };
}
