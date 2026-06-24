# v0.1.0-alpha

This is the first public preview release of MCP Doctor.

MCP Doctor is a local-first CLI and VS Code extension for scanning, testing, and auditing MCP server configurations.

## Main Features

- Discovers common MCP configuration paths for Claude Desktop, VS Code, Cursor, Codex, and Gemini CLI.
- Normalizes MCP server configurations into a common model.
- Redacts secret-like values before text or JSON output.
- Audits risky configuration patterns such as shell execution, broad filesystem access, unpinned `npx`, plain HTTP transports, missing commands, duplicate server names, and unknown transports.
- Checks whether configured command binaries exist on PATH.
- Optionally starts stdio server commands with a bounded timeout.
- Generates MCP configuration templates without writing files by default.
- Includes a VS Code extension package that builds locally and uses the shared core package.

## Early Preview Status

This release is `v0.1.0-alpha`. Interfaces, rules, output details, and package layout may change before a stable release.

## Known Limitations

- The package is not published to npm.
- The VS Code extension is not packaged as a `.vsix` and is not published to the VS Code Marketplace.
- Codex and Gemini support are best effort because local configuration paths may vary.
- Static analysis cannot guarantee that an MCP server is safe.
- Redaction is best effort and cannot cover every possible secret format.
- Optional spawn tests execute configured commands locally and should only be used with configurations you intend to test.

## Feedback Wanted

Feedback is useful on supported client paths, risk-rule accuracy, JSON output shape, redaction behavior, and practical CLI workflows.

Please do not include real tokens, API keys, passwords, private keys, credentials, or other secrets in issues or discussions.
