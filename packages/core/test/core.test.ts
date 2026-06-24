import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  auditScanResult,
  checkCommand,
  discoverConfigPaths,
  generateTemplate,
  redactSecrets,
  scanMcpConfigs,
  validateRawServer,
} from "../src/index.js";

const fixturesDir = fileURLToPath(new URL("./fixtures/", import.meta.url));

function fixturePath(name: string): string {
  return path.join(fixturesDir, name);
}

async function scanFixture(name: string) {
  return scanMcpConfigs({
    configPath: fixturePath(name),
    client: "claude-desktop",
  });
}

async function issueCodesForFixture(name: string): Promise<string[]> {
  const scan = await scanFixture(name);
  const issues = await auditScanResult(scan, { checkCommands: false });
  return issues.map((issue) => issue.code);
}

describe("discovery", () => {
  it("detects project config candidates and existence", async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-doctor-discovery-"));
    await fs.mkdir(path.join(cwd, ".vscode"), { recursive: true });
    await fs.writeFile(path.join(cwd, ".vscode", "mcp.json"), "{}", "utf8");

    const paths = discoverConfigPaths({
      cwd,
      homeDir: cwd,
      platform: "linux",
      env: {},
    });

    const vscodePath = paths.find(
      (candidate) =>
        candidate.client === "vscode" &&
        candidate.path.replace(/\\/g, "/").endsWith(".vscode/mcp.json"),
    );
    expect(vscodePath?.exists).toBe(true);
  });
});

describe("scan and normalization", () => {
  it("parses a valid Claude config into normalized servers", async () => {
    const scan = await scanFixture("valid-claude-config.json");

    expect(scan.errors).toHaveLength(0);
    expect(scan.servers).toHaveLength(1);
    expect(scan.servers[0]?.name).toBe("filesystem");
    expect(scan.servers[0]?.transport).toBe("stdio");
  });

  it("reports invalid JSON as a critical audit issue", async () => {
    const scan = await scanFixture("invalid-json-config.json");
    const issues = await auditScanResult(scan, { checkCommands: false });

    expect(scan.errors[0]?.code).toBe("invalid_json");
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ level: "critical", code: "invalid_json" })]));
  });
});

describe("validation", () => {
  it("validates raw server config with Zod", () => {
    expect(validateRawServer({ command: "node", args: ["server.js"] }).valid).toBe(true);
    expect(validateRawServer({ command: "node", args: "server.js" }).valid).toBe(false);
  });
});

describe("redaction", () => {
  it("redacts secret keys, bearer tokens, and token-like values", () => {
    const redacted = redactSecrets({
      SERVICE_TOKEN: "placeholder-value",
      header: ["Bearer", "placeholder-value"].join(" "),
      nested: {
        apiKey: "placeholder-api-key-value",
      },
    });

    const text = JSON.stringify(redacted);
    expect(text).not.toContain("placeholder-value");
    expect(text).not.toContain("placeholder-api-key-value");
    expect(text).toContain("[REDACTED]");
  });
});

describe("audit rules", () => {
  it("flags missing env values", async () => {
    await expect(issueCodesForFixture("missing-env-config.json")).resolves.toContain("missing_env_value");
  });

  it("flags inline secret env values", async () => {
    const codes = await issueCodesForFixture("secret-env-config.json");
    expect(codes).toContain("inline_secret_env");
    expect(codes).toContain("token_like_value");
  });

  it("flags broad filesystem access", async () => {
    await expect(issueCodesForFixture("broad-filesystem-access-config.json")).resolves.toContain(
      "broad_filesystem_access",
    );
  });

  it("flags unpinned npx packages", async () => {
    await expect(issueCodesForFixture("npx-unpinned-config.json")).resolves.toContain("npx_unpinned");
  });

  it("flags shell command execution", async () => {
    await expect(issueCodesForFixture("shell-command-config.json")).resolves.toContain("shell_execution");
  });

  it("flags duplicate server names", async () => {
    await expect(issueCodesForFixture("duplicate-server-names-config.json")).resolves.toContain(
      "duplicate_server_name",
    );
  });
});

describe("command checks", () => {
  it("detects existing and missing commands without a shell", () => {
    expect(checkCommand(process.execPath).found).toBe(true);
    expect(checkCommand("mcp-doctor-command-that-should-not-exist").found).toBe(false);
  });
});

describe("templates", () => {
  it("generates supported template shapes", () => {
    expect(generateTemplate("codex", "filesystem")).toMatchObject({
      mcpServers: {
        filesystem: {
          command: "npx",
        },
      },
    });

    expect(generateTemplate("vscode", "sqlite")).toMatchObject({
      servers: {
        sqlite: {
          command: "npx",
        },
      },
    });
  });
});
