# MCP Doctor

MCP Doctor is a local-first CLI and VS Code extension for scanning, testing, and auditing MCP server configurations.

MCP Doctor helps developers inspect local Model Context Protocol server configuration files before running or sharing them.

This repository is an early preview project at `v0.1.0-alpha`. Interfaces, rules, and package layout may change before a stable release.

## Current Status

- Current published GitHub release: `v0.1.0-alpha`.
- The repository is being prepared for a future `v0.2.0-alpha` preview.
- pnpm is used for development in this monorepo.
- The npm package is not published yet.
- The VS Code extension is not packaged as a `.vsix` and is not published to the VS Code Marketplace.
- The unscoped npm package name `mcp-doctor` is already taken on npm. A scoped fallback such as `@fnjp/mcp-doctor` or `@mcp-doctor/cli` should be used unless ownership or transfer changes.

## Why This Exists

MCP configurations can contain executable commands, environment variables, filesystem paths, and remote transports. These settings are powerful and deserve clear local inspection. MCP Doctor provides stable output for humans and automation without uploading configuration data.

## Features

- Discovers common MCP configuration paths for Claude Desktop, VS Code, Cursor, Codex, and Gemini CLI.
- Parses and normalizes MCP server definitions into a common model.
- Redacts tokens, passwords, private keys, bearer tokens, credentials, and key-like values.
- Audits configuration risks such as shell execution, broad filesystem access, unpinned `npx`, plain HTTP transports, duplicate server names, and missing commands.
- Checks whether configured command binaries exist on PATH.
- Can optionally start stdio server commands with a bounded timeout.
- Generates template MCP configurations without writing files by default.
- Provides a VS Code sidebar view backed by the same core package as the CLI.

## Try It Locally

The package is not published to npm. Use the local workspace commands before publishing. The Corepack form is recommended on Windows because `pnpm` may not be on PATH:

```sh
corepack pnpm install
corepack pnpm build
corepack pnpm cli paths
corepack pnpm cli scan
corepack pnpm cli audit
corepack pnpm cli test --no-spawn
corepack pnpm cli doctor --no-spawn
```

Try a sample config:

```sh
corepack pnpm cli scan --config examples/vscode/mcp.json
corepack pnpm cli audit --config examples/vscode/mcp.json
corepack pnpm cli test --no-spawn --config examples/vscode/mcp.json
corepack pnpm cli doctor --no-spawn --config examples/vscode/mcp.json
```

If `pnpm` is already available in your shell, the same commands can be run as `pnpm install`, `pnpm build`, and `pnpm cli scan`.

## After npm Publishing

These commands are the preferred end-user experience after npm publishing, but the unscoped `mcp-doctor` package name is currently taken on npm. They do not work from this project until an appropriate package name is published.

```sh
npx mcp-doctor scan
npm install -g mcp-doctor
mcp-doctor scan
```

If a scoped fallback is used, the npx command will use the scoped package name while the installed binary can still be `mcp-doctor`. See `docs/npm-publishing.md` for the publishing plan and package-name fallback options.

Use `--json` on scan, audit, test, doctor, and paths when machine-readable output is required.

## CLI Usage

The binary syntax below describes the CLI surface. In this early preview repository, run commands through the local workspace with `corepack pnpm cli ...` unless you have linked the package yourself.

```sh
mcp-doctor scan [--json] [--config <path>] [--client <name>]
mcp-doctor audit [--json] [--config <path>] [--client <name>] [--fail-on <level>]
mcp-doctor test [--json] [--config <path>] [--client <name>] [--timeout <ms>] [--no-spawn]
mcp-doctor doctor [--json] [--config <path>] [--client <name>] [--fail-on <level>] [--timeout <ms>] [--no-spawn]
mcp-doctor generate [--target <client>] [--server <template>] [--out <path>] [--print] [--write] [--force]
mcp-doctor paths [--json]
mcp-doctor version
```

Risk levels are `info`, `low`, `medium`, `high`, and `critical`.

The audit command exits with:

- `0` when no issue is found at or above the selected fail threshold.
- `1` when one or more issues are found at or above the selected fail threshold.
- `2` for parse or runtime errors outside normal audit findings.

