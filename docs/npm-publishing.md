# npm Publishing Plan

MCP Doctor uses pnpm for development in this monorepo.

npm publishing is not enabled yet. After publishing is intentionally enabled, npm and npx should become the user-facing install path for the CLI.

## Planned Package Name

The planned public CLI package name is:

- `@fnjp/mcp-doctor`

The CLI binary name remains:

- `mcp-doctor`

The unscoped package name `mcp-doctor` is already taken on npm. Do not publish under `mcp-doctor` unless ownership, transfer, or another explicit arrangement makes it available.

Fallback package name if `@fnjp/mcp-doctor` is unavailable at publish time:

- `@mcp-doctor/cli`

Package availability must be checked again immediately before publishing.

## Package Availability Checks

Run these checks before any npm publish attempt:

```sh
npm view @fnjp/mcp-doctor name version
npm view @mcp-doctor/cli name version
```

Expected interpretation:

- npm metadata means the package name is already taken.
- npm 404 means the package appears available, but availability must still be verified at publish time.

Registry check result from 2026-06-25:

- `mcp-doctor` returned existing package metadata and is already taken.
- `@fnjp/mcp-doctor` returned npm 404 at the time of checking.
- `@mcp-doctor/cli` returned npm 404 at the time of checking.

## Future User Commands

After npm publishing, intended user commands are:

```sh
npx @fnjp/mcp-doctor scan
npm install -g @fnjp/mcp-doctor
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
- `packages/core` contains shared scanning, parsing, redaction, audit, and test logic for development and future SDK use.
- The planned public CLI package is `@fnjp/mcp-doctor`.
- The CLI package exposes a `mcp-doctor` binary.
- The CLI build uses esbuild to bundle runtime code into `dist/cli.js` and `dist/index.js`.
- The esbuild bundle resolves `@mcp-doctor/core` from built output in `packages/core/dist`, not directly from TypeScript source.
- The CLI package should not have runtime npm dependencies after bundling.
- The CLI package should not require a separate MCP Doctor registry package at runtime.
- The CLI package does not require users to install a separate MCP Doctor core package for the first npm alpha release.
- Tests, fixtures, local examples, coverage, internal prompts, and source files are not included in the CLI package tarball.
- Package versions should stay aligned for alpha releases until a different compatibility policy is documented.

## Pack Verification

Run a full build first:

```sh
corepack pnpm build
```

Then inspect the package tarball before publishing.

`pnpm pack` in pnpm 9 does not provide `--dry-run`. Use `npm pack --dry-run` from the CLI package directory for a dry run:

```sh
cd packages/cli
npm pack --dry-run
```

The CLI package tarball should include only intentional files, such as:

- `dist`
- `package.json`
- `README.md`

It should not include tests, fixtures, coverage, local caches, internal prompts, `.vsix` files, or secrets.

## Local Tarball Install Test

Before npm publishing, create a local tarball and install only the CLI tarball into a temporary project outside the repository:

```sh
corepack pnpm build
cd packages/cli
corepack pnpm pack --pack-destination <temp-directory>
cd <new-test-directory>
npm init -y
npm install <temp-directory>/fnjp-mcp-doctor-0.3.0-alpha.tgz
npx --no-install mcp-doctor version
npx --no-install mcp-doctor scan --help
npx --no-install mcp-doctor paths
```

The CLI tarball must work without separately installing a core tarball.

Standalone tarball installation has been verified locally for the planned `@fnjp/mcp-doctor` package. npm publishing has not happened yet.

## Future Alpha Publish Command

Do not run this until release ownership, authentication, 2FA, and provenance decisions are complete.

Future alpha publish command from `packages/cli`:

```sh
npm publish --access public --tag alpha
```

Scoped public packages require `--access public`.

Do not use the `latest` dist-tag for alpha releases. Use `--tag alpha` until the project has a stable release policy.

## Required Checks Before npm Publish

Run:

```sh
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Then run:

```sh
npm view @fnjp/mcp-doctor name version
cd packages/cli
npm pack --dry-run
```

Install the generated tarball in a clean temporary project and verify the `mcp-doctor` binary before publishing.

## Security Checks Before Publishing

- Search for token-like strings, private keys, passwords, and credentials.
- Confirm fixtures and docs use placeholders only.
- Confirm generated build output does not contain secrets.
- Confirm no npm token is committed.
- Confirm no local config file is accidentally packaged.
- Confirm CLI output redacts secret-like values in text and JSON modes.

## CI, Tokens, and Provenance

Publishing is intentionally not automated yet.

Do not publish from CI until the provenance and token strategy is decided.

Recommended future work:

- Decide whether releases are manual or CI-driven.
- Use npm provenance if publishing from GitHub Actions.
- Use short-lived automation credentials where possible.
- Keep npm tokens out of the repository and out of checked-in config files.
- Require a final manual review before changing npm dist-tags.
