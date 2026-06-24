# npm Publishing Plan

MCP Doctor uses pnpm for development in this monorepo.

After npm publishing is intentionally enabled, npm and npx should become the user-facing install path for the CLI. The package is not published to npm yet.

## Recommended Package Name

Preferred user-facing package name:

- `mcp-doctor`

Registry check result from 2026-06-25:

```sh
npm view mcp-doctor name version
```

Returned:

```text
name = 'mcp-doctor'
version = '0.1.1'
```

The unscoped package name is already taken. Do not publish under that name unless ownership, transfer, or another explicit arrangement makes it available.

Fallback package names checked on 2026-06-25:

```sh
npm view @mcp-doctor/cli name version
npm view @fnjp/mcp-doctor name version
npm view mcp-doctor-core name version
```

All three returned npm 404 responses at the time of checking. That means they appeared unused then, but availability must be verified again immediately before publishing.

Recommended fallback order:

- `@fnjp/mcp-doctor`
- `@mcp-doctor/cli`

`mcp-doctor-core` is available-looking but should not be the user-facing CLI name. It may be considered only if the core package needs an unscoped package later.

## Future User Commands

After npm publishing, intended user commands are:

```sh
npx mcp-doctor scan
npm install -g mcp-doctor
mcp-doctor scan
```

Do not document these as current installation commands until the package is actually published.

If a scoped fallback is used, the likely commands become:

```sh
npx @fnjp/mcp-doctor scan
npm install -g @fnjp/mcp-doctor
mcp-doctor scan
```

The global binary can still be named `mcp-doctor` even when the package is scoped.

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
- `@mcp-doctor/cli` includes only generated `dist` output in its future package files.
- `@mcp-doctor/core` includes generated `dist` and `dist-cjs` output in its future package files.
- Tests, fixtures, local examples, coverage, internal prompts, and source files are not included in the CLI package tarball.
- A future npm release should either publish core first, publish CLI and core together, or bundle core into the CLI package. The current CLI tarball depends on `@mcp-doctor/core`.
- Package versions are currently alpha versions. Keep core and CLI versions aligned until a different compatibility policy is documented.

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

`pnpm pack` in pnpm 9 does not provide `--dry-run`. Use `npm pack --dry-run` from the package directory for a dry run:

```sh
cd packages/cli
npm pack --dry-run
```

Use pnpm to create a local tarball for install testing:

```sh
corepack pnpm build
cd packages/cli
corepack pnpm pack --pack-destination <temp-directory>
```

Review the tarball contents before publishing. Build output should be present. Source-only development files, local caches, `node_modules`, and unrelated workspace files should not be included.

## Local Tarball Install Test

The CLI package currently depends on `@mcp-doctor/core`.

Observed result:

- Installing the CLI tarball by itself fails because `@mcp-doctor/core@0.1.0-alpha` is not published to npm.
- Installing local core and CLI tarballs together works for basic CLI execution.

Successful local test shape:

```sh
corepack pnpm build
cd packages/core
corepack pnpm pack --pack-destination <temp-directory>
cd ../cli
corepack pnpm pack --pack-destination <temp-directory>
cd <new-test-directory>
npm init -y
npm install <temp-directory>/mcp-doctor-core-0.1.0-alpha.tgz <temp-directory>/mcp-doctor-cli-0.1.0-alpha.tgz
npx mcp-doctor version
npx mcp-doctor scan --help
npx mcp-doctor paths
```

Before npm publishing, choose one of these paths:

- Publish `@mcp-doctor/core` before or together with the CLI package.
- Bundle core into the CLI package.
- Move the CLI publish package to a structure that does not rely on an unpublished registry dependency.

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
