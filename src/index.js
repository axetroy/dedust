import { tokenize, Tokenizer } from "./tokenizer.js";
import { parse, Parser } from "./parser.js";
import { evaluate, executeRules, Evaluator } from "./evaluator.js";

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
	const rules = typeof rulesOrDsl === "string" ? parseRules(rulesOrDsl) : rulesOrDsl;
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
	const rules = typeof rulesOrDsl === "string" ? parseRules(rulesOrDsl) : rulesOrDsl;
	return executeRules(rules, baseDir);
}

/**
 * @callback EventListener
 * @param {any} data - Event data
 * @returns {void}
 */

/**
 * @typedef {Object} EventListeners
 * @property {EventListener} [onFileFound] - Called when a file is found
 * @property {EventListener} [onFileDeleted] - Called when a file is deleted
 * @property {EventListener} [onError] - Called when an error occurs
 * @property {EventListener} [onScanStart] - Called when scanning starts
 * @property {EventListener} [onScanDirectory] - Called when scanning a directory
 * @property {EventListener} [onScanComplete] - Called when scanning completes
 */

/**
 * Evaluate rules with event callbacks
 * @param {string | Rule[]} rulesOrDsl - DSL text or parsed rules
 * @param {string} baseDir - Base directory to evaluate from
 * @param {EventListeners} listeners - Event listeners
 * @returns {Promise<string[]>} Array of file paths that would be deleted
 * @example
 * ```js
 * import { findTargetsWithEvents } from 'dust';
 *
 * const targets = await findTargetsWithEvents(dsl, '/path/to/project', {
 *   onFileFound: (data) => console.log('Found:', data.path),
 *   onScanComplete: (data) => console.log('Found', data.filesFound, 'files')
 * });
 * ```
 */
export async function findTargetsWithEvents(rulesOrDsl, baseDir, listeners = {}) {
	const rules = typeof rulesOrDsl === "string" ? parseRules(rulesOrDsl) : rulesOrDsl;
	const evaluator = new Evaluator(rules, baseDir);

	// Attach event listeners
	if (listeners.onFileFound) {
		evaluator.on("file:found", listeners.onFileFound);
	}
	if (listeners.onError) {
		evaluator.on("error", listeners.onError);
	}
	if (listeners.onScanStart) {
		evaluator.on("scan:start", listeners.onScanStart);
	}
	if (listeners.onScanDirectory) {
		evaluator.on("scan:directory", listeners.onScanDirectory);
	}
	if (listeners.onScanComplete) {
		evaluator.on("scan:complete", listeners.onScanComplete);
	}

	return evaluator.evaluate(true);
}

/**
 * Execute cleanup with event callbacks
 * @param {string | Rule[]} rulesOrDsl - DSL text or parsed rules
 * @param {string} baseDir - Base directory to execute from
 * @param {EventListeners} listeners - Event listeners
 * @returns {Promise<{deleted: string[], errors: Array<{path: string, error: Error}>}>}
 * @example
 * ```js
 * import { executeCleanupWithEvents } from 'dust';
 *
 * const result = await executeCleanupWithEvents(dsl, '/path/to/project', {
 *   onFileFound: (data) => console.log('Found:', data.path),
 *   onFileDeleted: (data) => console.log('Deleted:', data.path),
 *   onError: (data) => console.error('Error:', data.error)
 * });
 * ```
 */
export async function executeCleanupWithEvents(rulesOrDsl, baseDir, listeners = {}) {
	const rules = typeof rulesOrDsl === "string" ? parseRules(rulesOrDsl) : rulesOrDsl;
	const evaluator = new Evaluator(rules, baseDir);

	// Attach event listeners
	if (listeners.onFileFound) {
		evaluator.on("file:found", listeners.onFileFound);
	}
	if (listeners.onFileDeleted) {
		evaluator.on("file:deleted", listeners.onFileDeleted);
	}
	if (listeners.onError) {
		evaluator.on("error", listeners.onError);
	}
	if (listeners.onScanStart) {
		evaluator.on("scan:start", listeners.onScanStart);
	}
	if (listeners.onScanDirectory) {
		evaluator.on("scan:directory", listeners.onScanDirectory);
	}
	if (listeners.onScanComplete) {
		evaluator.on("scan:complete", listeners.onScanComplete);
	}

	const targets = await evaluator.evaluate(true);
	return evaluator.execute(targets);
}

// Export everything as default
export default {
	parseRules,
	findTargets,
	executeCleanup,
	findTargetsWithEvents,
	executeCleanupWithEvents,
	tokenize,
	parse,
	evaluate,
	executeRules,
};

// Export classes for advanced usage
export { Tokenizer, Parser, Evaluator };
