import { buildPackage, findRepoRoot } from './tasks.js';

/**
 * The action to be run when the `build-all` command is called. Builds all
 * packages in the monorepo.
 */
export async function action(): Promise<void> {
  const repoRoot = await findRepoRoot();

  // Build the first group of rapidstack packages that don't depend on each
  // other first.
  const firstGroup = [
    'cli',
    // 'types',
    // 'test-utils'
  ];
  const firstGroupJobs = firstGroup.map(async (pkg) => {
    await buildPackage(repoRoot, pkg);
  });
  await Promise.all(firstGroupJobs);

  // Build the second group of rapidstack packages that depend on the first
  // group.
  const secondGroup = [
    'create',
    'create-plugin',
    // 'cloud',
    'lambda',
    // 'react',
  ];
  const secondGroupJobs = secondGroup.map(async (pkg) => {
    await buildPackage(repoRoot, pkg);
  });
  await Promise.all(secondGroupJobs);
}
