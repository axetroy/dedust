/**
 * Parser tests
 */

const { describe, it, assertEqual, assertThrows } = require('./test-framework');
const { parseRule, parseRules } = require('../parser');

describe('Parser - Basic Rules', () => {
  it('should parse simple delete rule without condition', () => {
    const rule = parseRule('delete target');
    assertEqual(rule, {
      type: 'Rule',
      action: 'delete',
      target: 'target',
      condition: null
    });
  });

  it('should parse delete with glob pattern', () => {
    const rule = parseRule('delete *.log');
    assertEqual(rule.target, '*.log');
  });

  it('should parse delete with recursive glob', () => {
    const rule = parseRule('delete **/*.tmp');
    assertEqual(rule.target, '**/*.tmp');
  });

  it('should parse node_modules', () => {
    const rule = parseRule('delete node_modules');
    assertEqual(rule.target, 'node_modules');
  });
});

describe('Parser - Conditions', () => {
  it('should parse exists condition without location', () => {
    const rule = parseRule('delete target when exists Cargo.toml');
    assertEqual(rule.condition, {
      type: 'Exists',
      location: 'here',
      pattern: 'Cargo.toml'
    });
  });

  it('should parse parent exists', () => {
    const rule = parseRule('delete target when parent exists Cargo.toml');
    assertEqual(rule.condition, {
      type: 'Exists',
      location: 'parent',
      pattern: 'Cargo.toml'
    });
  });

  it('should parse parents exists', () => {
    const rule = parseRule('delete *.log when parents exists .git');
    assertEqual(rule.condition, {
      type: 'Exists',
      location: 'parents',
      pattern: '.git'
    });
  });

  it('should parse child exists', () => {
    const rule = parseRule('delete dist when child exists package.json');
    assertEqual(rule.condition.location, 'child');
  });

  it('should parse children exists', () => {
    const rule = parseRule('delete dist when children exists package.json');
    assertEqual(rule.condition.location, 'children');
  });

  it('should parse sibling exists', () => {
    const rule = parseRule('delete cache when sibling exists src');
    assertEqual(rule.condition.location, 'sibling');
  });
});

describe('Parser - Logic Operators', () => {
  it('should parse AND condition', () => {
    const rule = parseRule('delete target when exists Cargo.toml and exists src');
    assertEqual(rule.condition, {
      type: 'And',
      predicates: [
        {
          type: 'Exists',
          location: 'here',
          pattern: 'Cargo.toml'
        },
        {
          type: 'Exists',
          location: 'here',
          pattern: 'src'
        }
      ]
    });
  });

  it('should parse NOT condition', () => {
    const rule = parseRule('delete target when not exists keep.txt');
    assertEqual(rule.condition, {
      type: 'Not',
      predicate: {
        type: 'Exists',
        location: 'here',
        pattern: 'keep.txt'
      }
    });
  });

  it('should parse AND with NOT', () => {
    const rule = parseRule('delete target when exists Cargo.toml and not exists keep.txt');
    assertEqual(rule.condition.type, 'And');
    assertEqual(rule.condition.predicates.length, 2);
    assertEqual(rule.condition.predicates[0].type, 'Exists');
    assertEqual(rule.condition.predicates[1].type, 'Not');
  });

  it('should parse multiple AND conditions', () => {
    const rule = parseRule('delete target when exists A and exists B and exists C');
    assertEqual(rule.condition.type, 'And');
    assertEqual(rule.condition.predicates.length, 3);
  });
});

describe('Parser - Comments and Empty Lines', () => {
  it('should skip comment lines', () => {
    const rule = parseRule('# This is a comment');
    assertEqual(rule, null);
  });

  it('should skip empty lines', () => {
    const rule = parseRule('');
    assertEqual(rule, null);
  });

  it('should skip whitespace-only lines', () => {
    const rule = parseRule('   ');
    assertEqual(rule, null);
  });
});

describe('Parser - Multiple Rules', () => {
  it('should parse multiple rules', () => {
    const text = `
delete target when exists Cargo.toml
delete node_modules when exists package.json
delete *.log
    `;
    const rules = parseRules(text);
    assertEqual(rules.length, 3);
    assertEqual(rules[0].target, 'target');
    assertEqual(rules[1].target, 'node_modules');
    assertEqual(rules[2].target, '*.log');
  });

  it('should skip comments and empty lines in multiple rules', () => {
    const text = `
# Rust
delete target when exists Cargo.toml

# Node
delete node_modules when exists package.json
    `;
    const rules = parseRules(text);
    assertEqual(rules.length, 2);
  });
});

describe('Parser - Error Handling', () => {
  it('should throw on invalid action', () => {
    assertThrows(() => parseRule('create target'));
  });

  it('should throw on missing target', () => {
    assertThrows(() => parseRule('delete'));
  });

  it('should throw on missing pattern after exists', () => {
    assertThrows(() => parseRule('delete target when exists'));
  });
});

describe('Parser - Real World Examples', () => {
  it('should parse Rust rule', () => {
    const rule = parseRule('delete target when exists Cargo.toml');
    assertEqual(rule.action, 'delete');
    assertEqual(rule.target, 'target');
  });

  it('should parse Rust workspace rule', () => {
    const rule = parseRule('delete target when parent exists Cargo.toml');
    assertEqual(rule.condition.location, 'parent');
  });

  it('should parse Node rule', () => {
    const rule = parseRule('delete node_modules when exists package.json');
    assertEqual(rule.target, 'node_modules');
  });

  it('should parse Python rule', () => {
    const rule = parseRule('delete .venv when exists pyproject.toml');
    assertEqual(rule.target, '.venv');
  });

  it('should parse log cleanup rule', () => {
    const rule = parseRule('delete **/*.tmp when parents exists .git');
    assertEqual(rule.target, '**/*.tmp');
    assertEqual(rule.condition.location, 'parents');
  });
});
