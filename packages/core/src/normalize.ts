import path from "node:path";
import { asBoolean, asString, isRecord, stableServerId, toStringArray } from "./internal.js";
import type { McpClientName, McpTransport, NormalizedMcpServer } from "./types.js";

interface ServerEntry {
  name: string;
  value: unknown;
}

export function normalizeMcpConfig(
  raw: unknown,
  client: McpClientName,
  configPath: string,
): NormalizedMcpServer[] {
  const entries = extractServerEntries(raw);

  return entries.map((entry, index) => normalizeServer(entry, client, configPath, index));
}

function extractServerEntries(raw: unknown): ServerEntry[] {
  if (!isRecord(raw)) {
    return [];
  }

  const candidates = [
    raw.mcpServers,
    raw.servers,
    raw["mcp.servers"],
    isRecord(raw.mcp) ? raw.mcp.servers : undefined,
  ];

  for (const candidate of candidates) {
    const entries = entriesFromCollection(candidate);
    if (entries.length > 0) {
      return entries;
    }
  }

  return [];
}

function entriesFromCollection(value: unknown): ServerEntry[] {
  if (Array.isArray(value)) {
    return value.map((entry, index) => {
      const name = isRecord(entry) && typeof entry.name === "string" ? entry.name : `server-${index + 1}`;
      return { name, value: entry };
    });
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).map(([name, entry]) => ({ name, value: entry }));
}

function normalizeServer(
  entry: ServerEntry,
  client: McpClientName,
  configPath: string,
  index: number,
): NormalizedMcpServer {
  const record = isRecord(entry.value) ? entry.value : {};
  const command = asString(record.command);
  const args = toStringArray(record.args);
  const url = asString(record.url);
  const explicitTransport = asString(record.transport);
  const transport = normalizeTransport(explicitTransport, command, url);
  const env = normalizeEnv(record.env);
  const disabled = asBoolean(record.disabled);
  const normalizedPath = path.resolve(configPath);

  const server: NormalizedMcpServer = {
    id: stableServerId(client, normalizedPath, entry.name, index),
    name: entry.name,
    client,
    configPath: normalizedPath,
    transport,
    raw: entry.value,
  };

  if (command) {
    server.command = command;
  }
  if (args) {
    server.args = args;
  }
  if (env) {
    server.env = env;
  }
  if (url) {
    server.url = url;
  }
  if (disabled !== undefined) {
    server.disabled = disabled;
  }

  return server;
}

function normalizeTransport(
  explicitTransport: string | undefined,
  command: string | undefined,
  url: string | undefined,
): McpTransport {
  if (
    explicitTransport === "stdio" ||
    explicitTransport === "http" ||
    explicitTransport === "sse" ||
    explicitTransport === "unknown"
  ) {
    return explicitTransport;
  }

  if (command) {
    return "stdio";
  }

  if (url) {
    return "http";
  }

  return "unknown";
}

function normalizeEnv(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const result: Record<string, string> = {};
  for (const [key, envValue] of Object.entries(value)) {
    if (envValue === null || envValue === undefined) {
      result[key] = "";
    } else if (typeof envValue === "string") {
      result[key] = envValue;
    } else {
      result[key] = String(envValue);
    }
  }

  return result;
}
