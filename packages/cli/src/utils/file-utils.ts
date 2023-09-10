import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * A string token replacer function that will copy a file to the destination and
 * replace any {{tokens}} in the file with the values from the token object.
 * @param params The parameters for the function
 * @param params.source The path to the source file
 * @param params.destination The path to the destination file
 * @param params.tokenObject A key-value object where the key is the token to
 * replace and the value is the value to replace it with. Tokens are to be
 * defined in the file as `{{token}}`.
 */
export async function copyAndReplaceTokens(params: {
  destination: string;
  source: string;
  tokenObject: { [key: string]: string };
}): Promise<void> {
  const fileContents = await readFile(params.source, 'utf-8');

  const replacedContents = Object.entries(params.tokenObject).reduce(
    (contents, [token, value]) => {
      const tokenRegex = new RegExp(`{{${token}}}`, 'g');
      return contents.replace(tokenRegex, value);
    },
    fileContents
  );

  const destinationDir = dirname(params.destination);
  await mkdir(destinationDir, { recursive: true });

  await writeFile(params.destination, replacedContents);
}
