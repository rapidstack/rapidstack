import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { open, type ZipFile } from 'yauzl-promise';

// The types for yauzl-promise are wrong as of writing this...
type FixedZipFile = ZipFile & {
  filename: string;
  openReadStream(): Promise<NodeJS.ReadableStream>;
};
type FixedZip = FixedZipFile & AsyncIterableIterator<FixedZipFile>;

/**
 * Unzips the assets from the asset zip file to the destination path.
 * @param assetZipPath The path to the asset zip file.
 * @param destinationPath The path to unzip the assets to.
 */
export async function initializeZipAssets(
  assetZipPath: string,
  destinationPath: string
): Promise<void> {
  const zip = await open(assetZipPath);
  try {
    for await (const entry of zip as FixedZip) {
      const [firstSlug] = entry.filename.split('/');
      const strippedPath = entry.filename.replace(`${firstSlug}/`, '');
      const destination = join(destinationPath, strippedPath);

      if (entry.filename.endsWith('/')) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        await mkdir(destination);
        continue;
      }

      const readStream = await entry.openReadStream();
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const writeStream = createWriteStream(destination);
      await pipeline(readStream, writeStream);
    }
  } finally {
    await zip.close();
  }
}
