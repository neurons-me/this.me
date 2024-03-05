#!/usr/bin/env node
import os from 'os';
/** Welcome. */
import printWelcome from './ascii_art/welcome.js';
printWelcome();
console.log(`Host_Session@ ${os.userInfo().username}`);
console.log(`v.path@ ${os.homedir()}/.me`);
/**
 * @module CLI
 * @description
 * .Me - Command Line Interface.
 *  The CLI application's code structure is categorized into two main parts:
 *  Command Definitions and Interactive Shell.*/
 
/***
 * Command Definitions:
 * Leverages the `commander` package to define the CLI commands and options. 
 **/
import program from './commands.js';
/***Interactive Shell:
 * Leverages the `inquirer` package to provide an interactive shell experience with prompts.
 * The `main` function orchestrates the CLI interactions.
 */
import { shell } from './shell.js';

/**
* Main function to handle the CLI interactions.
* Continuously prompts the user for actions until an exit command is given.
*/

async function main() {
printWelcome();
  let exit = false;
  while (!exit) {
      const choice = await shell.selectMe();
      switch (choice) {
         /**
             * Handles the 'View Existing Profiles' choice.
             * Lists and displays all existing .me profiles.
             */
         case 'View Existing Profiles':
          const selectedProfile = await shell.selectProfile();
          if (selectedProfile === 'back') {
              break;
          }
          // Read and display the selected profile details here
          console.log(`Selected profile: ${selectedProfile}`);
          // Add logic to handle the selected profile
          break;
          case 'Create New Profile':
            const newProfile = await shell.createMe(); // Or createMe if that's the name you're using
            shell.writeMe(newProfile);
            break;
          case 'Exit':
              console.log('Exiting .me CLI.');
              exit = true;
              break;
          default:
              console.log('Invalid choice. Please try again.');
      }
  }
}

if (process.argv.length > 2) {
  program.parse(process.argv);
} else {
  main();
}

// Error handling for CLI
process.on('uncaughtException', (err) => {
  console.error('An error occurred in the CLI:', err.message);
  process.exit(1);
});



