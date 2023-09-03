import { spawn } from 'node:child_process';

/**
 * Executes a shell command in a given directory
 * @param cmd The shell command to execute, including all arguments
 * @param dir The directory to run the shell command in
 * @param env Any optional environment variables to set when running the command
 */
export async function shell(
  cmd: string,
  dir: string,
  env?: NodeJS.ProcessEnv
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {
      cwd: dir,
      env: {
        ...process.env,
        ...env,
      },
      shell: true,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

/**
 * Executes a shell command in a given directory and returns the value of the
 * stdout and stderr streams as strings for the intent of testing commands
 * @param cmd The shell command to execute, including all arguments
 * @param dir The directory to run the shell command in
 * @param env Any optional environment variables to set when running the command
 * @returns The stdout and stderr streams as strings
 */
export async function mockShell(
  cmd: string,
  dir: string,
  env?: NodeJS.ProcessEnv
): Promise<{ stderr: string; stdout: string }> {
  let stdout = '';
  let stderr = '';

  return new Promise((resolve) => {
    const child = spawn(cmd, {
      cwd: dir,
      env: {
        ...process.env,
        ...env,
      },
      shell: true,
    });

    child.stdout.on('data', (data) => {
      stdout += data;
    });

    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('error', () => resolve({ stderr, stdout }));
    child.on('exit', () => resolve({ stderr, stdout }));
  });
}
