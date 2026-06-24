export const MCP_CLIENT_NAMES = [
  "claude-desktop",
  "vscode",
  "cursor",
  "codex",
  "gemini",
  "unknown",
] as const;

export type McpClientName = (typeof MCP_CLIENT_NAMES)[number];

export const MCP_TRANSPORTS = ["stdio", "http", "sse", "unknown"] as const;

export type McpTransport = (typeof MCP_TRANSPORTS)[number];

export const RISK_LEVELS = ["info", "low", "medium", "high", "critical"] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];

export const RISK_LEVEL_WEIGHT: Record<RiskLevel, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export interface NormalizedMcpServer {
  id: string;
  name: string;
  client: McpClientName;
  configPath: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  transport?: McpTransport;
  disabled?: boolean;
  raw?: unknown;
}

export interface ConfigPathCandidate {
  client: McpClientName;
  path: string;
  exists: boolean;
  source: "default" | "explicit";
}

export interface ConfigParseError {
  client: McpClientName;
  configPath: string;
  code: "invalid_json" | "read_error" | "not_found";
  message: string;
}

export interface ScanResult {
  paths: ConfigPathCandidate[];
  servers: NormalizedMcpServer[];
  errors: ConfigParseError[];
}

export interface RiskIssue {
  level: RiskLevel;
  code: string;
  message: string;
  client?: McpClientName;
  configPath?: string;
  serverId?: string;
  serverName?: string;
  details?: unknown;
}

export interface CommandCheckResult {
  command: string;
  found: boolean;
  resolvedPath?: string;
}

export interface ServerTestResult {
  serverId: string;
  serverName: string;
  client: McpClientName;
  configPath: string;
  status: "ok" | "warning" | "error" | "skipped";
  message: string;
  command?: string;
  durationMs?: number;
  stdout?: string;
  stderr?: string;
}

export function isMcpClientName(value: string): value is McpClientName {
  return (MCP_CLIENT_NAMES as readonly string[]).includes(value);
}

export function isRiskLevel(value: string): value is RiskLevel {
  return (RISK_LEVELS as readonly string[]).includes(value);
}

export function isRiskAtOrAbove(level: RiskLevel, threshold: RiskLevel): boolean {
  return RISK_LEVEL_WEIGHT[level] >= RISK_LEVEL_WEIGHT[threshold];
}
