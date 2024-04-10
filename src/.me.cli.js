#!/usr/bin/env node

import { program } from 'commander';
import { meMainChoices } from './CLI/me_MainChoices.js';
import AddMe from './CLI/AddMe.js'; // Corrected import statement
import ConfirmIdentity from './CLI/ConfirmIdentity.js'; // Corrected import statement
program
  .description('.Me Command Line Interface')
  .version('1.0.0')
  .action(meMainChoices);

program.command('add-me')
  .description('Add a new .me username')
  .action(AddMe);

program.command('confirm-identity')
  .description('Confirm your .me identity')
  .action(ConfirmIdentity);

program.parse(process.argv);
