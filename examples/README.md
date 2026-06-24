# Examples

These examples are safe sample MCP configuration files for trying MCP Doctor locally. They use placeholders only and do not contain real tokens, passwords, credentials, or private keys.

Run from the repository root after building:

```sh
corepack pnpm build
corepack pnpm cli scan --config examples/vscode/mcp.json
corepack pnpm cli audit --config examples/vscode/mcp.json
corepack pnpm cli test --no-spawn --config examples/vscode/mcp.json
corepack pnpm cli doctor --no-spawn --config examples/vscode/mcp.json
```

## Example Files

- `claude-desktop/claude_desktop_config.json`: Claude Desktop-style config with a safe placeholder server.
- `vscode/mcp.json`: VS Code-style config with a safe placeholder server.
- `cursor/mcp.json`: Cursor-style config with a disabled server.
- `codex/mcp.json`: Codex-style config with a documented risky shell example.
- `gemini/mcp.json`: Gemini-style config with a placeholder HTTP server.

## Risky Example

`examples/codex/mcp.json` intentionally includes a server that uses shell execution through `bash -c`. This is included to demonstrate an audit warning. Do not copy that pattern into a real MCP config unless you understand exactly what command will run and why it is needed.

Warnings are signals to review. They are not proof that a server is compromised.
