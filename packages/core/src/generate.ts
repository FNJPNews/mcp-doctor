import type { McpClientName } from "./types.js";

export type TemplateTarget = Exclude<McpClientName, "unknown">;
export type TemplateServer = "filesystem" | "github" | "sqlite";

interface TemplateServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export function generateTemplate(target: TemplateTarget, server: TemplateServer): unknown {
  const serverConfig = templateServerConfig(server);
  const serverName = server;

  if (target === "vscode") {
    return {
      servers: {
        [serverName]: serverConfig,
      },
    };
  }

  return {
    mcpServers: {
      [serverName]: serverConfig,
    },
  };
}

export function serializeTemplate(template: unknown): string {
  return `${JSON.stringify(template, null, 2)}\n`;
}

function templateServerConfig(server: TemplateServer): TemplateServerConfig {
  switch (server) {
    case "filesystem":
      return {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem@<version>", "/path/to/allowed-directory"],
      };
    case "github":
      return {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github@<version>"],
        env: {
          GITHUB_TOKEN: "<set-in-your-shell-or-secret-manager>",
        },
      };
    case "sqlite":
      return {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-sqlite@<version>", "/path/to/database.sqlite"],
      };
  }
}
