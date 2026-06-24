import fs from "node:fs";
import path from "node:path";
import { basenameOfCommand } from "./internal.js";
import type { CommandCheckResult } from "./types.js";

export interface CommandLookupOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
}

export function findCommandBinary(command: string, options: CommandLookupOptions = {}): string | undefined {
  const cleaned = command.trim().replace(/^["']|["']$/g, "");
  if (!cleaned) {
    return undefined;
  }

  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;

  if (hasPathSeparator(cleaned) || path.isAbsolute(cleaned)) {
    const candidate = path.isAbsolute(cleaned) ? cleaned : path.resolve(cwd, cleaned);
    return isRunnable(candidate, platform) ? candidate : undefined;
  }

  const pathValue = env.PATH ?? env.Path ?? env.path ?? "";
  const pathEntries = pathValue.split(path.delimiter).filter(Boolean);
  const extensions = commandExtensions(cleaned, env, platform);

  for (const pathEntry of pathEntries) {
    for (const extension of extensions) {
      const candidate = path.join(pathEntry, `${cleaned}${extension}`);
      if (isRunnable(candidate, platform)) {
        return candidate;
      }
    }
  }

  return undefined;
}

export function checkCommand(command: string, options: CommandLookupOptions = {}): CommandCheckResult {
  const resolvedPath = findCommandBinary(command, options);
  const result: CommandCheckResult = {
    command,
    found: Boolean(resolvedPath),
  };

  if (resolvedPath) {
    result.resolvedPath = resolvedPath;
  }

  return result;
}

export function normalizeCommandName(command: string): string {
  return basenameOfCommand(command);
}

function hasPathSeparator(value: string): boolean {
  return value.includes("/") || value.includes("\\");
}

function commandExtensions(
  command: string,
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
): string[] {
  if (platform !== "win32") {
    return [""];
  }

  if (/\.(exe|cmd|bat|com)$/i.test(command)) {
    return [""];
  }

  const raw = env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM";
  return raw
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isRunnable(candidate: string, platform: NodeJS.Platform): boolean {
  try {
    const stat = fs.statSync(candidate);
    if (!stat.isFile()) {
      return false;
    }

    if (platform === "win32") {
      return true;
    }

    fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
