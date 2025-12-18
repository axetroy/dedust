import test from "node:test";
import assert from "node:assert";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { findTargetsWithEvents, executeCleanupWithEvents, Evaluator, parseRules } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a temporary test directory
const testDir = path.join(__dirname, ".test-events-tmp");

/**
 * Create a test directory structure
 * @param {Object} structure - Directory structure as nested object
 * @param {string} baseDir - Base directory to create structure in
 */
function createStructure(structure, baseDir = testDir) {
	if (!fs.existsSync(baseDir)) {
		fs.mkdirSync(baseDir, { recursive: true });
	}

	for (const [name, content] of Object.entries(structure)) {
		const fullPath = path.join(baseDir, name);

		if (typeof content === "object" && content !== null) {
			// It's a directory
			fs.mkdirSync(fullPath, { recursive: true });
			createStructure(content, fullPath);
		} else {
			// It's a file
			fs.writeFileSync(fullPath, content || "", "utf8");
		}
	}
}

/**
 * Clean up test directory
 */
function cleanup() {
	if (fs.existsSync(testDir)) {
		fs.rmSync(testDir, { recursive: true, force: true });
	}
}

test("Events - file:found event", async () => {
	cleanup();
	createStructure({
		"test.log": "log content",
		"app.log": "app log",
		"readme.txt": "readme",
	});

	const filesFound = [];
	const dsl = "delete *.log";

	await findTargetsWithEvents(dsl, testDir, {
		onFileFound: (data) => {
			filesFound.push(data.path);
		},
	});

	assert.strictEqual(filesFound.length, 2);
	assert.ok(filesFound.some((f) => f.endsWith("test.log")));
	assert.ok(filesFound.some((f) => f.endsWith("app.log")));

	cleanup();
});

test("Events - scan:start and scan:complete", async () => {
	cleanup();
	createStructure({
		"test.log": "log content",
	});

	let scanStarted = false;
	let scanCompleted = false;
	let filesFoundCount = 0;

	const dsl = "delete *.log";

	await findTargetsWithEvents(dsl, testDir, {
		onScanStart: (data) => {
			scanStarted = true;
			assert.strictEqual(data.baseDir, testDir);
			assert.strictEqual(data.rulesCount, 1);
		},
		onScanComplete: (data) => {
			scanCompleted = true;
			assert.strictEqual(data.baseDir, testDir);
			filesFoundCount = data.filesFound;
		},
	});

	assert.strictEqual(scanStarted, true);
	assert.strictEqual(scanCompleted, true);
	assert.strictEqual(filesFoundCount, 1);

	cleanup();
});

test("Events - scan:directory", async () => {
	cleanup();
	createStructure({
		dir1: {
			"test.log": "log",
		},
		dir2: {
			"app.log": "log",
		},
	});

	const directoriesScanned = [];
	const dsl = "delete *.log";

	await findTargetsWithEvents(dsl, testDir, {
		onScanDirectory: (data) => {
			directoriesScanned.push(data.directory);
		},
	});

	// Should scan testDir, dir1, and dir2
	assert.ok(directoriesScanned.length >= 3);
	assert.ok(directoriesScanned.includes(testDir));

	cleanup();
});

test("Events - file:deleted event", async () => {
	cleanup();
	createStructure({
		"test.log": "log content",
		"app.log": "app log",
	});

	const filesDeleted = [];
	const dsl = "delete *.log";

	await executeCleanupWithEvents(dsl, testDir, {
		onFileDeleted: (data) => {
			filesDeleted.push(data.path);
			assert.strictEqual(typeof data.isDirectory, "boolean");
		},
	});

	assert.strictEqual(filesDeleted.length, 2);
	assert.ok(filesDeleted.some((f) => f.endsWith("test.log")));
	assert.ok(filesDeleted.some((f) => f.endsWith("app.log")));

	cleanup();
});

test("Events - error event during deletion", async () => {
	cleanup();
	createStructure({
		"test.log": "log content",
	});

	const errors = [];
	const dsl = "delete *.log";

	// Make file read-only to cause deletion error (on Unix systems)
	const logFile = path.join(testDir, "test.log");
	if (process.platform !== "win32") {
		fs.chmodSync(testDir, 0o444); // Make directory read-only
	}

	await executeCleanupWithEvents(dsl, testDir, {
		onError: (data) => {
			errors.push(data);
			assert.strictEqual(data.phase, "deletion");
			assert.ok(data.error instanceof Error);
		},
	});

	// Restore permissions and cleanup
	if (process.platform !== "win32") {
		fs.chmodSync(testDir, 0o755);
	}

	cleanup();
});

test("Events - Evaluator direct usage with events", async () => {
	cleanup();
	createStructure({
		"test.log": "log",
		"app.log": "log",
	});

	const dsl = "delete *.log";
	const rules = parseRules(dsl);
	const evaluator = new Evaluator(rules, testDir);

	const filesFound = [];
	const filesDeleted = [];

	evaluator.on("file:found", (data) => {
		filesFound.push(data.path);
	});

	evaluator.on("file:deleted", (data) => {
		filesDeleted.push(data.path);
	});

	const targets = await evaluator.evaluate(true);
	await evaluator.execute(targets);

	assert.strictEqual(filesFound.length, 2);
	assert.strictEqual(filesDeleted.length, 2);

	cleanup();
});

test("Events - all event types", async () => {
	cleanup();
	createStructure({
		"test.log": "log",
	});

	const events = {
		scanStart: false,
		scanDirectory: false,
		scanComplete: false,
		fileFound: false,
		fileDeleted: false,
	};

	const dsl = "delete *.log";

	await executeCleanupWithEvents(dsl, testDir, {
		onScanStart: () => {
			events.scanStart = true;
		},
		onScanDirectory: () => {
			events.scanDirectory = true;
		},
		onScanComplete: () => {
			events.scanComplete = true;
		},
		onFileFound: () => {
			events.fileFound = true;
		},
		onFileDeleted: () => {
			events.fileDeleted = true;
		},
	});

	assert.strictEqual(events.scanStart, true, "scan:start event should fire");
	assert.strictEqual(events.scanDirectory, true, "scan:directory event should fire");
	assert.strictEqual(events.scanComplete, true, "scan:complete event should fire");
	assert.strictEqual(events.fileFound, true, "file:found event should fire");
	assert.strictEqual(events.fileDeleted, true, "file:deleted event should fire");

	cleanup();
});
