// CLI/me_MainMenu.js
import inquirer from 'inquirer';
import chalk from 'chalk';
import AddMe from './AddMe.js'; // Corrected import statement
import LogMe from './LogMe.js'; // Corrected import statement

export async function meMainChoices() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose an action:',
      choices: ['Add .me', 'Log .me', new inquirer.Separator(), 'Exit'],
    },
  ]);

  switch (answers.action) {
    case 'Add .me':
      AddMe();
      break;
    case 'Log .me':
      LogMe();
      break;
    case 'Exit':
      console.log(chalk.green('Exiting...'));
      process.exit();
  }
}
