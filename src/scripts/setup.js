// setup.js
import { mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
const root = path.join(homedir(), '.this');
const mePath = path.join(root, 'me');
if (!existsSync(root)) {
  mkdirSync(root);
  console.log('✅ Created ~/.this root directory');
} else {
  console.log('✅ ~/.this root directory already exists');
}

if (!existsSync(mePath)) {
  mkdirSync(mePath);
  console.log('✅ Created ~/.this/me directory');
} else {
  console.log('✅ ~/.this/me directory already exists');
}