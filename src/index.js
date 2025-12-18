import { tokenize, Tokenizer } from './tokenizer.js';
import { parse, Parser } from './parser.js';
import { evaluate, executeRules, Evaluator } from './evaluator.js';

/**
 * @typedef {import('./parser.js').Rule} Rule
 */

/**
 * Parse DSL text into rules
 * @param {string} input - The DSL text to parse
 * @returns {Rule[]} Array of parsed rules
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
export function parseRules(input) {
	const tokens = tokenize(input);
	return parse(tokens);
}

/**
 * Evaluate rules and find targets to delete (dry run)
 * @param {string | Rule[]} rulesOrDsl - DSL text or parsed rules
 * @param {string} baseDir - Base directory to evaluate from
 * @returns {Promise<string[]>} Array of file paths that would be deleted
 * @example
 * ```js
 * import { findTargets } from 'dust';
 * 
 * const dsl = `delete *.log`;
 * const targets = await findTargets(dsl, '/path/to/project');
 * console.log('Would delete:', targets);
 * ```
 */
export async function findTargets(rulesOrDsl, baseDir) {
	const rules = typeof rulesOrDsl === 'string' ? parseRules(rulesOrDsl) : rulesOrDsl;
	return evaluate(rules, baseDir, true);
}

/**
 * Execute rules and delete matching files/directories
 * @param {string | Rule[]} rulesOrDsl - DSL text or parsed rules
 * @param {string} baseDir - Base directory to execute from
 * @returns {Promise<{deleted: string[], errors: Array<{path: string, error: Error}>}>}
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
export async function executeCleanup(rulesOrDsl, baseDir) {
	const rules = typeof rulesOrDsl === 'string' ? parseRules(rulesOrDsl) : rulesOrDsl;
	return executeRules(rules, baseDir);
}

// Export everything as default
export default {
parseRules,
findTargets,
executeCleanup,
tokenize,
parse,
evaluate,
executeRules,
};

// Export classes for advanced usage
export { Tokenizer, Parser, Evaluator };
