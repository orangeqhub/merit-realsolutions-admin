/**
 * DS-0 verify — ensures critical ERP design tokens are declared.
 * Run: node scripts/verify-ds0-tokens.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tokensDir = path.resolve(__dirname, '../src/styles/tokens');

const required = [
  '--erp-color-primary',
  '--erp-color-booked',
  '--erp-color-reserved',
  '--erp-color-sold',
  '--erp-color-registered',
  '--erp-color-mortgaged',
  '--erp-space-4',
  '--erp-space-96',
  '--erp-radius-md',
  '--erp-elevation-glass',
  '--erp-duration-250',
  '--erp-ease-entrance',
  '--erp-z-drawer',
  '--erp-z-map-chrome',
  '--erp-control-h-md',
  '--erp-glass-bg',
  '--erp-a11y-min-touch',
  '--erp-bp-tablet-min',
  '--erp-icon-md',
  '--ws-glass', // legacy alias must exist
  '--color-navy', // legacy alias must exist
];

const files = fs.readdirSync(tokensDir).filter((f) => f.endsWith('.css'));
const blob = files.map((f) => fs.readFileSync(path.join(tokensDir, f), 'utf8')).join('\n');

const missing = required.filter((token) => !blob.includes(token));
if (missing.length) {
  console.error('DS0_VERIFY_FAIL missing tokens:', missing.join(', '));
  process.exit(1);
}

console.log('DS0_VERIFY_OK');
console.log(`Tokens scanned across ${files.length} files in src/styles/tokens`);
