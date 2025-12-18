/**
 * TypeScript declarations for dust
 */

/**
 * AST node types
 */

export interface ExistsNode {
  type: 'Exists';
  location: 'here' | 'parent' | 'parents' | 'child' | 'children' | 'sibling';
  pattern: string;
}

export interface NotNode {
  type: 'Not';
  predicate: PredicateNode;
}

export interface AndNode {
  type: 'And';
  predicates: PredicateNode[];
}

export type PredicateNode = ExistsNode | NotNode | AndNode;

export interface RuleNode {
  type: 'Rule';
  action: 'delete';
  target: string;
  condition: PredicateNode | null;
}

/**
 * Options for execution
 */
export interface ExecuteOptions {
  /**
   * If true, don't actually delete files, just return what would be deleted
   */
  dryRun?: boolean;
}

/**
 * Clean files based on dust DSL rules
 * @param rulesText - DSL rules as text
 * @param rootPath - Root directory to clean
 * @param options - Options for execution
 * @returns Array of paths that were (or would be) deleted
 */
export function clean(
  rulesText: string,
  rootPath: string,
  options?: ExecuteOptions
): string[];

/**
 * Clean files based on a rules file
 * @param rulesFile - Path to rules file
 * @param rootPath - Root directory to clean
 * @param options - Options for execution
 * @returns Array of paths that were (or would be) deleted
 */
export function cleanFromFile(
  rulesFile: string,
  rootPath: string,
  options?: ExecuteOptions
): string[];

/**
 * Parse DSL rules without executing
 * @param rulesText - DSL rules as text
 * @returns Array of parsed rule ASTs
 */
export function parse(rulesText: string): RuleNode[];

/**
 * Parse a single rule line
 * @param line - A single line of DSL
 * @returns AST node or null if line is empty/comment
 */
export function parseRule(line: string): RuleNode | null;

/**
 * Parse multiple rules from text
 * @param text - Multiple lines of DSL
 * @returns Array of AST nodes
 */
export function parseRules(text: string): RuleNode[];

/**
 * Execute a single rule
 * @param rootPath - Root directory to start from
 * @param rule - Parsed rule AST
 * @param options - Execution options
 * @returns Array of deleted paths
 */
export function executeRule(
  rootPath: string,
  rule: RuleNode,
  options?: ExecuteOptions
): string[];

/**
 * Execute multiple rules
 * @param rootPath - Root directory to start from
 * @param rules - Array of parsed rule ASTs
 * @param options - Execution options
 * @returns Array of deleted paths
 */
export function executeRules(
  rootPath: string,
  rules: RuleNode[],
  options?: ExecuteOptions
): string[];
