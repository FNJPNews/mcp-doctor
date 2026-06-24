import { normalizeCommandName } from "./command.js";
import { isRecord } from "./internal.js";
import { isSensitiveKey, looksLikeSecretString, redactSecrets } from "./redact.js";
import type { NormalizedMcpServer, RiskIssue, RiskLevel, ScanResult } from "./types.js";
import { validateRawServer } from "./validation.js";
import { checkCommand, type CommandLookupOptions } from "./command.js";

export interface AuditOptions extends CommandLookupOptions {
  checkCommands?: boolean;
}

const SHELL_COMMANDS = new Set(["sh", "bash"]);
const DANGEROUS_BINARIES = new Set(["rm", "curl", "wget", "powershell", "pwsh", "cmd", "bash", "sh", "osascript"]);

export async function auditScanResult(
  scanResult: ScanResult,
  options: AuditOptions = {},
): Promise<RiskIssue[]> {
  const issues: RiskIssue[] = [];

  for (const error of scanResult.errors) {
    issues.push({
      level: "critical",
      code: error.code,
      message: error.code === "invalid_json" ? "Config file contains invalid JSON." : error.message,
      client: error.client,
      configPath: error.configPath,
    });
  }

  issues.push(...duplicateServerIssues(scanResult.servers));

  for (const server of scanResult.servers) {
    issues.push(...auditServer(server, options));
  }

  return issues;
}

function auditServer(server: NormalizedMcpServer, options: AuditOptions): RiskIssue[] {
  const issues: RiskIssue[] = [];
  const transport = server.transport ?? "unknown";
  const args = server.args ?? [];
  const commandName = server.command ? normalizeCommandName(server.command) : undefined;

  if (server.disabled) {
    issues.push(serverIssue(server, "info", "disabled_server", "Server is disabled."));
  }

  const validation = validateRawServer(server.raw ?? {});
  if (!validation.valid) {
    issues.push(
      serverIssue(server, "low", "invalid_server_shape", "Server config does not match the expected schema.", {
        errors: validation.errors,
      }),
    );
  }

  if (transport === "unknown") {
    issues.push(serverIssue(server, "low", "unknown_transport", "Server transport is unknown."));
  }

  if (transport === "stdio" && !server.command) {
    issues.push(serverIssue(server, "high", "missing_stdio_command", "Stdio server is missing a command."));
  }

  if (transport === "stdio" && server.command && options.checkCommands !== false) {
    const commandCheck = checkCommand(server.command, options);
    if (!commandCheck.found) {
      issues.push(
        serverIssue(server, "high", "command_not_found", "Configured command was not found in PATH.", {
          command: server.command,
        }),
      );
    }
  }

  if (server.env) {
    for (const [name, value] of Object.entries(server.env)) {
      if (value.trim() === "") {
        issues.push(
          serverIssue(server, "medium", "missing_env_value", "Environment variable has no value.", {
            env: name,
          }),
        );
      }

      if (isSensitiveKey(name) && value.trim() !== "") {
        issues.push(
          serverIssue(
            server,
            "medium",
            "inline_secret_env",
            "Environment variable name suggests a secret and has an inline value.",
            { env: name },
          ),
        );
      }
    }
  }

  if (containsSecretLikeValue(server.raw)) {
    issues.push(
      serverIssue(
        server,
        "high",
        "token_like_value",
        "Token-like or key-like string appears in the config.",
      ),
    );
  }

  for (const arg of args) {
    if (isBroadFilesystemPath(arg)) {
      issues.push(
        serverIssue(server, "high", "broad_filesystem_access", "Argument appears to grant broad filesystem access.", {
          arg: redactSecrets(arg),
        }),
      );
      break;
    }
  }

  if (isShellExecution(commandName, args)) {
    issues.push(
      serverIssue(server, "high", "shell_execution", "Server command uses shell execution with inline commands."),
    );
  }

  if (commandName === "npx" && isUnpinnedNpx(args)) {
    issues.push(serverIssue(server, "medium", "npx_unpinned", "npx package is not pinned to a version."));
  }

  if (commandName && isDangerousBinary(commandName, args)) {
    const level: RiskLevel = commandName === "node" || commandName === "python" ? "high" : "medium";
    issues.push(
      serverIssue(server, level, "dangerous_binary", "Server command uses a potentially dangerous binary.", {
        command: server.command,
      }),
    );
  }

  if (server.url?.startsWith("http://")) {
    issues.push(
      serverIssue(server, "medium", "plain_http_transport", "Remote transport uses plain HTTP."),
    );
  }

  if (args.some((arg) => arg.length > 512) || args.join(" ").length > 2048) {
    issues.push(serverIssue(server, "low", "very_long_args", "Server command has very long arguments."));
  }

  return issues;
}

