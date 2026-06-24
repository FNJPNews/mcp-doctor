import * as vscode from "vscode";
import {
  auditScanResult,
  redactSecrets,
  scanMcpConfigs,
  testServers,
  type McpClientName,
  type NormalizedMcpServer,
  type RiskIssue,
  type ScanResult,
  type ServerTestResult,
} from "@mcp-doctor/core";

type ServerStatus = "ok" | "warning" | "error" | "unknown";

interface ClientNode {
  kind: "client";
  client: McpClientName;
  servers: ServerNode[];
}

interface ServerNode {
  kind: "server";
  server: NormalizedMcpServer;
  status: ServerStatus;
  issues: RiskIssue[];
}

interface MessageNode {
  kind: "message";
  label: string;
}

type DoctorNode = ClientNode | ServerNode | MessageNode;

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel("MCP Doctor");
  const provider = new McpDoctorProvider(output);

  context.subscriptions.push(output);
  context.subscriptions.push(vscode.window.registerTreeDataProvider("mcpDoctorView", provider));
  context.subscriptions.push(vscode.commands.registerCommand("mcpDoctor.refresh", () => provider.refresh()));
  context.subscriptions.push(vscode.commands.registerCommand("mcpDoctor.scan", () => runScan(output)));
  context.subscriptions.push(vscode.commands.registerCommand("mcpDoctor.audit", () => runAudit(output)));
  context.subscriptions.push(vscode.commands.registerCommand("mcpDoctor.test", () => runTest(output)));
  context.subscriptions.push(
    vscode.commands.registerCommand("mcpDoctor.openConfigFile", (node?: DoctorNode) =>
      openConfigFile(node),
    ),
  );

  void provider.refresh();
}

export function deactivate(): void {
  return;
}

class McpDoctorProvider implements vscode.TreeDataProvider<DoctorNode> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<DoctorNode | undefined>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
  private nodes: DoctorNode[] = [{ kind: "message", label: "No scan results." }];

  constructor(private readonly output: vscode.OutputChannel) {}

  async refresh(): Promise<void> {
    try {
      const scan = await loadScan();
      const issues = await auditScanResult(scan, { cwd: workspaceRoot() });
      this.nodes = buildNodes(scan, issues);
      this.onDidChangeTreeDataEmitter.fire(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown MCP Doctor error.";
      this.output.appendLine(`Refresh failed: ${message}`);
      this.nodes = [{ kind: "message", label: "Refresh failed." }];
      this.onDidChangeTreeDataEmitter.fire(undefined);
      void vscode.window.showErrorMessage(`MCP Doctor: ${message}`);
    }
  }

  getChildren(element?: DoctorNode): DoctorNode[] {
    if (!element) {
      return this.nodes;
    }

    if (element.kind === "client") {
      return element.servers;
    }

    return [];
  }

  getTreeItem(element: DoctorNode): vscode.TreeItem {
    if (element.kind === "message") {
      return new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
    }

    if (element.kind === "client") {
      const item = new vscode.TreeItem(element.client, vscode.TreeItemCollapsibleState.Expanded);
      item.description = `${element.servers.length} server${element.servers.length === 1 ? "" : "s"}`;
      return item;
    }

    const item = new vscode.TreeItem(element.server.name, vscode.TreeItemCollapsibleState.None);
    item.description = element.status;
    item.tooltip = tooltipForServer(element);
    item.contextValue = "mcpDoctorServer";
    item.command = {
      command: "mcpDoctor.openConfigFile",
      title: "MCP Doctor: Open Config File",
      arguments: [element],
    };
    return item;
  }
}

async function runScan(output: vscode.OutputChannel): Promise<void> {
  try {
    const scan = await loadScan();
    showOutput(output, "Scan", scan);
  } catch (error) {
    showError(output, "Scan failed", error);
  }
}

async function runAudit(output: vscode.OutputChannel): Promise<void> {
  try {
    const scan = await loadScan();
    const issues = await auditScanResult(scan, { cwd: workspaceRoot() });
    showOutput(output, "Audit", { issues });
  } catch (error) {
    showError(output, "Audit failed", error);
  }
}

async function runTest(output: vscode.OutputChannel): Promise<void> {
  try {
    const scan = await loadScan();
    const results: ServerTestResult[] = await testServers(scan.servers, {
      cwd: workspaceRoot(),
      timeoutMs: 5000,
    });
    showOutput(output, "Test", { results });
  } catch (error) {
    showError(output, "Test failed", error);
  }
}

async function openConfigFile(node?: DoctorNode): Promise<void> {
  if (!node || node.kind !== "server") {
    void vscode.window.showInformationMessage("Select an MCP server to open its config file.");
    return;
  }

  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(node.server.configPath));
  await vscode.window.showTextDocument(document, { preview: false });
}

async function loadScan(): Promise<ScanResult> {
  return scanMcpConfigs({ cwd: workspaceRoot() });
}

function buildNodes(scan: ScanResult, issues: RiskIssue[]): DoctorNode[] {
  if (scan.servers.length === 0) {
    return [{ kind: "message", label: "No MCP servers found." }];
  }

  const byClient = new Map<McpClientName, ServerNode[]>();
  for (const server of scan.servers) {
    const serverIssues = issues.filter((issue) => issue.serverId === server.id);
    const node: ServerNode = {
      kind: "server",
      server,
      status: statusForIssues(serverIssues),
      issues: serverIssues,
    };
    const existing = byClient.get(server.client) ?? [];
    existing.push(node);
    byClient.set(server.client, existing);
  }

  return Array.from(byClient.entries()).map(([client, servers]) => ({
    kind: "client",
    client,
    servers,
  }));
}

function statusForIssues(issues: RiskIssue[]): ServerStatus {
  if (issues.some((issue) => issue.level === "critical" || issue.level === "high")) {
    return "error";
  }

  if (issues.length > 0) {
    return "warning";
  }

  return "ok";
}

function tooltipForServer(node: ServerNode): string {
  if (node.issues.length === 0) {
    return `${node.server.name}: ok`;
  }

  return node.issues.map((issue) => `${issue.level} ${issue.code}: ${issue.message}`).join("\n");
}

function showOutput(output: vscode.OutputChannel, title: string, value: unknown): void {
  output.clear();
  output.appendLine(`MCP Doctor ${title}`);
  output.appendLine(JSON.stringify(redactSecrets(value), null, 2));
  output.show(true);
}

function showError(output: vscode.OutputChannel, title: string, error: unknown): void {
  const message = error instanceof Error ? error.message : "Unknown MCP Doctor error.";
  output.appendLine(`${title}: ${message}`);
  output.show(true);
  void vscode.window.showErrorMessage(`MCP Doctor: ${message}`);
}

function workspaceRoot(): string {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
}
