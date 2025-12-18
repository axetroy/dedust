#!/usr/bin/env node

/**
 * CLI for dust
 */

const { cleanFromFile, clean } = require('./index');
const fs = require('fs');
const path = require('path');

function printUsage() {
  console.log(`
Usage: dust [options] <rules-file> [directory]

Options:
  --dry-run, -d    Show what would be deleted without deleting
  --help, -h       Show this help message
  --version, -v    Show version

Arguments:
  rules-file       Path to file containing dust rules
  directory        Directory to clean (defaults to current directory)

Examples:
  dust rules.dust              # Clean current directory
  dust rules.dust /path/to/dir # Clean specified directory
  dust --dry-run rules.dust    # Show what would be deleted
  `);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('./package.json');
    console.log(pkg.version);
    process.exit(0);
  }
  
  let dryRun = false;
  let rulesFile = null;
  let targetDir = process.cwd();
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--dry-run' || arg === '-d') {
      dryRun = true;
    } else if (!rulesFile) {
      rulesFile = arg;
    } else if (i === args.length - 1 || args[i + 1].startsWith('-')) {
      targetDir = arg;
    }
  }
  
  if (!rulesFile) {
    console.error('Error: rules file is required');
    printUsage();
    process.exit(1);
  }
  
  if (!fs.existsSync(rulesFile)) {
    console.error(`Error: rules file not found: ${rulesFile}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(targetDir)) {
    console.error(`Error: target directory not found: ${targetDir}`);
    process.exit(1);
  }
  
  console.log(`Rules file: ${rulesFile}`);
  console.log(`Target directory: ${targetDir}`);
  console.log(`Dry run: ${dryRun}`);
  console.log('');
  
  try {
    const deleted = cleanFromFile(rulesFile, targetDir, { dryRun });
    
    if (deleted.length === 0) {
      console.log('No files to delete.');
    } else {
      if (dryRun) {
        console.log('Would delete:');
      } else {
        console.log('Deleted:');
      }
      
      for (const file of deleted) {
        console.log(`  ${file}`);
      }
      
      console.log('');
      console.log(`Total: ${deleted.length} file(s)`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
