import fs from "node:fs/promises";
import path from "node:path";
import { Command, CommanderError } from "commander";
import {
  MCP_CLIENT_NAMES,
  RISK_LEVELS,
  auditScanResult,
  discoverConfigPaths,
  generateTemplate,
  isMcpClientName,
  isRiskAtOrAbove,
  isRiskLevel,
  redactSecrets,
  redactString,
  scanMcpConfigs,
  serializeTemplate,
  testServers,
  type McpClientName,
  type RiskIssue,
  type RiskLevel,
  type ScanResult,
  type ServerTestResult,
  type TemplateServer,
  type TemplateTarget,
} from "@mcp-doctor/core";

const VERSION = "0.3.0-alpha";

export interface WritableLike {
  write(chunk: string): unknown;
}

export interface CliIo {
  stdout: WritableLike;
  stderr: WritableLike;
  cwd: string;
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
}

interface BaseOptions {
  json?: boolean;
  config?: string;
  client?: string;
}

interface AuditOptions extends BaseOptions {
  failOn?: string;
}

interface TestOptions extends BaseOptions {
  timeout?: string;
  spawn?: boolean;
}

interface DoctorOptions extends AuditOptions, TestOptions {}

interface GenerateOptions {
  target?: string;
  server?: string;
  out?: string;
  print?: boolean;
  write?: boolean;
  force?: boolean;
}

class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 2) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}

export async function runCli(argv: string[], partialIo: Partial<CliIo> = {}): Promise<number> {
  const io: CliIo = {
    stdout: partialIo.stdout ?? process.stdout,
    stderr: partialIo.stderr ?? process.stderr,
    cwd: partialIo.cwd ?? process.cwd(),
    env: partialIo.env ?? process.env,
    platform: partialIo.platform ?? process.platform,
  };
  const state = { exitCode: 0 };
  const program = createProgram(io, state);

  try {
    await program.parseAsync(argv, { from: "user" });
    return state.exitCode;
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    if (error instanceof CliError) {
      writeLine(io.stderr, `Error: ${redactString(error.message)}`);
      return error.exitCode;
    }

    const message = error instanceof Error ? error.message : "Unknown runtime error.";
    writeLine(io.stderr, `Error: ${redactString(message)}`);
    return 2;
  }
}

function createProgram(io: CliIo, state: { exitCode: number }): Command {
  const program = new Command();
  program
    .name("mcp-doctor")
    .description("Scan, test, and audit local MCP server configurations.")
    .exitOverride()
    .configureOutput({
      writeOut: (value) => io.stdout.write(value),
      writeErr: (value) => io.stderr.write(value),
    });

  program
    .command("scan")
    .description("Detect config files and list MCP servers.")
    .option("--json", "Print JSON output.")
    .option("--config <path>", "Scan a specific config file.")
    .option("--client <name>", `Client name: ${MCP_CLIENT_NAMES.join(", ")}.`)
    .action(async (options: BaseOptions) => {
      state.exitCode = await runScan(options, io);
    });

  program
    .command("audit")
    .description("Run security and configuration checks.")
    .option("--json", "Print JSON output.")
    .option("--config <path>", "Scan a specific config file.")
    .option("--client <name>", `Client name: ${MCP_CLIENT_NAMES.join(", ")}.`)
    .option("--fail-on <level>", `Fail on level: ${RISK_LEVELS.join(", ")}.`, "critical")
    .action(async (options: AuditOptions) => {
      state.exitCode = await runAudit(options, io);
    });

  program
    .command("test")
    .description("Test whether configured commands exist and can start.")
    .option("--json", "Print JSON output.")
    .option("--config <path>", "Scan a specific config file.")
    .option("--client <name>", `Client name: ${MCP_CLIENT_NAMES.join(", ")}.`)
    .option("--timeout <ms>", "Spawn timeout in milliseconds.", "5000")
    .option("--no-spawn", "Skip spawning configured commands.")
    .action(async (options: TestOptions) => {
      state.exitCode = await runTest(options, io);
    });

  program
    .command("doctor")
    .description("Run scan, audit, and test together.")
    .option("--json", "Print JSON output.")
    .option("--config <path>", "Scan a specific config file.")
    .option("--client <name>", `Client name: ${MCP_CLIENT_NAMES.join(", ")}.`)
    .option("--fail-on <level>", `Fail on level: ${RISK_LEVELS.join(", ")}.`, "critical")
    .option("--timeout <ms>", "Spawn timeout in milliseconds.", "5000")
    .option("--no-spawn", "Skip spawning configured commands.")
    .action(async (options: DoctorOptions) => {
      state.exitCode = await runDoctor(options, io);
    });

  program
    .command("generate")
    .description("Generate MCP config templates.")
    .option("--target <client>", "Template target client.", "codex")
    .option("--server <name>", "Template server: filesystem, github, sqlite.", "filesystem")
    .option("--out <path>", "Output file path.")
    .option("--print", "Print generated config.")
    .option("--write", "Write generated config to --out.")
    .option("--force", "Overwrite --out when it already exists.")
    .action(async (options: GenerateOptions) => {
      state.exitCode = await runGenerate(options, io);
    });

  program
    .command("paths")
    .description("Print detected config paths and whether they exist.")
    .option("--json", "Print JSON output.")
    .action((options: { json?: boolean }) => {
      state.exitCode = runPaths(options, io);
    });

  program.command("version").description("Print version and environment information.").action(() => {
    state.exitCode = runVersion(io);
  });

  return program;
}

