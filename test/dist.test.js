import test, { before } from "node:test";
import assert from "node:assert";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, "..");

before(async () => {
	await exec("yarnpkg", ["build"]);
});

function exec(cmd, args = [], options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { cwd: process.cwd(), stdio: "inherit", ...options });

		let data = "";

		child.stdout?.on("data", (chunk) => {
			data += chunk.toString();
		});

		child.on("exit", (code) => {
			if (code === 0) {
				resolve(data);
			} else {
				reject(new Error(`'${cmd}' '${args.join(" ")}' process exited with code ${code}`));
			}
		});
	});
}

test("test esm output", async () => {
	const targetDir = path.join(rootDir, "fixtures", "esm");

	await exec("yarnpkg", [], { cwd: targetDir });

	const output = await exec("yarnpkg", ["test", "--no-color"], {
		stdio: "pipe",
		cwd: targetDir,
		env: {
			PATH: process.env.PATH,
			NO_COLOR: "1",
		},
	});

	assert.ok(output.includes("✓ ESM module works correctly"), "Should complete successfully");
});

test("test cjs output", async () => {
	const targetDir = path.join(rootDir, "fixtures", "cjs");

	await exec("yarnpkg", [], { cwd: targetDir });

	const output = await exec("yarnpkg", ["test", "--no-color"], {
		stdio: "pipe",
		cwd: targetDir,
		env: {
			PATH: process.env.PATH,
			NO_COLOR: "1",
		},
	});

	assert.ok(output.includes("✓ CJS module works correctly"), "Should complete successfully");
});
