#!/usr/bin/env node
/**
 * Patch script for Claude Code CLI system prompt
 * Always restores from backup first, then applies patches
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Configuration
const EXPECTED_VERSION = '2.0.55';
const EXPECTED_HASH = '97641f09bea7d318ce5172d536581bb1da49c99b132d90f71007a3bb0b942f57';

// Allow custom path for testing
const basePath = process.argv[2] ||
  path.join(process.env.HOME, '.claude/local/node_modules/@anthropic-ai/claude-code/cli.js');
const backupPath = basePath + '.backup';

// Patches to apply (find → replace)
const patches = [
  {
    name: 'Remove duplicate emoji instruction in Edit tool',
    find: `- Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked.
- The edit will FAIL`,
    replace: `- The edit will FAIL`
  },
  {
    name: 'Remove duplicate emoji instruction in Write tool',
    find: `- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
- Only use emojis if the user explicitly requests it. Avoid writing emojis to files unless asked.`,
    replace: `- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.`
  },
  // Add more patches here as we identify them
];

// Helper: compute SHA256 hash
function sha256(filepath) {
  const content = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Main
function main() {
  console.log('Claude Code CLI Patcher');
  console.log('=======================\n');

  // 1. Check backup exists
  if (!fs.existsSync(backupPath)) {
    console.error(`Error: No backup found at ${backupPath}`);
    console.error('Run backup-cli.sh first.');
    process.exit(1);
  }

  // 2. Verify backup hash
  const backupHash = sha256(backupPath);
  if (backupHash !== EXPECTED_HASH) {
    console.error('Error: Backup hash mismatch');
    console.error(`Expected: ${EXPECTED_HASH}`);
    console.error(`Got:      ${backupHash}`);
    process.exit(1);
  }
  console.log(`Backup verified (v${EXPECTED_VERSION})`);

  // 3. Restore from backup
  fs.copyFileSync(backupPath, basePath);
  console.log('Restored from backup\n');

  // 4. Apply patches
  let content = fs.readFileSync(basePath, 'utf8');
  let appliedCount = 0;

  for (const patch of patches) {
    if (content.includes(patch.find)) {
      content = content.replace(patch.find, patch.replace);
      console.log(`[OK] ${patch.name}`);
      appliedCount++;
    } else {
      console.log(`[SKIP] ${patch.name} (not found)`);
    }
  }

  // 5. Write patched file
  fs.writeFileSync(basePath, content);

  // 6. Summary
  const newHash = sha256(basePath);
  const sizeDiff = fs.statSync(backupPath).size - fs.statSync(basePath).size;

  console.log('\n-----------------------');
  console.log(`Patches applied: ${appliedCount}/${patches.length}`);
  console.log(`Size reduction: ${sizeDiff} bytes`);
  console.log(`New hash: ${newHash}`);
}

main();
