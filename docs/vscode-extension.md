# VS Code Extension

The VS Code extension package builds locally from `packages/vscode-extension`. It is not packaged as a `.vsix` and is not published to the VS Code Marketplace.

The extension uses `@mcp-doctor/core` for scan, audit, and test behavior.

## Commands

- MCP Doctor: Refresh
- MCP Doctor: Run Scan
- MCP Doctor: Run Audit
- MCP Doctor: Run Test
- MCP Doctor: Open Config File

## Text Preview

This is a text preview, not a screenshot.

```text
MCP Doctor
+-- vscode                         1 server
|   +-- example-filesystem          ok
+-- codex                          1 server
|   +-- risky-shell-example         warning
+-- claude-desktop                 no servers found
```

Statuses are summarized as `ok`, `warning`, `error`, or `unknown`. Warnings are review signals, not proof that a server is compromised.
