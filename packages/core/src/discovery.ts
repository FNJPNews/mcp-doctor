import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { uniqueByKey } from "./internal.js";
import { normalizeMcpConfig } from "./normalize.js";
import type { ConfigPathCandidate, ConfigParseError, McpClientName, ScanResult } from "./types.js";

export interface DiscoveryOptions {
  cwd?: string;
  homeDir?: string;
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  client?: McpClientName;
  configPath?: string;
  exists?: (candidatePath: string) => boolean;
}

export interface ScanOptions extends DiscoveryOptions {
  readFile?: (candidatePath: string) => Promise<string>;
}

export function discoverConfigPaths(options: DiscoveryOptions = {}): ConfigPathCandidate[] {
  const cwd = options.cwd ?? process.cwd();
  const homeDir = options.homeDir ?? os.homedir();
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const exists = options.exists ?? fs.existsSync;

  if (options.configPath) {
    const explicitPath = path.resolve(cwd, options.configPath);
    return [
      {
        client: options.client ?? "unknown",
        path: explicitPath,
        exists: exists(explicitPath),
        source: "explicit",
      },
    ];
  }

  const candidates: Array<Omit<ConfigPathCandidate, "exists">> = [];

  const addProjectPath = (client: McpClientName, relativePath: string) => {
    candidates.push({
      client,
      path: path.resolve(cwd, relativePath),
      source: "default",
    });
  };

  const addAbsolutePath = (client: McpClientName, candidatePath: string | undefined) => {
    if (!candidatePath) {
      return;
    }
    candidates.push({
      client,
      path: path.resolve(candidatePath),
      source: "default",
    });
  };

  addAbsolutePath("claude-desktop", claudeDesktopPath(platform, env, homeDir));

  addProjectPath("vscode", ".vscode/mcp.json");
  addProjectPath("vscode", ".mcp.json");
  addAbsolutePath("vscode", vscodeUserSettingsPath(platform, env, homeDir));

  addProjectPath("cursor", ".cursor/mcp.json");
  addProjectPath("cursor", ".cursor/settings.json");
  addProjectPath("cursor", ".mcp.json");

  addProjectPath("codex", ".mcp.json");
  addProjectPath("codex", "mcp.json");
  addProjectPath("codex", ".codex/mcp.json");
  addProjectPath("codex", ".codex/config.json");

  addProjectPath("gemini", ".gemini/mcp.json");
  addProjectPath("gemini", ".gemini/settings.json");
  addProjectPath("gemini", ".mcp.json");

  const filtered = candidates.filter((candidate) => !options.client || candidate.client === options.client);
  return uniqueByKey(filtered, (candidate) => `${candidate.client}:${candidate.path}`).map((candidate) => ({
    ...candidate,
    exists: exists(candidate.path),
  }));
}

export async function scanMcpConfigs(options: ScanOptions = {}): Promise<ScanResult> {
  const readFile = options.readFile ?? ((candidatePath: string) => fs.promises.readFile(candidatePath, "utf8"));
  const paths = discoverConfigPaths(options);
  const servers = [];
  const errors: ConfigParseError[] = [];

  for (const candidate of paths) {
    if (!candidate.exists) {
      if (candidate.source === "explicit") {
        errors.push({
          client: candidate.client,
          configPath: candidate.path,
          code: "not_found",
          message: "Config file was not found.",
        });
      }
      continue;
    }

    try {
      const text = await readFile(candidate.path);
      const raw = JSON.parse(text) as unknown;
      servers.push(...normalizeMcpConfig(raw, candidate.client, candidate.path));
    } catch (error) {
      errors.push(toParseError(error, candidate.client, candidate.path));
    }
  }

  return { paths, servers, errors };
}

function claudeDesktopPath(
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
  homeDir: string,
): string | undefined {
  if (platform === "win32") {
    return env.APPDATA ? path.join(env.APPDATA, "Claude", "claude_desktop_config.json") : undefined;
  }

  if (platform === "darwin") {
    return path.join(homeDir, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }

  return path.join(homeDir, ".config", "Claude", "claude_desktop_config.json");
}

function vscodeUserSettingsPath(
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
  homeDir: string,
): string | undefined {
  if (platform === "win32") {
    return env.APPDATA ? path.join(env.APPDATA, "Code", "User", "settings.json") : undefined;
  }

  if (platform === "darwin") {
    return path.join(homeDir, "Library", "Application Support", "Code", "User", "settings.json");
  }

  return path.join(homeDir, ".config", "Code", "User", "settings.json");
}

function toParseError(error: unknown, client: McpClientName, configPath: string): ConfigParseError {
  const message = error instanceof Error ? error.message : "Unknown parse error.";
  const code = error instanceof SyntaxError ? "invalid_json" : "read_error";
  return {
    client,
    configPath,
    code,
    message,
  };
}
