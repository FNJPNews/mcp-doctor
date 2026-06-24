# Release Checklist

Use this checklist before each public release.

## Pre-Release Checks

- Confirm the version in package metadata.
- Confirm README status matches the release state.
- Confirm npm and VS Code Marketplace availability are not claimed unless publishing has actually happened.
- Confirm generated build output is ignored unless intentionally packaged.
- Confirm release notes and changelog are updated.

## Build and Test Commands

Run from the repository root:

```sh
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Do not continue if any command fails.

## Secret Search Checks

Search docs, source, tests, fixtures, examples, and generated files that may be packaged.

Look for:

- `token`
- `secret`
- `password`
- `api key`
- `bearer`
- `ghp_`
- `sk-`
- `private key`
- `credential`

Matches in redaction logic and security documentation are expected. Real-looking credentials must be removed or replaced with placeholders before release.

## GitHub Release Steps

- Confirm the main branch is clean.
- Push the release commit.
- Create a GitHub prerelease for alpha releases.
- Use `RELEASE_NOTES.md` or a release-specific notes file.
- Do not attach `.vsix` files unless packaging was intentionally completed and verified.

## Future npm Publish Steps

These are future steps only. Do not run them until npm publishing is approved.

- Check package name availability for `mcp-doctor`.
- Choose fallback name if needed.
- Run `npm pack --dry-run` from the package directory.
- Run `corepack pnpm pack --pack-destination <temp-directory>` for local tarball install tests.
- Inspect the tarball contents.
- Verify whether the CLI tarball requires a separately published core package.
- Confirm npm provenance and token strategy.
- Publish only after explicit approval.

## Future VS Code Marketplace Steps

These are future steps only. Do not run them until Marketplace publishing is approved.

- Add and verify a `.vsix` packaging workflow.
- Test the packaged extension in a clean VS Code profile.
- Prepare Marketplace metadata.
- Confirm publisher access.
- Publish only after explicit approval.

## Package Name Availability Check

Preferred package name:

- `mcp-doctor`

Current registry finding:

- `mcp-doctor` is already taken on npm.

Fallback options:

- `@fnjp/mcp-doctor`
- `@mcp-doctor/cli`

Document the chosen package name before updating user-facing install instructions.

## npm Pack Verification

Run from the package directory:

```sh
npm pack --dry-run
```

Check that required build output is present and unnecessary files are excluded.

For local install testing:

```sh
corepack pnpm pack --pack-destination <temp-directory>
```
