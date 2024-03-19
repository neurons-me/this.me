#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import os from 'os';
import path from 'path';

let ia = ".Lisa";

// Load or initialize .me usernames from the configuration file
const getConfigPath = () => path.join(os.homedir(), '.me_config');
const getExistingUsers = () => {
  const configPath = getConfigPath();
  return fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8').split('\n').filter(Boolean) : [];
};

// Save a new .me username to the configuration file
const saveNewUser = (username) => {
  const existingUsers = getExistingUsers();
  existingUsers.push(username);
  fs.writeFileSync(getConfigPath(), existingUsers.join('\n'));
};

// Define the main function
async function main() {
  console.log(chalk.yellow(`Hello, I am ${ia}`));

  try {
    let existingUsers = getExistingUsers();
    let choices = existingUsers.length > 0 ? existingUsers : ['Add.Me'];
    if (!choices.includes('Add.Me')) {
      choices.push('Add.Me');
    }

    // Ask for identification
    const identification = await inquirer.prompt([
      {
        type: 'list',
        name: 'me',
        message: 'Who are you?',
        choices: choices,
      }
    ]);

    let usrme;
    if (identification.me === 'Add.Me') {
      const newMeResponse = await inquirer.prompt([
        {
          type: 'input',
          name: 'user.me',
          message: 'Enter your user.me:',
          validate: input => /^[a-z]{1,12}$/.test(input) || 'Username must be 1-12 lowercase letters without special characters.',
        }
      ]);
      usrme = newMeResponse.newMe;
      saveNewUser(usrme);
      console.log(chalk.green(`New .me username added: ${usrme}`));
    } else {
      usrme = identification.me;
      console.log(chalk.green(`Identity confirmed: ${usrme}`));
    }

    // Proceed with host owner authentication and network identifier
    console.log(chalk.yellow('Proceeding with Host Owner Authentication...'));
    // Placeholder for authentication - implement the required logic here
    console.log(chalk.green('Authenticated!'));

    console.log(chalk.yellow('Retrieving Network Identifier (DID)...'));
    // Placeholder for DID retrieval - implement the required logic here
    console.log(chalk.green('Network Identifier (DID) retrieved!'));

  } catch (error) {
    console.error(chalk.red(`An error occurred: ${error.message}`));
  }
}

// Execute the main function
main();
