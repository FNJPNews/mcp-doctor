import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runCli, type CliIo } from "../src/index.js";

const fixturesDir = fileURLToPath(new URL("../../core/test/fixtures/", import.meta.url));

interface Capture {
  io: Pick<CliIo, "stdout" | "stderr" | "cwd" | "env" | "platform">;
  stdout: () => string;
  stderr: () => string;
}

function fixturePath(name: string): string {
  return path.join(fixturesDir, name);
}

function capture(cwd = process.cwd()): Capture {
  let stdout = "";
  let stderr = "";

  return {
    io: {
      stdout: {
        write(chunk: string) {
          stdout += chunk;
        },
      },
      stderr: {
        write(chunk: string) {
          stderr += chunk;
        },
      },
      cwd,
      env: process.env,
      platform: process.platform,
    },
    stdout: () => stdout,
    stderr: () => stderr,
  };
}

describe("CLI JSON output", () => {
  it("prints redacted scan JSON", async () => {
    const output = capture();
    const exitCode = await runCli(
      ["scan", "--json", "--config", fixturePath("secret-env-config.json"), "--client", "claude-desktop"],
      output.io,
    );

    expect(exitCode).toBe(0);
    expect(output.stderr()).toBe("");
    expect(output.stdout()).not.toContain("placeholder-value");
    const parsed = JSON.parse(output.stdout()) as { servers: Array<{ env: Record<string, string> }> };
    expect(parsed.servers[0]?.env.SERVICE_TOKEN).toBe("[REDACTED]");
  });
});

describe("CLI exit codes", () => {
  it("returns 1 when audit issues meet the fail threshold", async () => {
    const output = capture();
    const exitCode = await runCli(
      ["audit", "--json", "--config", fixturePath("broad-filesystem-access-config.json"), "--fail-on", "high"],
      output.io,
    );

    expect(exitCode).toBe(1);
    const parsed = JSON.parse(output.stdout()) as { failed: boolean };
    expect(parsed.failed).toBe(true);
  });

  it("returns 0 when audit issues are below the fail threshold", async () => {
    const output = capture();
    const exitCode = await runCli(
      ["audit", "--json", "--config", fixturePath("npx-unpinned-config.json"), "--fail-on", "critical"],
      output.io,
    );

    expect(exitCode).toBe(0);
  });

  it("returns 2 for invalid JSON in scan", async () => {
    const output = capture();
    const exitCode = await runCli(["scan", "--json", "--config", fixturePath("invalid-json-config.json")], output.io);

    expect(exitCode).toBe(2);
    const parsed = JSON.parse(output.stdout()) as { errors: Array<{ code: string }> };
    expect(parsed.errors[0]?.code).toBe("invalid_json");
  });
});

describe("generate command", () => {
  it("does not write without --write", async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-doctor-generate-"));
    const outputPath = path.join(cwd, ".mcp.json");
    const output = capture(cwd);
    const exitCode = await runCli(["generate", "--target", "codex", "--server", "filesystem", "--out", outputPath], output.io);

    expect(exitCode).toBe(0);
    expect(output.stdout()).toContain("\"mcpServers\"");
    await expect(fs.stat(outputPath)).rejects.toThrow();
  });
});

describe("test command", () => {
  it("checks command existence without spawning when requested", async () => {
    const output = capture();
    const exitCode = await runCli(
      ["test", "--json", "--no-spawn", "--config", fixturePath("valid-claude-config.json")],
      output.io,
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output.stdout()) as { results: Array<{ status: string }> };
    expect(parsed.results[0]?.status).toBe("skipped");
  });
});
