// Source: CLI/ConfirmIdentity.js
import inquirer from 'inquirer';
import chalk from 'chalk';

const getExistingUsers = () => {
  // Simulate fetching existing users: adjust to your actual logic
  return ['user1', 'user2'];  // Example user names
};

const ConfirmIdentity = async () => {
  const existingUsers = getExistingUsers();

  const response = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedUser',
      message: 'Confirm your identity:',
      choices: existingUsers,
    },
  ]);

  const selectedUser = response.selectedUser;
  console.log(chalk.green(`Identity confirmed: ${selectedUser}`));
};

export default ConfirmIdentity;
