#!/usr/bin/env node
// ./bin/me.cli.js
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import Me from '../src/me.js';
import { validateSetup } from '../src/scripts/setup_validation.js';
validateSetup(); // Asegura que ~/.this y ~/.this/me existen antes de usar el CLI
const program = new Command();
const ME_DIR = path.join(os.homedir(), '.this', 'me');
// Utilidad para obtener ruta de archivo `.me`
const getMeFilePath = (username) => path.join(ME_DIR, `${username}.me`);
program
  .name('me')
  .description('CLI to manage this.me identities')
  .version('1.0.0');
// Comando: crear una identidad .me
program
  .command('create')
  .description('Create new .me identity')
  .action(async () => {
    const { username, hash } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Enter a username:',
      },
      {
        type: 'password',
        name: 'hash',
        message: 'Define your hash (secret key):',
        mask: '*',
      }
    ]);
    const mePath = getMeFilePath(username);
    if (existsSync(mePath)) {
      console.log(chalk.red(`❌ Identity '${username}' already exists.`));
      return;
    }
    const me = await Me.create(username, hash);
    console.log(chalk.green(`✅ Identity '${me.username}' created and saved as ${mePath}`));
  });

// Command: show identity contents
program
  .command('show')
  .description('Show contents of a .me identity')
  .argument('[username]', 'Username of the identity to show')
  .action(async (usernameArg) => {
    const { username, hash } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Enter username to view:',
        when: () => !usernameArg,
      },
      {
        type: 'password',
        name: 'hash',
        message: 'Enter your hash to unlock:',
        mask: '*',
      }
    ]);

    const finalUsername = usernameArg || username;

    try {
      const me = await Me.load(finalUsername, hash);
      console.log(chalk.cyan(`\n📂 Identity '${finalUsername}':\n`));
      console.log(JSON.stringify(me, null, 2));
    } catch (err) {
      console.log(chalk.red(`Error: ${err.message}`));
    }
  });

// Comando: listar identidades locales
program
  .command('list')
  .description('List available local .me identities')
  .action(async () => {
    const fs = await import('fs/promises');
    fs.readdir(ME_DIR)
      .then(files => {
        const meFiles = files.filter(file => file.endsWith('.me'));
        if (meFiles.length === 0) {
          console.log(chalk.yellow('⚠️  No registered identities found.'));
        } else {
          console.log(chalk.cyan('📇 Available identities:'));
          meFiles.forEach(file => console.log('•', file.replace('.me', '')));
          console.log(chalk.gray('\nTip: Use `me show` or `me show <username>` to view identity contents.'));
        }
      })
      .catch(err => console.log(chalk.red(`Error: ${err.message}`)));
  });

program.parse(process.argv);