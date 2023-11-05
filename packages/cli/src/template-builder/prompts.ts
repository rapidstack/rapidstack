import inquirer from 'inquirer';

import { RapidstackCliError } from '../index.js';

/**
 * Provides a standard way to prompt a user for a string value.
 * @param defaultValue the default value to be used
 * @returns the value provided by the user or the default value
 * @throws a `RapidstackCliError` if there was an error prompting for a string
 */
export async function stringPrompt(
  defaultValue: string | undefined
): Promise<string> {
  return await inquirer
    .prompt({
      default: defaultValue,
      message: 'What is the name of your project?',
      name: 'prompt',
      type: 'input',
    })
    .then((answer) => answer.prompt)
    .catch((err) => {
      throw new RapidstackCliError(
        'There was an error prompting for a string value: ' + err.toString()
      );
    });
}

/**
 * Provides a standard way to prompt a user for a list of choices.
 * @param choices the choices to be presented to the user
 * @param defaultValue the default value to be used
 * @returns the value provided by the user or the default value
 * @throws a `RapidstackCliError` if there was an error prompting for the list
 */
export async function listPrompt(
  choices: string[],
  defaultValue: string | undefined
): Promise<string> {
  return await inquirer
    .prompt({
      choices,
      default: defaultValue,
      message: 'Choose a project type',
      name: 'prompt',
      type: 'list',
    })
    .then((answer) => answer.prompt)
    .catch((err) => {
      throw new RapidstackCliError(
        'There was an error prompting for a list of options: ' + err.toString()
      );
    });
}
