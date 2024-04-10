//CLI/AddMe.js
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const getConfigPath = () => path.join(process.env.HOME, '.me_config');

const saveNewUser = (username) => {
  const configPath = getConfigPath();
  let users = [];
  if (fs.existsSync(configPath)) {
    users = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  users.push(username);
  fs.writeFileSync(configPath, JSON.stringify(users));
};

const AddMe = async () => {
  const response = await inquirer.prompt([
    {
      type: 'input',
      name: 'newMe',
      message: 'Enter your new .me username:',
      // Validate input: adjust as per your validation rules
      validate: (input) => !!input.trim() || 'Username cannot be empty!',
    },
  ]);

  const newMe = response.newMe.trim();
  saveNewUser(newMe);
  console.log(chalk.green(`New .me username added: ${newMe}`));
};

export default AddMe;
