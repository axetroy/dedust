/**
 * Executor tests
 */

const { describe, it, assertEqual, assertTrue, assertFalse } = require('./test-framework');
const { executeRule, evaluateCondition, checkExists } = require('../executor');
const { parseRule } = require('../parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper to create test directory structure
function createTestDir(name) {
  const testDir = path.join(os.tmpdir(), `dust-test-${name}-${Date.now()}`);
  fs.mkdirSync(testDir, { recursive: true });
  return testDir;
}

// Helper to cleanup test directory
function cleanupTestDir(testDir) {
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore
  }
}

describe('Executor - checkExists', () => {
  it('should check exists in current directory', () => {
    const testDir = createTestDir('exists-here');
    fs.writeFileSync(path.join(testDir, 'test.txt'), 'hello');
    
    const result = checkExists(testDir, 'here', 'test.txt');
    assertTrue(result);
    
    cleanupTestDir(testDir);
  });

  it('should return false if file does not exist', () => {
    const testDir = createTestDir('not-exists');
    
    const result = checkExists(testDir, 'here', 'missing.txt');
    assertFalse(result);
    
    cleanupTestDir(testDir);
  });

  it('should check exists in parent directory', () => {
    const testDir = createTestDir('exists-parent');
    const subDir = path.join(testDir, 'sub');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(testDir, 'parent.txt'), 'parent');
    
    const result = checkExists(subDir, 'parent', 'parent.txt');
    assertTrue(result);
    
    cleanupTestDir(testDir);
  });

  it('should check exists in parents (ancestors)', () => {
    const testDir = createTestDir('exists-parents');
    const subDir = path.join(testDir, 'a', 'b', 'c');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'root.txt'), 'root');
    
    const result = checkExists(subDir, 'parents', 'root.txt');
    assertTrue(result);
    
    cleanupTestDir(testDir);
  });

  it('should check exists in child directories', () => {
    const testDir = createTestDir('exists-child');
    const childDir = path.join(testDir, 'child');
    fs.mkdirSync(childDir);
    fs.writeFileSync(path.join(childDir, 'child.txt'), 'child');
    
    const result = checkExists(testDir, 'child', 'child.txt');
    assertTrue(result);
    
    cleanupTestDir(testDir);
  });

  it('should check exists in children (descendants)', () => {
    const testDir = createTestDir('exists-children');
    const deepDir = path.join(testDir, 'a', 'b', 'c');
    fs.mkdirSync(deepDir, { recursive: true });
    fs.writeFileSync(path.join(deepDir, 'deep.txt'), 'deep');
    
    const result = checkExists(testDir, 'children', 'deep.txt');
    assertTrue(result);
    
    cleanupTestDir(testDir);
  });

  it('should check exists in sibling directories', () => {
    const testDir = createTestDir('exists-sibling');
    const dir1 = path.join(testDir, 'dir1');
    const dir2 = path.join(testDir, 'dir2');
    fs.mkdirSync(dir1);
    fs.mkdirSync(dir2);
    fs.writeFileSync(path.join(dir2, 'sibling.txt'), 'sibling');
    
    const result = checkExists(dir1, 'sibling', 'sibling.txt');
    assertTrue(result);
    
    cleanupTestDir(testDir);
  });
});

describe('Executor - evaluateCondition', () => {
  it('should evaluate simple exists condition', () => {
    const testDir = createTestDir('eval-exists');
    fs.writeFileSync(path.join(testDir, 'Cargo.toml'), 'test');
    
    const condition = {
      type: 'Exists',
      location: 'here',
      pattern: 'Cargo.toml'
    };
    
    const result = evaluateCondition(testDir, condition);
    assertTrue(result);
    
    cleanupTestDir(testDir);
  });

  it('should evaluate NOT condition', () => {
    const testDir = createTestDir('eval-not');
    
    const condition = {
      type: 'Not',
      predicate: {
        type: 'Exists',
        location: 'here',
        pattern: 'missing.txt'
      }
    };
    
    const result = evaluateCondition(testDir, condition);
    assertTrue(result);
    
    cleanupTestDir(testDir);
  });

  it('should evaluate AND condition', () => {
    const testDir = createTestDir('eval-and');
    fs.writeFileSync(path.join(testDir, 'file1.txt'), 'test');
    fs.writeFileSync(path.join(testDir, 'file2.txt'), 'test');
    
    const condition = {
      type: 'And',
      predicates: [
        { type: 'Exists', location: 'here', pattern: 'file1.txt' },
        { type: 'Exists', location: 'here', pattern: 'file2.txt' }
      ]
    };
    
    const result = evaluateCondition(testDir, condition);
    assertTrue(result);
    
    cleanupTestDir(testDir);
  });

  it('should fail AND if one predicate is false', () => {
    const testDir = createTestDir('eval-and-fail');
    fs.writeFileSync(path.join(testDir, 'file1.txt'), 'test');
    
    const condition = {
      type: 'And',
      predicates: [
        { type: 'Exists', location: 'here', pattern: 'file1.txt' },
        { type: 'Exists', location: 'here', pattern: 'missing.txt' }
      ]
    };
    
    const result = evaluateCondition(testDir, condition);
    assertFalse(result);
    
    cleanupTestDir(testDir);
  });
});

