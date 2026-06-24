# npm Publishing Plan

MCP Doctor uses pnpm for development in this monorepo.

After npm publishing is intentionally enabled, npm and npx should become the user-facing install path for the CLI. The package is not published to npm yet.

## Recommended Package Name

Preferred package name:

- `mcp-doctor`

This name should be checked on npm before publishing. If it is unavailable, consider:

- `@fnjp/mcp-doctor`
- `@mcp-doctor/cli`

Until availability is confirmed, treat `mcp-doctor` as the preferred package name pending npm availability check.

## Future User Commands

After npm publishing, intended user commands are:

```sh
npx mcp-doctor scan
npm install -g mcp-doctor
mcp-doctor scan
```

Do not document these as current installation commands until the package is actually published.

## Current Development Commands

Use Corepack and pnpm from the repository root:

```sh
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Package Structure Notes

- The root package is a private monorepo package and should not be published.
- `@mcp-doctor/core` contains shared scanning, parsing, redaction, audit, and test logic.
- `@mcp-doctor/cli` currently exposes a `mcp-doctor` binary.
- A future npm release may publish the CLI package under the unscoped `mcp-doctor` name if available, or use a scoped fallback.

## Required Checks Before npm Publish

Run:

```sh
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Then inspect the package tarball before publishing.

From a package directory:

```sh
corepack pnpm pack --dry-run
corepack pnpm pack
```

If using npm directly for a final verification:

```sh
npm pack --dry-run
npm pack
```

Review the tarball contents before publishing. Build output should be present. Source-only development files, local caches, `node_modules`, and unrelated workspace files should not be included.

## Security Checks Before Publishing

- Search for token-like strings, private keys, passwords, and credentials.
- Confirm fixtures and docs use placeholders only.
- Confirm generated build output does not contain secrets.
- Confirm no npm token is committed.
- Confirm no local config file is accidentally packaged.
- Confirm CLI output redacts secret-like values in text and JSON modes.

## CI and Provenance

Do not publish from CI until the provenance and token strategy is decided.

Recommended future work:

- Decide whether releases are manual or CI-driven.
- Use npm provenance if publishing from GitHub Actions.
- Use short-lived automation credentials where possible.
- Keep npm tokens out of the repository and out of checked-in config files.
