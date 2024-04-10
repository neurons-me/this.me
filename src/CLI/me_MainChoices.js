// CLI/me_MainMenu.js
import inquirer from 'inquirer';
import chalk from 'chalk';
import AddMe from './AddMe.js'; // Corrected import statement
import ConfirmIdentity from './ConfirmIdentity.js'; // Corrected import statement

export async function meMainChoices() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose an action:',
      choices: ['Add new .me username', 'Confirm existing .me identity', new inquirer.Separator(), 'Exit'],
    },
  ]);

  switch (answers.action) {
    case 'Add new .me username':
      AddMe();
      break;
    case 'Confirm existing .me identity':
      ConfirmIdentity();
      break;
    case 'Exit':
      console.log(chalk.green('Exiting .Me CLI.'));
      process.exit();
  }
}
