import { Rule } from "./parser.js";

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
 * Event listener callback
 */
export type EventListener = (data: any) => void;

/**
 * Event listeners for file operations
 */
export interface EventListeners {
	/** Called when a file is found */
	onFileFound?: (data: import("./evaluator.js").FileFoundEvent) => void;
	/** Called when a file is deleted */
	onFileDeleted?: (data: import("./evaluator.js").FileDeletedEvent) => void;
	/** Called when an error occurs */
	onError?: (data: import("./evaluator.js").ErrorEvent) => void;
	/** Called when scanning starts */
	onScanStart?: (data: import("./evaluator.js").ScanStartEvent) => void;
	/** Called when scanning a directory */
	onScanDirectory?: (data: import("./evaluator.js").ScanDirectoryEvent) => void;
	/** Called when scanning completes */
	onScanComplete?: (data: import("./evaluator.js").ScanCompleteEvent) => void;
}

/**
 * Evaluate rules with event callbacks
 * @param rulesOrDsl - DSL text or parsed rules
 * @param baseDir - Base directory to evaluate from
 * @param listeners - Event listeners
 * @returns Array of file paths that would be deleted
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
export function findTargetsWithEvents(
	rulesOrDsl: string | Rule[],
	baseDir: string,
	listeners?: EventListeners
): Promise<string[]>;

/**
 * Execute cleanup with event callbacks
 * @param rulesOrDsl - DSL text or parsed rules
 * @param baseDir - Base directory to execute from
 * @param listeners - Event listeners
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
export function executeCleanupWithEvents(
	rulesOrDsl: string | Rule[],
	baseDir: string,
	listeners?: EventListeners
): Promise<ExecutionResult>;

/**
 * Default export containing all main functions
 */
declare const _default: {
	parseRules: typeof parseRules;
	findTargets: typeof findTargets;
	executeCleanup: typeof executeCleanup;
	findTargetsWithEvents: typeof findTargetsWithEvents;
	executeCleanupWithEvents: typeof executeCleanupWithEvents;
	tokenize: typeof import("./tokenizer.js").tokenize;
	parse: typeof import("./parser.js").parse;
	evaluate: typeof import("./evaluator.js").evaluate;
	executeRules: typeof import("./evaluator.js").executeRules;
};

export default _default;

// Re-export types
export type { Rule, ActionType, LocationType, Condition, Predicate } from "./parser.js";
export type { Token, TokenType } from "./tokenizer.js";
export type {
	EvaluationContext,
	FileFoundEvent,
	FileDeletedEvent,
	ErrorEvent,
	ScanStartEvent,
	ScanDirectoryEvent,
	ScanCompleteEvent,
} from "./evaluator.js";
