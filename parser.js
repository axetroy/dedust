/**
 * Parser for dust DSL
 * 
 * Grammar:
 * Rule        ::= Action Target [ "when" Condition ]
 * Action      ::= "delete"
 * Target      ::= PathPattern
 * Condition   ::= Predicate ( "and" Predicate )*
 * Predicate   ::= [ Location ] "exists" PathPattern
 *               | "not" Predicate
 * Location    ::= "here" | "parent" | "parents" | "child" | "children" | "sibling"
 */

const ACTIONS = ['delete'];
const LOCATIONS = ['here', 'parent', 'parents', 'child', 'children', 'sibling'];

/**
 * Tokenizer: converts input string into tokens
 */
class Tokenizer {
  constructor(input) {
    this.input = input.trim();
    this.position = 0;
    this.tokens = [];
  }

  tokenize() {
    while (this.position < this.input.length) {
      this.skipWhitespace();
      if (this.position >= this.input.length) break;

      const char = this.input[this.position];

      // Skip comments
      if (char === '#') {
        this.skipComment();
        continue;
      }

      // Read word or pattern
      const token = this.readToken();
      if (token) {
        this.tokens.push(token);
      }
    }
    return this.tokens;
  }

  skipWhitespace() {
    while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
      this.position++;
    }
  }

  skipComment() {
    while (this.position < this.input.length && this.input[this.position] !== '\n') {
      this.position++;
    }
  }

  readToken() {
    const start = this.position;
    let token = '';

    while (this.position < this.input.length && !/\s/.test(this.input[this.position])) {
      token += this.input[this.position];
      this.position++;
    }

    return token;
  }
}

/**
 * Parser: converts tokens into AST
 */
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  parse() {
    if (this.tokens.length === 0) {
      return null;
    }

    const action = this.parseAction();
    const target = this.parseTarget();
    
    let condition = null;
    if (this.current() === 'when') {
      this.consume('when');
      condition = this.parseCondition();
    }

    return {
      type: 'Rule',
      action,
      target,
      condition
    };
  }

  parseAction() {
    const token = this.current();
    if (!ACTIONS.includes(token)) {
      throw new Error(`Expected action (delete), got: ${token}`);
    }
    this.advance();
    return token;
  }

  parseTarget() {
    const token = this.current();
    if (!token) {
      throw new Error('Expected target pattern');
    }
    this.advance();
    return token;
  }

  parseCondition() {
    const predicates = [];
    predicates.push(this.parsePredicate());

    while (this.current() === 'and') {
      this.consume('and');
      predicates.push(this.parsePredicate());
    }

    if (predicates.length === 1) {
      return predicates[0];
    }

    return {
      type: 'And',
      predicates
    };
  }

  parsePredicate() {
    // Handle NOT
    if (this.current() === 'not') {
      this.consume('not');
      return {
        type: 'Not',
        predicate: this.parsePredicate()
      };
    }

    // Handle location modifiers
    let location = 'here'; // default
    if (LOCATIONS.includes(this.current())) {
      location = this.current();
      this.advance();
    }

    // Expect 'exists'
    if (this.current() !== 'exists') {
      throw new Error(`Expected 'exists', got: ${this.current()}`);
    }
    this.consume('exists');

    // Pattern
    const pattern = this.current();
    if (!pattern) {
      throw new Error('Expected pattern after exists');
    }
    this.advance();

    return {
      type: 'Exists',
      location,
      pattern
    };
  }

  current() {
    return this.tokens[this.position];
  }

  advance() {
    this.position++;
  }

  consume(expected) {
    const token = this.current();
    if (token !== expected) {
      throw new Error(`Expected '${expected}', got: ${token}`);
    }
    this.advance();
  }
}

/**
 * Parse a single rule line
 * @param {string} line - A single line of DSL
 * @returns {object|null} AST node or null if line is empty/comment
 */
function parseRule(line) {
  line = line.trim();
  
  // Skip empty lines and comments
  if (!line || line.startsWith('#')) {
    return null;
  }

  const tokenizer = new Tokenizer(line);
  const tokens = tokenizer.tokenize();
  
  if (tokens.length === 0) {
    return null;
  }

  const parser = new Parser(tokens);
  return parser.parse();
}

/**
 * Parse multiple rules from text
 * @param {string} text - Multiple lines of DSL
 * @returns {Array} Array of AST nodes
 */
function parseRules(text) {
  const lines = text.split('\n');
  const rules = [];

  for (const line of lines) {
    const rule = parseRule(line);
    if (rule) {
      rules.push(rule);
    }
  }

  return rules;
}

module.exports = {
  parseRule,
  parseRules,
  Tokenizer,
  Parser
};
