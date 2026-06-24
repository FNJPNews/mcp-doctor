# v0.2.0-alpha

This is the second public preview release of MCP Doctor.

MCP Doctor is a local-first CLI and VS Code extension package for scanning, testing, and auditing MCP server configurations.

## Added

- npm publishing documentation in `docs/npm-publishing.md`.
- Project roadmap in `docs/roadmap.md`.
- Release checklist in `docs/release-checklist.md`.
- VS Code extension documentation and text sidebar preview in `docs/vscode-extension.md`.
- Safe example MCP configs for Claude Desktop, VS Code, Cursor, Codex, and Gemini under `examples/`.

## Improved

- README local testing documentation now shows `corepack pnpm` workflows.
- README includes sample output for `paths`, `scan`, `audit`, `test --no-spawn`, and `doctor --no-spawn`.
- README clarifies that warnings are review signals, not proof of compromise.
- Package metadata now declares intended future package files for generated build output.

## Publishing Status

- npm publishing is not done yet.
- VS Code Marketplace publishing is not done yet.
- No `.vsix` package is generated or uploaded for this release.

## Known Limitations

- npm package name availability is not verified.
- No npm publish was run.
- No VS Code Marketplace publish was run.
- The preferred future npm package name is `mcp-doctor`, pending availability check.
- Static analysis cannot guarantee that an MCP server is safe.
- Redaction is best effort and cannot cover every possible secret format.

## Feedback Wanted

Feedback is useful on npm/npx packaging expectations, supported client paths, risk-rule accuracy, example configs, JSON output shape, and VS Code extension workflow expectations.

Please do not include real tokens, API keys, passwords, private keys, credentials, or other secrets in issues or discussions.