## CLI Output Examples

`paths`:

```text
MCP Doctor Paths
- claude-desktop: C:\Users\you\AppData\Roaming\Claude\claude_desktop_config.json [missing]
- vscode: C:\work\project\.vscode\mcp.json [found]
```

`scan`:

```text
MCP Doctor Scan
Config files:
- unknown: C:\work\mcp-doctor\examples\vscode\mcp.json [found]
Servers:
- example-filesystem [unknown] transport=stdio command=node
```

`audit`:

```text
MCP Doctor Audit
Fail threshold: critical
Result: passed
Issues: none
```

`test --no-spawn`:

```text
MCP Doctor Test
- skipped example-filesystem: Spawn test was disabled.
```

`doctor --no-spawn`:

```text
MCP Doctor Scan
Config files:
- unknown: C:\work\mcp-doctor\examples\vscode\mcp.json [found]
Servers:
- example-filesystem [unknown] transport=stdio command=node

MCP Doctor Audit
Fail threshold: critical
Result: passed
Issues: none

MCP Doctor Test
- skipped example-filesystem: Spawn test was disabled.
```

## VS Code Extension

The extension package is located at `packages/vscode-extension`. It builds locally and contributes a sidebar view named `MCP Doctor` with commands for refresh, scan, audit, test, and opening configuration files.

The extension uses `@mcp-doctor/core` and does not duplicate scanning or auditing logic.

The extension is not currently packaged as a `.vsix` and is not published to the VS Code Marketplace.

See `docs/vscode-extension.md` for commands and a text preview of the sidebar.

## Supported Clients

- Claude Desktop
- VS Code
- Cursor
- Codex
- Gemini CLI
- Unknown client for explicit config paths

Codex and Gemini support are best effort because local configuration paths may vary by release and user setup.

## Security Model

MCP Doctor is local-first. It does not collect telemetry, upload configuration data, or make hidden network requests. It does not store secrets. Output is passed through redaction before display.

Static analysis cannot guarantee that an MCP server is safe. Audit results should be treated as warnings that help review a configuration before running it.

Warnings are signals to review. They are not proof that a server is compromised, and a clean result is not a guarantee that a server is safe.

## What This Tool Does Not Do

- It does not certify that an MCP server is safe.
- It does not install unknown packages.
- It does not rewrite user configuration files unless `generate --write` is explicitly used.
- It does not overwrite files unless `--force` is explicitly passed.
- It does not publish packages or create GitHub repositories.

## Examples

Example configs are available in `examples/`.

Scan a single configuration:

```sh
corepack pnpm cli scan --config .mcp.json --client codex
```

Audit and fail on medium or higher:

```sh
corepack pnpm cli audit --fail-on medium
```

Generate a Codex filesystem template without writing a file:

```sh
corepack pnpm cli generate --target codex --server filesystem
```

Write a VS Code SQLite template:

```sh
corepack pnpm cli generate --target vscode --server sqlite --out .vscode/mcp.json --write
```

Run against the included VS Code example:

```sh
corepack pnpm cli doctor --no-spawn --config examples/vscode/mcp.json
```

## JSON Output

JSON output is intended to be stable and machine-readable. Secret-like values are redacted in JSON output as well as text output.

```sh
corepack pnpm cli doctor --json --no-spawn
```

## Development

```sh
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Run the local CLI after building:

```sh
corepack pnpm cli scan
```

## Feedback Wanted

Feedback is useful on:

- Client config paths that MCP Doctor misses.
- False positives or false negatives in audit rules.
- JSON output fields needed for automation.
- Redaction edge cases.
- Local CLI workflows that are unclear.

Please do not include real tokens, API keys, passwords, private keys, credentials, or other secrets in issues.

## Contributing

See `CONTRIBUTING.md` for development workflow and review expectations.

## License

MIT. See `LICENSE`.

## Disclaimer

This project is independent and not affiliated with Anthropic, OpenAI, Microsoft, Cursor, Google, or the Model Context Protocol maintainers.

MCP server safety cannot be fully guaranteed by static analysis. Users are responsible for reviewing third-party MCP servers before running them.
