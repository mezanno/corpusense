import { execSync } from 'child_process';
import fs from 'fs';

const buildDate = new Date().toISOString();
const gitHash = execSync('git rev-parse --short HEAD').toString().trim();

const envContent = `
VITE_BUILD_DATE=${buildDate}
VITE_GIT_HASH=${gitHash}
`.trim();

fs.writeFileSync('.env.production.local', envContent);

console.log('✔ .env.production.local generated');
