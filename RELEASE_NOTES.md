# v0.3.0-alpha

This is the third public preview release of MCP Doctor.

MCP Doctor is a local-first CLI and VS Code extension package for scanning, testing, and auditing MCP server configurations.

## Standalone CLI Package Preparation

- Prepared the CLI package for standalone npm installation as the planned `@fnjp/mcp-doctor` package.
- Kept the CLI binary name as `mcp-doctor`.
- Standardized the standalone CLI build path on `scripts/build-cli.mjs`.
- Removed the previous `scripts/bundle-cli-core.mjs` build path.
- Bundled `@mcp-doctor/core` into the CLI package from built core output in `packages/core/dist`.
- Bundled `commander` and `zod` where needed by the CLI runtime.
- Updated the CLI package so it has no runtime npm dependencies.
- Kept `@mcp-doctor/core` in the monorepo for development and future SDK use.

## Version and Package Metadata

- Aligned package versions to `0.3.0-alpha`.
- Added public scoped package metadata for the future `@fnjp/mcp-doctor` npm package.
- Documented that npm publishing has not happened yet.
- Documented that VS Code Marketplace publishing has not happened yet.

## Verification

- Verified `npm pack --dry-run` for the CLI package.
- Verified local tarball installation using only the CLI tarball.
- Verified locally installed tarball commands through the `mcp-doctor` binary:
  - `npx --no-install mcp-doctor version`
  - `npx --no-install mcp-doctor scan --help`
  - `npx --no-install mcp-doctor paths`
  - `npx --no-install mcp-doctor scan --config <path>`
  - `npx --no-install mcp-doctor audit --config <path>`
  - `npx --no-install mcp-doctor test --no-spawn --config <path>`

## Publishing Status

- npm publishing was not run.
- VS Code Marketplace publishing was not run.
- No `.vsix` package was created or uploaded for this release.

## Known Limitations

- `@fnjp/mcp-doctor` availability must be rechecked immediately before npm publishing.
- npm 2FA and provenance strategy still need to be finalized.
- No npm publish was run.
- No VS Code Marketplace publish was run.
- Static analysis cannot guarantee that an MCP server is safe.
- Redaction is best effort and cannot cover every possible secret format.

## Feedback Wanted

Feedback is useful on standalone npm package expectations, supported client paths, risk-rule accuracy, example configs, JSON output shape, and VS Code extension workflow expectations.

Please do not include real tokens, API keys, passwords, private keys, credentials, or other secrets in issues or discussions.
