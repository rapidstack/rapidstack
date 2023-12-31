import { beforeAll, describe, expect, test, vi } from 'vitest';

import { updateOrgPackageDependencies, validateVersion } from './tasks.js';

const deps = {
  '@org/bar': '1.0.0',
  '@org/foo': '*',
  '@test/bar': '1.0.0',
  '@test/foo': '*',
  'bar': '1.0.0',
  'foo': '1.0.0',
};

beforeAll(() => {
  // Disable logs for messages embedded in task functions
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('version-all command actions:', () => {
  describe('updateOrgPackageDependencies:', () => {
    test('should return all prefixed deps set to the provided version', () => {
      const newVersion = '2.0.0';
      const updatedDeps = updateOrgPackageDependencies({
        dependencies: deps,
        newVersion: newVersion,
        org: '@org',
        type: 'dependencies',
      });

      expect(updatedDeps).toEqual({
        '@org/bar': newVersion,
        '@org/foo': newVersion,
      });
    });
    test('should return an empty object if the org is not found', () => {
      const newVersion = '2.0.0';
      const updatedDeps = updateOrgPackageDependencies({
        dependencies: deps,
        newVersion: newVersion,
        org: '@other',
        type: 'dependencies',
      });

      expect(updatedDeps).toEqual({});
    });
  });
  describe('validateVersion:', () => {
    test('should take in a semver and validate it matches org schema', () => {
      const resolved = validateVersion('v1.0.0');
      expect(resolved).toBe('1.0.0');
    });
    test('should throw if the input does not match a valid org semver', () => {
      expect(() => validateVersion('bogus-string')).toThrow();
    });
  });
});
