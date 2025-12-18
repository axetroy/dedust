/**
 * Integration tests
 */

const { describe, it, assertEqual, assertTrue, assertFalse } = require('./test-framework');
const { clean, parse } = require('../index');
const fs = require('fs');
const path = require('path');
const os = require('os');

function createTestDir(name) {
  const testDir = path.join(os.tmpdir(), `dust-test-${name}-${Date.now()}`);
  fs.mkdirSync(testDir, { recursive: true });
  return testDir;
}

function cleanupTestDir(testDir) {
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore
  }
}

describe('Integration - parse function', () => {
  it('should parse rules text', () => {
    const rules = `
      delete target when exists Cargo.toml
      delete node_modules when exists package.json
    `;
    const parsed = parse(rules);
    assertEqual(parsed.length, 2);
  });
});

describe('Integration - clean function', () => {
  it('should clean files based on rules', () => {
    const testDir = createTestDir('clean-simple');
    fs.writeFileSync(path.join(testDir, 'test.log'), 'log');
    
    const rules = 'delete *.log';
    const deleted = clean(rules, testDir);
    
    assertEqual(deleted.length, 1);
    assertFalse(fs.existsSync(path.join(testDir, 'test.log')));
    
    cleanupTestDir(testDir);
  });

  it('should handle multiple rules', () => {
    const testDir = createTestDir('clean-multiple');
    fs.writeFileSync(path.join(testDir, 'file.log'), 'log');
    fs.writeFileSync(path.join(testDir, 'file.tmp'), 'tmp');
    fs.writeFileSync(path.join(testDir, 'file.txt'), 'txt');
    
    const rules = `
      delete *.log
      delete *.tmp
    `;
    const deleted = clean(rules, testDir);
    
    assertEqual(deleted.length, 2);
    assertTrue(fs.existsSync(path.join(testDir, 'file.txt')));
    assertFalse(fs.existsSync(path.join(testDir, 'file.log')));
    assertFalse(fs.existsSync(path.join(testDir, 'file.tmp')));
    
    cleanupTestDir(testDir);
  });

  it('should support dry run', () => {
    const testDir = createTestDir('clean-dryrun');
    fs.writeFileSync(path.join(testDir, 'test.log'), 'log');
    
    const rules = 'delete *.log';
    const deleted = clean(rules, testDir, { dryRun: true });
    
    assertEqual(deleted.length, 1);
    assertTrue(fs.existsSync(path.join(testDir, 'test.log')));
    
    cleanupTestDir(testDir);
  });
});

describe('Integration - Real World Scenarios', () => {
  it('should clean Rust project', () => {
    const testDir = createTestDir('rust-project');
    fs.writeFileSync(path.join(testDir, 'Cargo.toml'), '[package]');
    fs.mkdirSync(path.join(testDir, 'target'));
    fs.writeFileSync(path.join(testDir, 'target', 'build.txt'), 'build');
    fs.mkdirSync(path.join(testDir, 'src'));
    
    const rules = 'delete target when exists Cargo.toml';
    const deleted = clean(rules, testDir);
    
    assertTrue(deleted.length > 0);
    assertFalse(fs.existsSync(path.join(testDir, 'target')));
    assertTrue(fs.existsSync(path.join(testDir, 'src')));
    
    cleanupTestDir(testDir);
  });

  it('should clean Node project', () => {
    const testDir = createTestDir('node-project');
    fs.writeFileSync(path.join(testDir, 'package.json'), '{}');
    fs.mkdirSync(path.join(testDir, 'node_modules'));
    fs.writeFileSync(path.join(testDir, 'node_modules', 'package.json'), '{}');
    fs.mkdirSync(path.join(testDir, 'src'));
    
    const rules = 'delete node_modules when exists package.json';
    const deleted = clean(rules, testDir);
    
    assertTrue(deleted.length > 0);
    assertFalse(fs.existsSync(path.join(testDir, 'node_modules')));
    assertTrue(fs.existsSync(path.join(testDir, 'src')));
    
    cleanupTestDir(testDir);
  });

  it('should clean Python project', () => {
    const testDir = createTestDir('python-project');
    fs.writeFileSync(path.join(testDir, 'pyproject.toml'), '[tool]');
    fs.mkdirSync(path.join(testDir, '.venv'));
    fs.writeFileSync(path.join(testDir, '.venv', 'pyvenv.cfg'), 'config');
    
    const rules = 'delete .venv when exists pyproject.toml';
    const deleted = clean(rules, testDir);
    
    assertTrue(deleted.length > 0);
    assertFalse(fs.existsSync(path.join(testDir, '.venv')));
    
    cleanupTestDir(testDir);
  });

  it('should clean log files in git repo', () => {
    const testDir = createTestDir('git-repo');
    fs.mkdirSync(path.join(testDir, '.git'));
    
    // Create a subdirectory where the log file will be
    const subDir = path.join(testDir, 'src');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, 'test.log'), 'log');
    fs.writeFileSync(path.join(subDir, 'app.js'), 'code');
    
    const rules = 'delete *.log when parents exists .git';
    const deleted = clean(rules, testDir);
    
    assertEqual(deleted.length, 1);
    assertFalse(fs.existsSync(path.join(subDir, 'test.log')));
    assertTrue(fs.existsSync(path.join(subDir, 'app.js')));
    
    cleanupTestDir(testDir);
  });

  it('should clean with complex condition', () => {
    const testDir = createTestDir('complex-condition');
    fs.writeFileSync(path.join(testDir, 'Cargo.toml'), '[package]');
    fs.mkdirSync(path.join(testDir, 'src'));
    fs.mkdirSync(path.join(testDir, 'target'));
    
    const rules = 'delete target when exists Cargo.toml and exists src';
    const deleted = clean(rules, testDir);
    
    assertTrue(deleted.length > 0);
    assertFalse(fs.existsSync(path.join(testDir, 'target')));
    
    cleanupTestDir(testDir);
  });

  it('should not clean with NOT condition', () => {
    const testDir = createTestDir('not-condition');
    fs.writeFileSync(path.join(testDir, 'Cargo.toml'), '[package]');
    fs.mkdirSync(path.join(testDir, 'target'));
    fs.writeFileSync(path.join(testDir, 'keep.txt'), 'keep');
    
    const rules = 'delete target when exists Cargo.toml and not exists keep.txt';
    const deleted = clean(rules, testDir);
    
    assertEqual(deleted.length, 0);
    assertTrue(fs.existsSync(path.join(testDir, 'target')));
    
    cleanupTestDir(testDir);
  });

  it('should handle monorepo structure', () => {
    const testDir = createTestDir('monorepo');
    
    // Create workspace structure
    fs.writeFileSync(path.join(testDir, 'Cargo.toml'), '[workspace]');
    
    const crate1 = path.join(testDir, 'crate1');
    fs.mkdirSync(crate1);
    fs.writeFileSync(path.join(crate1, 'Cargo.toml'), '[package]');
    fs.mkdirSync(path.join(crate1, 'target'));
    
    const crate2 = path.join(testDir, 'crate2');
    fs.mkdirSync(crate2);
    fs.writeFileSync(path.join(crate2, 'Cargo.toml'), '[package]');
    fs.mkdirSync(path.join(crate2, 'target'));
    
    const rules = 'delete target when parent exists Cargo.toml';
    const deleted = clean(rules, testDir);
    
    assertEqual(deleted.length, 2);
    assertFalse(fs.existsSync(path.join(crate1, 'target')));
    assertFalse(fs.existsSync(path.join(crate2, 'target')));
    
    cleanupTestDir(testDir);
  });
});
