import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { findCommandBinary } from "./command.js";
import { redactString } from "./redact.js";
import type { NormalizedMcpServer, ServerTestResult } from "./types.js";

export interface TestServerOptions {
  timeoutMs?: number;
  spawn?: boolean;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
}

export async function testServers(
  servers: NormalizedMcpServer[],
  options: TestServerOptions = {},
): Promise<ServerTestResult[]> {
  const results: ServerTestResult[] = [];

  for (const server of servers) {
    results.push(await testServer(server, options));
  }

  return results;
}

async function testServer(
  server: NormalizedMcpServer,
  options: TestServerOptions,
): Promise<ServerTestResult> {
  if (server.disabled) {
    return baseResult(server, "skipped", "Server is disabled.");
  }

  if ((server.transport ?? "unknown") !== "stdio") {
    return baseResult(server, "skipped", "Only stdio server commands can be spawned.");
  }

  if (!server.command) {
    return baseResult(server, "error", "Stdio server is missing a command.");
  }

  const resolvedPath = findCommandBinary(server.command, options);
  if (!resolvedPath) {
    return baseResult(server, "error", "Configured command was not found in PATH.");
  }

  if (options.spawn === false) {
    return baseResult(server, "skipped", "Spawn test was disabled.", server.command);
  }

  return spawnWithTimeout(server, resolvedPath, options);
}

function spawnWithTimeout(
  server: NormalizedMcpServer,
  resolvedPath: string,
  options: TestServerOptions,
): Promise<ServerTestResult> {
  const timeoutMs = Math.max(1, options.timeoutMs ?? 5000);
  const startedAt = performance.now();
  const child = spawn(resolvedPath, server.args ?? [], {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, ...(options.env ?? {}), ...(server.env ?? {}) },
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  child.stdout?.on("data", (chunk: Buffer) => {
    stdout += chunk.toString("utf8");
    stdout = stdout.slice(-4096);
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString("utf8");
    stderr = stderr.slice(-4096);
  });

  return new Promise<ServerTestResult>((resolve) => {
    let settled = false;

    const finish = (result: ServerTestResult) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      child.kill();
      finish({
        ...baseResult(server, "ok", "Process started and was stopped after the timeout.", server.command),
        durationMs: Math.round(performance.now() - startedAt),
        stdout: redactString(stdout),
        stderr: redactString(stderr),
      });
    }, timeoutMs);

    child.once("error", (error) => {
      finish({
        ...baseResult(server, "error", error.message, server.command),
        durationMs: Math.round(performance.now() - startedAt),
        stdout: redactString(stdout),
        stderr: redactString(stderr),
      });
    });

    child.once("exit", (code, signal) => {
      const ok = code === 0;
      const message = ok
        ? "Process exited successfully."
        : `Process exited with code ${code ?? "unknown"}${signal ? ` and signal ${signal}` : ""}.`;
      finish({
        ...baseResult(server, ok ? "ok" : "error", message, server.command),
        durationMs: Math.round(performance.now() - startedAt),
        stdout: redactString(stdout),
        stderr: redactString(stderr),
      });
    });
  });
}

function baseResult(
  server: NormalizedMcpServer,
  status: ServerTestResult["status"],
  message: string,
  command?: string,
): ServerTestResult {
  const result: ServerTestResult = {
    serverId: server.id,
    serverName: server.name,
    client: server.client,
    configPath: server.configPath,
    status,
    message,
  };

  if (command) {
    result.command = command;
  }

  return result;
}
