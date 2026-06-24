# Getting Started

MCP Doctor is developed as a pnpm monorepo. This repository is an early preview project and is being prepared for a future `v0.3.0-alpha` npm alpha.

The package is not published to npm. Use the local workspace commands. The Corepack form is recommended on Windows because `pnpm` may not be on PATH.

```sh
corepack pnpm install
corepack pnpm build
corepack pnpm cli paths
corepack pnpm cli scan
```

Use `--config <path>` to scan a specific file:

```sh
corepack pnpm cli scan --config .mcp.json --client codex
```

Use `--json` for automation:

```sh
corepack pnpm cli audit --json --fail-on high
```

The VS Code extension builds locally from `packages/vscode-extension`, but it is not currently packaged as a `.vsix` and is not published to the VS Code Marketplace.
