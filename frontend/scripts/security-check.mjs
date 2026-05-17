import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

function git(args) {
  return execFileSync('git', args, { cwd: process.cwd(), encoding: 'utf8' }).trim();
}

const repoRoot = git(['rev-parse', '--show-toplevel']);
const trackedFiles = git(['ls-files'])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((file) => file.replace(/\\/g, '/'));

const failures = [];

function addFailure(message) {
  failures.push(message);
}

for (const file of trackedFiles) {
  const name = basename(file);
  if ((name === '.env' || name === '.env.local' || /^\.env\..+/.test(name)) && name !== '.env.example') {
    addFailure(`tracked env file: ${file}`);
  }
  if (/\.(sqlite|sqlite3|db|dump)$/i.test(name)) {
    addFailure(`tracked database/dump file: ${file}`);
  }
  if (/private_feedback_.*\.json$/i.test(name)) {
    addFailure(`tracked private feedback export: ${file}`);
  }
  if (/(^|\/)(data|backups|dumps|exports)\//i.test(file)) {
    addFailure(`tracked private data directory file: ${file}`);
  }
}

const frontendSourceFiles = trackedFiles.filter((file) => file.startsWith('frontend/src/') && /\.(ts|tsx|js|jsx|json|css|html)$/i.test(file));
for (const file of frontendSourceFiles) {
  const text = readFileSync(join(repoRoot, file), 'utf8');
  for (const token of ['DATABASE_URL', 'JWT_SECRET', 'API_SECRET_KEY']) {
    if (text.includes(token)) addFailure(`frontend source contains backend secret token ${token}: ${file}`);
  }
}

const secretPatterns = [
  { name: 'OpenAI-style key', regex: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: 'GitHub token', regex: /gh[pousr]_[A-Za-z0-9_]{20,}/ },
  { name: 'AWS access key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Google API key', regex: /AIza[0-9A-Za-z_-]{20,}/ },
  { name: 'Slack token', regex: /xox[baprs]-[0-9A-Za-z-]{20,}/ },
];

const secretScanFiles = trackedFiles.filter((file) => {
  if (file === '.env.example') return false;
  if (file.startsWith('docs/')) return false;
  if (file === 'frontend/scripts/security-check.mjs') return false;
  if (/package-lock\.json$/i.test(file)) return false;
  if (!/\.(ts|tsx|js|jsx|json|md|py|toml|yml|yaml|txt|css|html)$/i.test(file)) return false;
  return existsSync(join(repoRoot, file));
});

for (const file of secretScanFiles) {
  const text = readFileSync(join(repoRoot, file), 'utf8');
  for (const pattern of secretPatterns) {
    if (pattern.regex.test(text)) addFailure(`possible ${pattern.name}: ${file}`);
  }
}

if (failures.length) {
  console.error('security:check failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('security:check passed');