function duplicateServerIssues(servers: NormalizedMcpServer[]): RiskIssue[] {
  const byName = new Map<string, NormalizedMcpServer[]>();
  for (const server of servers) {
    const key = server.name.toLowerCase();
    const current = byName.get(key) ?? [];
    current.push(server);
    byName.set(key, current);
  }

  const issues: RiskIssue[] = [];
  for (const duplicates of byName.values()) {
    if (duplicates.length < 2) {
      continue;
    }

    for (const server of duplicates) {
      issues.push(serverIssue(server, "low", "duplicate_server_name", "Duplicate server name detected."));
    }
  }

  return issues;
}

function containsSecretLikeValue(value: unknown): boolean {
  if (typeof value === "string") {
    return looksLikeSecretString(value);
  }

  if (Array.isArray(value)) {
    return value.some((entry) => containsSecretLikeValue(entry));
  }

  if (isRecord(value)) {
    return Object.entries(value).some(([key, entry]) => {
      if (isSensitiveKey(key) && typeof entry === "string" && entry.trim() !== "") {
        return true;
      }
      return containsSecretLikeValue(entry);
    });
  }

  return false;
}

function isBroadFilesystemPath(value: string): boolean {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  const normalized = trimmed.replace(/\//g, "\\");

  return (
    trimmed === "/" ||
    trimmed === "~" ||
    /^~[/\\]?$/.test(trimmed) ||
    /^%USERPROFILE%$/i.test(trimmed) ||
    /^[A-Za-z]:\\?$/.test(normalized) ||
    /(?:^|=)(?:\/|~|%USERPROFILE%|[A-Za-z]:[\\/])(?:$|[\\/])/.test(trimmed)
  );
}

function isShellExecution(commandName: string | undefined, args: string[]): boolean {
  if (!commandName) {
    return false;
  }

  const loweredArgs = args.map((arg) => arg.toLowerCase());

  if (SHELL_COMMANDS.has(commandName) && loweredArgs.includes("-c")) {
    return true;
  }

  if (commandName === "cmd" && loweredArgs.includes("/c")) {
    return true;
  }

  if ((commandName === "powershell" || commandName === "pwsh") && loweredArgs.includes("-command")) {
    return true;
  }

  return false;
}

function isUnpinnedNpx(args: string[]): boolean {
  const packageName = args.find((arg) => !arg.startsWith("-") && arg !== "npx");
  if (!packageName) {
    return true;
  }

  if (packageName.startsWith("@")) {
    const slashIndex = packageName.indexOf("/");
    const versionIndex = packageName.lastIndexOf("@");
    return versionIndex <= slashIndex || packageName.endsWith("@latest");
  }

  return !packageName.includes("@") || packageName.endsWith("@latest");
}

function isDangerousBinary(commandName: string, args: string[]): boolean {
  if (DANGEROUS_BINARIES.has(commandName)) {
    return true;
  }

  const loweredArgs = args.map((arg) => arg.toLowerCase());
  if (commandName === "python" && loweredArgs.includes("-c")) {
    return true;
  }

  if (commandName === "node" && loweredArgs.includes("-e")) {
    return true;
  }

  return false;
}

function serverIssue(
  server: NormalizedMcpServer,
  level: RiskLevel,
  code: string,
  message: string,
  details?: unknown,
): RiskIssue {
  const issue: RiskIssue = {
    level,
    code,
    message,
    client: server.client,
    configPath: server.configPath,
    serverId: server.id,
    serverName: server.name,
  };

  if (details !== undefined) {
    issue.details = redactSecrets(details);
  }

  return issue;
}