describe('Executor - executeRule', () => {
  it('should delete files matching pattern without condition', () => {
    const testDir = createTestDir('exec-simple');
    const targetFile = path.join(testDir, 'test.log');
    fs.writeFileSync(targetFile, 'log content');
    
    const rule = parseRule('delete test.log');
    const deleted = executeRule(testDir, rule, { dryRun: false });
    
    assertEqual(deleted.length, 1);
    assertTrue(deleted[0].includes('test.log'));
    assertFalse(fs.existsSync(targetFile));
    
    cleanupTestDir(testDir);
  });

  it('should delete files matching glob pattern', () => {
    const testDir = createTestDir('exec-glob');
    fs.writeFileSync(path.join(testDir, 'test1.log'), 'log');
    fs.writeFileSync(path.join(testDir, 'test2.log'), 'log');
    fs.writeFileSync(path.join(testDir, 'test.txt'), 'txt');
    
    const rule = parseRule('delete *.log');
    const deleted = executeRule(testDir, rule, { dryRun: false });
    
    assertEqual(deleted.length, 2);
    assertTrue(fs.existsSync(path.join(testDir, 'test.txt')));
    assertFalse(fs.existsSync(path.join(testDir, 'test1.log')));
    assertFalse(fs.existsSync(path.join(testDir, 'test2.log')));
    
    cleanupTestDir(testDir);
  });

  it('should delete directory', () => {
    const testDir = createTestDir('exec-dir');
    const targetDir = path.join(testDir, 'node_modules');
    fs.mkdirSync(targetDir);
    fs.writeFileSync(path.join(targetDir, 'package.json'), '{}');
    
    const rule = parseRule('delete node_modules');
    const deleted = executeRule(testDir, rule, { dryRun: false });
    
    assertEqual(deleted.length, 1);
    assertFalse(fs.existsSync(targetDir));
    
    cleanupTestDir(testDir);
  });

  it('should respect condition', () => {
    const testDir = createTestDir('exec-condition');
    fs.writeFileSync(path.join(testDir, 'target'), 'build');
    fs.writeFileSync(path.join(testDir, 'Cargo.toml'), 'cargo');
    
    const rule = parseRule('delete target when exists Cargo.toml');
    const deleted = executeRule(testDir, rule, { dryRun: false });
    
    assertEqual(deleted.length, 1);
    assertFalse(fs.existsSync(path.join(testDir, 'target')));
    
    cleanupTestDir(testDir);
  });

  it('should not delete if condition fails', () => {
    const testDir = createTestDir('exec-no-condition');
    const targetFile = path.join(testDir, 'target');
    fs.writeFileSync(targetFile, 'build');
    
    const rule = parseRule('delete target when exists Cargo.toml');
    const deleted = executeRule(testDir, rule, { dryRun: false });
    
    assertEqual(deleted.length, 0);
    assertTrue(fs.existsSync(targetFile));
    
    cleanupTestDir(testDir);
  });

  it('should support dry run', () => {
    const testDir = createTestDir('exec-dryrun');
    const targetFile = path.join(testDir, 'test.log');
    fs.writeFileSync(targetFile, 'log content');
    
    const rule = parseRule('delete test.log');
    const deleted = executeRule(testDir, rule, { dryRun: true });
    
    assertEqual(deleted.length, 1);
    assertTrue(fs.existsSync(targetFile)); // File should still exist
    
    cleanupTestDir(testDir);
  });

  it('should work in nested directories', () => {
    const testDir = createTestDir('exec-nested');
    const subDir = path.join(testDir, 'sub');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, 'Cargo.toml'), 'cargo');
    fs.writeFileSync(path.join(subDir, 'target'), 'build');
    
    const rule = parseRule('delete target when exists Cargo.toml');
    const deleted = executeRule(testDir, rule, { dryRun: false });
    
    assertEqual(deleted.length, 1);
    assertFalse(fs.existsSync(path.join(subDir, 'target')));
    
    cleanupTestDir(testDir);
  });

  it('should handle recursive glob patterns', () => {
    const testDir = createTestDir('exec-recursive-glob');
    const subDir = path.join(testDir, 'sub');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(testDir, 'test1.tmp'), 'tmp');
    fs.writeFileSync(path.join(subDir, 'test2.tmp'), 'tmp');
    
    const rule = parseRule('delete **/*.tmp');
    const deleted = executeRule(testDir, rule, { dryRun: false });
    
    assertEqual(deleted.length, 2);
    assertFalse(fs.existsSync(path.join(testDir, 'test1.tmp')));
    assertFalse(fs.existsSync(path.join(subDir, 'test2.tmp')));
    
    cleanupTestDir(testDir);
  });
});
