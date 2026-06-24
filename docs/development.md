# Development

## Repository Layout

- `packages/core`: discovery, parsing, normalization, redaction, audit rules, command checks, and templates.
- `packages/cli`: command-line interface.
- `packages/vscode-extension`: VS Code extension using the core package.

The VS Code extension currently builds locally. It is not packaged as a `.vsix` and is not published to the VS Code Marketplace.

## Commands

Use Corepack when `pnpm` is not available directly in your shell.

```sh
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Design Notes

- Keep core logic pure where practical.
- Use `spawn` with argument arrays and `shell: false`.
- Do not add telemetry.
- Do not write user files unless a write flag is present.
- Keep JSON output stable.
