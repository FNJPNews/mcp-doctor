# MCP Doctor CLI

This package is the planned npm CLI package for MCP Doctor.

It is not published to npm yet. After publishing, the planned package name is `@fnjp/mcp-doctor` and the installed binary name is `mcp-doctor`.

Planned user commands after npm publishing:

```sh
npx @fnjp/mcp-doctor scan
npm install -g @fnjp/mcp-doctor
mcp-doctor scan
```

Until npm publishing is completed, use the repository development workflow from the project root:

```sh
corepack pnpm install
corepack pnpm build
corepack pnpm cli scan
```

The CLI package bundles MCP Doctor runtime code into its generated JavaScript for the first npm alpha release. The bundle resolves `@mcp-doctor/core` from the built output in `packages/core/dist`. The monorepo still keeps `packages/core` as the development source of the shared scanning, parsing, auditing, redaction, and testing logic.
