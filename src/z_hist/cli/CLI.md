Main CLI Application (main.ts)

This is the entry point for your CLI application.
It displays a welcome message and user information (host session and path).
It imports the CLI commands (commands.ts) and the interactive shell (shell.ts).
CLI Commands (commands.ts)

This part defines the CLI commands and options using the commander package.
Currently, it defines the commands: 'View Existing Profiles,' 'Create New Profile,' and 'Exit.'
Interactive Shell (shell.ts)

The interactive shell provides a user-friendly interface for interacting with the CLI.
selectMe: Presents a list of actions for the user to choose from.
createMe: Prompts the user for details to create a new Me profile.
writeMe: Writes the Me profile to the filesystem.
listMeProfiles: Lists all existing Me profiles.
selectProfile: Prompts the user to select a Me profile or go back to the main menu.



