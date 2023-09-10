import { join } from 'node:path';

export const ORG_NAME = 'rapidstack' as const;

export const SEMVER_REGEX =
  /^(\d+\.\d+\.\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Fa-f]{7})?))?$/;

export const DEBUG_FLAG_REGEX = /^-([a-ce-z]*d[a-ce-z]*)$/i;

// prettier-ignore
export const ORG_PACKAGES = [ /*
  pkg                   dependencies  */
  'cli',                // ---
  'create',             // cli
  'create-plugin',      // cli
  // 'types',              // ---
  // 'test-utils',         // ---
  // 'cloud',              // types
  // 'lambda',             // test-utils, types
  // 'react',              // test-utils, types 
  // 'plugin-example',     // types
] as const;

export const DEFAULT_TEMPLATE_DIR = join(__dirname, '..', 'templates');
