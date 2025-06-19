import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

const root = path.join(homedir(), '.this');
const mePath = path.join(root, 'me');

export function validateSetup() {
  let updated = false;

  if (!existsSync(root)) {
    mkdirSync(root);
    console.log('✅ Created ~/.this root directory');
    updated = true;
  }

  if (!existsSync(mePath)) {
    mkdirSync(mePath);
    console.log('✅ Created ~/.this/me directory');
    updated = true;
  }

  if (!updated) {
    console.log('.me >> init.');
  }
}

// Run directly if script is executed as entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  validateSetup();
}