async function runScan(options: BaseOptions, io: CliIo): Promise<number> {
  const scan = await loadScan(options, io);
  const payload = scanPayload(scan);

  if (options.json) {
    writeJson(io, payload);
  } else {
    writeScanText(io, scan);
  }

  return scan.errors.length > 0 ? 2 : 0;
}

async function runAudit(options: AuditOptions, io: CliIo): Promise<number> {
  const scan = await loadScan(options, io);
  const failOn = parseRiskLevel(options.failOn ?? "critical");
  const issues = await auditScanResult(scan, runtimeOptions(io));
  const failed = issues.some((issue) => isRiskAtOrAbove(issue.level, failOn));
  const payload = auditPayload(issues, failOn, failed);

  if (options.json) {
    writeJson(io, payload);
  } else {
    writeAuditText(io, issues, failOn, failed);
  }

  return failed ? 1 : 0;
}

async function runTest(options: TestOptions, io: CliIo): Promise<number> {
  const scan = await loadScan(options, io);
  if (scan.errors.length > 0) {
    if (options.json) {
      writeJson(io, { command: "test", errors: scan.errors });
    } else {
      writeErrorsText(io, scan.errors.map((error) => error.message));
    }
    return 2;
  }

  const timeoutMs = parseTimeout(options.timeout);
  const results = await testServers(scan.servers, {
    ...runtimeOptions(io),
    timeoutMs,
    spawn: options.spawn,
  });
  const failed = results.some((result) => result.status === "error");

  if (options.json) {
    writeJson(io, { command: "test", results });
  } else {
    writeTestText(io, results);
  }

  return failed ? 1 : 0;
}

async function runDoctor(options: DoctorOptions, io: CliIo): Promise<number> {
  const scan = await loadScan(options, io);
  const failOn = parseRiskLevel(options.failOn ?? "critical");
  const issues = await auditScanResult(scan, runtimeOptions(io));
  const auditFailed = issues.some((issue) => isRiskAtOrAbove(issue.level, failOn));
  const timeoutMs = parseTimeout(options.timeout);
  const testResults =
    scan.errors.length > 0
      ? []
      : await testServers(scan.servers, {
          ...runtimeOptions(io),
          timeoutMs,
          spawn: options.spawn,
        });
  const testFailed = testResults.some((result) => result.status === "error");
  const payload = {
    command: "doctor",
    scan: scanPayload(scan),
    audit: auditPayload(issues, failOn, auditFailed),
    test: {
      results: testResults,
      failed: testFailed,
    },
  };

  if (options.json) {
    writeJson(io, payload);
  } else {
    writeScanText(io, scan);
    writeLine(io.stdout, "");
    writeAuditText(io, issues, failOn, auditFailed);
    writeLine(io.stdout, "");
    writeTestText(io, testResults);
  }

  return auditFailed || testFailed ? 1 : 0;
}

async function runGenerate(options: GenerateOptions, io: CliIo): Promise<number> {
  const target = parseTemplateTarget(options.target ?? "codex");
  const server = parseTemplateServer(options.server ?? "filesystem");
  const template = generateTemplate(target, server);
  const content = serializeTemplate(template);
  const shouldPrint = options.print || !options.write;

  if (options.write) {
    if (!options.out) {
      throw new CliError("--out is required when --write is used.");
    }

    const outputPath = path.resolve(io.cwd, options.out);
    if (!options.force && (await fileExists(outputPath))) {
      throw new CliError("Output file already exists. Use --force to overwrite it.");
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content, "utf8");
    writeLine(io.stdout, `Wrote ${outputPath}`);
  }

  if (shouldPrint) {
    io.stdout.write(content);
  }

  return 0;
}

function runPaths(options: { json?: boolean }, io: CliIo): number {
  const paths = discoverConfigPaths(runtimeOptions(io));

  if (options.json) {
    writeJson(io, { command: "paths", paths });
  } else {
    writeLine(io.stdout, "MCP Doctor Paths");
    for (const candidate of paths) {
      writeLine(
        io.stdout,
        `- ${candidate.client}: ${candidate.path} [${candidate.exists ? "found" : "missing"}]`,
      );
    }
  }

  return 0;
}

function runVersion(io: CliIo): number {
  writeLine(io.stdout, `mcp-doctor ${VERSION}`);
  writeLine(io.stdout, `node ${process.version}`);
  writeLine(io.stdout, `platform ${io.platform} ${process.arch}`);
  return 0;
}

