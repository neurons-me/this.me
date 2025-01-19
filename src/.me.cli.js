#!/usr/bin/env node
//.me.cli.js
import { program } from 'commander';
import { meMainChoices } from './CLI/me_MainChoices.js';
import AddMe from './CLI/AddMe.js'; 
import LogMe from './CLI/LogMe.js'; 
program
  .description('.Me Command Line Interface')
  .version('1.0.0')
  .action(meMainChoices);

program.command('add-me')
  .description('+ Add .me')
  .action(AddMe);

program.command('log-me')
  .description('Log .me')
  .action(LogMe);

program.parse(process.argv);
