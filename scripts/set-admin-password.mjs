#!/usr/bin/env node
// Sets the admin login password: writes ADMIN_PASSWORD_HASH (and ADMIN_TOKEN_SECRET if missing) into an env file.
// Usage: npm run admin:set-password            (prompts, writes .env)
//        node scripts/set-admin-password.mjs --env-file path/to/.env < password.txt
import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const envFileFlag = process.argv.indexOf('--env-file');
const envFile = envFileFlag > -1 ? process.argv[envFileFlag + 1] : '.env';

function readHidden(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.startsWith(prompt)) process.stdout.write(prompt);
    };
    rl.question(prompt, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function readPassword() {
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');
  }
  const first = await readHidden('New admin password: ');
  const second = await readHidden('Repeat password: ');
  if (first !== second) throw new Error('Passwords do not match');
  return first;
}

function upsertEnv(text, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  if (pattern.test(text)) return text.replace(pattern, line);
  return `${text}${text && !text.endsWith('\n') ? '\n' : ''}${line}\n`;
}

const password = await readPassword();
if (password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
let env = existsSync(envFile) ? readFileSync(envFile, 'utf8') : '';
env = upsertEnv(env, 'ADMIN_PASSWORD_HASH', `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`);
if (!/^ADMIN_TOKEN_SECRET=.+$/m.test(env)) {
  env = upsertEnv(env, 'ADMIN_TOKEN_SECRET', randomBytes(32).toString('base64url'));
}
writeFileSync(envFile, env, { mode: 0o600 });
console.log(`Admin password saved to ${envFile}. Restart the API (systemctl --user restart blog-backend) to apply it.`);
