import { Rule } from './parser.js';

/**
 * Parse DSL text into rules
 * @param input - The DSL text to parse
 * @returns Array of parsed rules
 * @example
 * ```js
 * import { parseRules } from 'dust';
 * 
 * const dsl = `
 *   delete target when exists Cargo.toml
 *   delete node_modules when exists package.json
 * `;
 * 
 * const rules = parseRules(dsl);
 * console.log(rules);
 * ```
 */
export function parseRules(input: string): Rule[];

/**
 * Evaluate rules and find targets to delete (dry run)
 * @param rulesOrDsl - DSL text or parsed rules
 * @param baseDir - Base directory to evaluate from
 * @returns Array of file paths that would be deleted
 * @example
 * ```js
 * import { findTargets } from 'dust';
 * 
 * const dsl = `delete *.log`;
 * const targets = await findTargets(dsl, '/path/to/project');
 * console.log('Would delete:', targets);
 * ```
 */
export function findTargets(rulesOrDsl: string | Rule[], baseDir: string): Promise<string[]>;

/**
 * Result of executing cleanup
 */
export interface ExecutionResult {
	/** Successfully deleted paths */
	deleted: string[];
	/** Errors encountered during deletion */
	errors: Array<{
		path: string;
		error: Error;
	}>;
}

/**
 * Execute rules and delete matching files/directories
 * @param rulesOrDsl - DSL text or parsed rules
 * @param baseDir - Base directory to execute from
 * @example
 * ```js
 * import { executeCleanup } from 'dust';
 * 
 * const dsl = `
 *   delete target when exists Cargo.toml
 *   delete node_modules when exists package.json
 * `;
 * 
 * const result = await executeCleanup(dsl, '/path/to/project');
 * console.log('Deleted:', result.deleted);
 * console.log('Errors:', result.errors);
 * ```
 */
export function executeCleanup(rulesOrDsl: string | Rule[], baseDir: string): Promise<ExecutionResult>;

/**
 * Default export containing all main functions
 */
declare const _default: {
	parseRules: typeof parseRules;
	findTargets: typeof findTargets;
	executeCleanup: typeof executeCleanup;
	tokenize: typeof import('./tokenizer.js').tokenize;
	parse: typeof import('./parser.js').parse;
	evaluate: typeof import('./evaluator.js').evaluate;
	executeRules: typeof import('./evaluator.js').executeRules;
};

export default _default;

// Re-export types
export type { Rule, ActionType, LocationType, Condition, Predicate } from './parser.js';
export type { Token, TokenType } from './tokenizer.js';
export type { EvaluationContext } from './evaluator.js';