async function loadScan(options: BaseOptions, io: CliIo): Promise<ScanResult> {
  const client = options.client ? parseClient(options.client) : undefined;
  return scanMcpConfigs({
    ...runtimeOptions(io),
    configPath: options.config,
    client,
  });
}

function runtimeOptions(io: CliIo): { cwd: string; env: NodeJS.ProcessEnv; platform: NodeJS.Platform } {
  return {
    cwd: io.cwd,
    env: io.env,
    platform: io.platform,
  };
}

function scanPayload(scan: ScanResult): unknown {
  return {
    command: "scan",
    configPaths: scan.paths,
    servers: scan.servers,
    errors: scan.errors,
  };
}

function auditPayload(issues: RiskIssue[], failOn: RiskLevel, failed: boolean): unknown {
  return {
    command: "audit",
    failOn,
    failed,
    summary: countIssuesByLevel(issues),
    issues,
  };
}

function countIssuesByLevel(issues: RiskIssue[]): Record<RiskLevel, number> {
  const counts: Record<RiskLevel, number> = {
    info: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const issue of issues) {
    counts[issue.level] += 1;
  }

  return counts;
}

function writeScanText(io: CliIo, scan: ScanResult): void {
  writeLine(io.stdout, "MCP Doctor Scan");
  writeLine(io.stdout, "Config files:");

  if (scan.paths.length === 0) {
    writeLine(io.stdout, "- none");
  } else {
    for (const candidate of scan.paths) {
      writeLine(
        io.stdout,
        `- ${candidate.client}: ${candidate.path} [${candidate.exists ? "found" : "missing"}]`,
      );
    }
  }

  writeLine(io.stdout, "Servers:");
  if (scan.servers.length === 0) {
    writeLine(io.stdout, "- none");
  } else {
    for (const server of scan.servers) {
      const endpoint = server.command
        ? `command=${redactString(server.command)}`
        : server.url
          ? `url=${redactString(server.url)}`
          : "endpoint=not configured";
      writeLine(
        io.stdout,
        `- ${server.name} [${server.client}] transport=${server.transport ?? "unknown"} ${endpoint}`,
      );
    }
  }

  if (scan.errors.length > 0) {
    writeLine(io.stdout, "Errors:");
    for (const error of scan.errors) {
      writeLine(io.stdout, `- ${error.client}: ${error.configPath}: ${redactString(error.message)}`);
    }
  }
}

function writeAuditText(
  io: CliIo,
  issues: RiskIssue[],
  failOn: RiskLevel,
  failed: boolean,
): void {
  writeLine(io.stdout, "MCP Doctor Audit");
  writeLine(io.stdout, `Fail threshold: ${failOn}`);
  writeLine(io.stdout, `Result: ${failed ? "failed" : "passed"}`);

  if (issues.length === 0) {
    writeLine(io.stdout, "Issues: none");
    return;
  }

  writeLine(io.stdout, "Issues:");
  for (const issue of issues) {
    const subject = issue.serverName ? `${issue.serverName}: ` : "";
    writeLine(io.stdout, `- ${issue.level} ${issue.code}: ${subject}${issue.message}`);
  }
}

function writeTestText(io: CliIo, results: ServerTestResult[]): void {
  writeLine(io.stdout, "MCP Doctor Test");

  if (results.length === 0) {
    writeLine(io.stdout, "Results: none");
    return;
  }

  for (const result of results) {
    writeLine(io.stdout, `- ${result.status} ${result.serverName}: ${result.message}`);
  }
}

function writeErrorsText(io: CliIo, errors: string[]): void {
  writeLine(io.stderr, "Errors:");
  for (const error of errors) {
    writeLine(io.stderr, `- ${redactString(error)}`);
  }
}

function writeJson(io: CliIo, value: unknown): void {
  writeLine(io.stdout, JSON.stringify(redactSecrets(value), null, 2));
}

function writeLine(stream: WritableLike, value: string): void {
  stream.write(`${value}\n`);
}

function parseClient(value: string): McpClientName {
  if (isMcpClientName(value)) {
    return value;
  }

  throw new CliError(`Unsupported client "${value}".`);
}

function parseRiskLevel(value: string): RiskLevel {
  if (isRiskLevel(value)) {
    return value;
  }

  throw new CliError(`Unsupported risk level "${value}".`);
}

function parseTimeout(value: string | undefined): number {
  const timeout = Number(value ?? "5000");
  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new CliError("--timeout must be a positive number.");
  }

  return Math.round(timeout);
}

function parseTemplateTarget(value: string): TemplateTarget {
  const targets: TemplateTarget[] = ["claude-desktop", "vscode", "cursor", "codex", "gemini"];
  if (targets.includes(value as TemplateTarget)) {
    return value as TemplateTarget;
  }

  throw new CliError(`Unsupported target "${value}".`);
}

function parseTemplateServer(value: string): TemplateServer {
  const servers: TemplateServer[] = ["filesystem", "github", "sqlite"];
  if (servers.includes(value as TemplateServer)) {
    return value as TemplateServer;
  }

  throw new CliError(`Unsupported server template "${value}".`);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
