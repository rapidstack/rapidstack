/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable perfectionist/sort-objects */

import inquirer from 'inquirer';
import { cp } from 'node:fs/promises';
import { join } from 'node:path';

import { type log } from '../../../src/utils/logger.js';

type CreateCliContext = {
  logger: typeof log;
  targetDirectory: string;
  templateDirectory: string;
};

/**
 * Main idea:
 * The questions are asked of a user in the order that the array is defined.
 * From there, there are different "types" of questions that can be asked.
 * The template creator is free to defined their own prompts and how they behave
 * but there will be some built in prompts that can be used.
 *
 * The template parameters should be defined in a way that they can be used via
 * CLI flags directly as well as via the prompts.
 *
 * After the prompt phase is complete, the types are organized into groups,
 * based upon when they should run. The groups are then executed in parallel.
 *
 * Types:
 * - token-replacer
 * - fs-action
 */

export default {
  version: '1.0',
  parameters: [
    {
      type: 'token-replacer',
      name: 'project-name',
      token: 'PROJECT_NAME',
      default: 'rapidstack-project',
      async prompt(defaultValue: string): Promise<string> {
        const prompt = await inquirer.prompt({
          type: 'input',
          name: 'projectName',
          message: 'What is the name of your project?',
          default: defaultValue,
        });
        return prompt.projectName;
      },
      async action(): Promise<boolean> {
        return true;
      },
    },
    {
      type: 'file-action',
      name: 'add-ts-config',
      default: false,
      async prompt(defaultValue: {}): Promise<boolean | number | string> {
        return defaultValue as boolean;
      },
      async action(context: CreateCliContext): Promise<boolean> {
        return await cp(
          join(context.templateDirectory, 'tsconfig.json'),
          join(context.targetDirectory, 'tsconfig.json')
        )
          .then(() => true)
          .catch((err) => {
            context.logger.error(err);
            return false;
          });
      },
    },
  ],
};
