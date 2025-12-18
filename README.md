# Dust

A DSL-based garbage file cleanup tool for managing build artifacts and temporary files across multiple project types.

## Features

- **Simple DSL**: Easy-to-read, line-based rules
- **Context-aware**: Support for parent, child, sibling, and ancestor directory checks
- **Glob patterns**: Standard glob support with `*`, `**`, and `?`
- **Type-safe**: TypeScript declarations included
- **Zero dependencies**: Pure Node.js implementation

## Installation

```bash
npm install dust
```

## Usage

### Basic API

```javascript
const { clean, parse } = require('dust');

// Clean based on rules
const rules = `
  delete target when exists Cargo.toml
  delete node_modules when exists package.json
  delete *.log
`;

const deleted = clean(rules, '/path/to/project');
console.log('Deleted:', deleted);

// Dry run (don't actually delete)
const wouldDelete = clean(rules, '/path/to/project', { dryRun: true });
console.log('Would delete:', wouldDelete);

// Parse rules without executing
const ast = parse(rules);
console.log('Parsed:', ast);
```

### Rule Syntax

#### Basic Rule

```
<Action> <Target> [when <Condition>]
```

#### Actions

- `delete` - Delete matching files or directories

#### Targets

Targets use glob patterns:
- `target` - Exact name
- `*.log` - All .log files
- `**/*.tmp` - All .tmp files recursively
- `node_modules` - Directory name

#### Conditions

Check for file existence with location modifiers:

```
delete target when exists Cargo.toml
delete target when parent exists Cargo.toml
delete *.log when parents exists .git
delete dist when child exists package.json
delete cache when children exists node_modules
delete build when sibling exists src
```

**Location Modifiers:**
- `here` - Current directory (default, can be omitted)
- `parent` - Parent directory
- `parents` - Any ancestor directory
- `child` - Direct child directory
- `children` - Any descendant directory
- `sibling` - Sibling directory

#### Logic Operators

**AND:**
```
delete target when exists Cargo.toml and exists src
```

**NOT:**
```
delete target when exists Cargo.toml and not exists keep.txt
```

#### Comments

```
# This is a comment
delete target when exists Cargo.toml
```

## Examples

### Rust Project Cleanup

```
# Clean Rust build artifacts
delete target when exists Cargo.toml

# Clean workspace member artifacts
delete target when parent exists Cargo.toml
```

### Node.js Project Cleanup

```
# Clean dependencies
delete node_modules when exists package.json

# Clean build output
delete dist when exists package.json and exists src
```

### Python Project Cleanup

```
# Clean virtual environment
delete .venv when exists pyproject.toml

# Clean cache
delete __pycache__
delete **/*.pyc
```

### Multi-language Project

```
# Rust
delete target when exists Cargo.toml

# Node
delete node_modules when exists package.json

# Python
delete .venv when exists pyproject.toml

# General cleanup
delete *.log
delete **/*.tmp when parents exists .git
```

## API Reference

### `clean(rulesText, rootPath, options?)`

Execute cleanup rules on a directory tree.

**Parameters:**
- `rulesText` (string): DSL rules as text
- `rootPath` (string): Root directory to clean
- `options` (object): Optional settings
  - `dryRun` (boolean): If true, return what would be deleted without deleting

**Returns:** Array of deleted (or would-be-deleted) file paths

### `cleanFromFile(rulesFile, rootPath, options?)`

Execute cleanup rules from a file.

**Parameters:**
- `rulesFile` (string): Path to rules file
- `rootPath` (string): Root directory to clean  
- `options` (object): Optional settings

**Returns:** Array of deleted file paths

### `parse(rulesText)`

Parse DSL rules into an AST without executing.

**Parameters:**
- `rulesText` (string): DSL rules as text

**Returns:** Array of parsed rule AST nodes

## TypeScript Support

This package includes TypeScript declarations:

```typescript
import { clean, parse, RuleNode } from 'dust';

const rules = 'delete target when exists Cargo.toml';
const deleted: string[] = clean(rules, '/project');
const ast: RuleNode[] = parse(rules);
```

## Grammar

```
Rule        ::= Action Target [ "when" Condition ]
Action      ::= "delete"
Target      ::= PathPattern
Condition   ::= Predicate ( "and" Predicate )*
Predicate   ::= [ Location ] "exists" PathPattern
              | "not" Predicate
Location    ::= "here" | "parent" | "parents" | "child" | "children" | "sibling"
PathPattern ::= glob-pattern
```

## Design Principles

1. **Declarative**: Rules describe what to clean, not how
2. **Context-aware**: Spatial relationships expressed in language, not path tricks
3. **Safe**: No `../` or regex, conditions separate from targets
4. **Clear**: Default values minimize noise

## Testing

```bash
npm test
```

## License

MIT

## See Also

- [spec.md](spec.md) - Full DSL specification
