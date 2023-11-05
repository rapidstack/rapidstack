import { spawn } from 'node:child_process';

/**
 * Executes a shell command in a given directory.
 *
 * This is the same function that
 * is exported from the `@rapidstack/cli` package but is designed to just have
 * the stdio available for successes and errors.
 * @param params the params object
 * @param params.cmd The shell command to execute, including all arguments
 * @param params.dir The directory to run the shell command in
 * @param params.stdio The stdio option to pass to `child_process.spawn`. If
 * `inherit`, the command will be run in the current process and the promise
 * will resolve with an empty string (since the stdio of the command will be
 * output to the stdio of the node process). Otherwise, the promise will resolve
 * with the stdout and stderr of the command.
 * @param params.env Any optional shell env vars to set when running the command
 * @returns A promise that resolves with the stdout and stderr of the command if
 * called without `stdio: 'inherit'`, otherwise resolves with an empty string.
 */
async function shell(params: {
  cmd: string;
  dir: string;
  env?: { [key: string]: null | string | undefined };
  stdio?: 'inherit' | undefined;
}): Promise<{ stderr: string; stdout: string }> {
  let stdout = '';
  let stderr = '';

  return new Promise((resolve, reject) => {
    const child = spawn(params.cmd, {
      cwd: params.dir,
      env: {
        ...process.env,
        ...params.env,
      } as NodeJS.ProcessEnv,
      shell: true,
      stdio: params.stdio,
    });
    if (
      params.stdio === 'inherit' ||
      child.stdout === null ||
      child.stderr === null
    ) {
      child.on('error', reject);
      child.on('exit', (code) => {
        if (code === 0) resolve({ stderr, stdout });
        reject(new Error(`Process exited with code ${code}`));
      });
    } else {
      child.stdout.on('data', (data) => {
        stdout += data;
      });

      child.stderr.on('data', (data) => {
        stderr += data;
      });

      child.on('error', () => reject(stderr));
      child.on('exit', (code) => {
        if (code === 0) resolve({ stderr, stdout });
        reject(new Error(JSON.stringify({ stderr, stdout })));
      });
    }
  });
}

/**
 * Executes a shell command in a given directory to inspect the stdout and
 * stderr for behavior.
 * @param params the params object
 * @param params.cmd The shell command to execute, including all arguments
 * @param params.dir The directory to run the shell command in
 * @param params.env Any optional shell env vars to set when running the command
 * @returns A promise that resolves with the stdout and stderr of the command
 */
export async function mockShell(
  params: Omit<Parameters<typeof shell>[0], 'stdio'>
): Promise<{ stderr: string; stdout: string }> {
  return await shell(params).catch((err) => JSON.parse(err.message));
}
