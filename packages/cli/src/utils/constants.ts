export const orgName = '@rapidstack';

export const semverRegex = new RegExp(
  [
    '/^(d+.d+.d+)', // major.minor.patch
    '(?:-([0-9A-Za-z-]+(?:.[0-9A-Fa-f]{7})?))?$/', // -prerelease.789abcd
  ].join(''),
  'i'
);
