# Changelog

## Unreleased

### Added

- Documentation for future npm and npx publishing preparation.
- Safe example MCP configurations for Claude Desktop, VS Code, Cursor, Codex, and Gemini.
- Local testing documentation for running MCP Doctor against example configs.
- Roadmap and release checklist documents for upcoming alpha releases.
- Text preview of the VS Code extension sidebar without implying a published Marketplace package.
- npm package name availability findings and tarball verification notes.

### Changed

- Package metadata now declares intentional future package files for generated build output.
- README clarifies current local usage, planned npm/npx usage, warning semantics, and feedback requests.
- README and npm publishing docs now recommend a scoped fallback because `mcp-doctor` is already taken on npm.

## v0.1.0-alpha

First public preview release of MCP Doctor.

### Added

- Local-first CLI for scanning, auditing, testing, and generating MCP configuration templates.
- Core package for configuration discovery, safe JSON parsing, normalization, validation, redaction, risk rules, command checks, and bounded process tests.
- VS Code extension package with a local sidebar view and commands backed by the core package.
- Tests covering discovery, parsing, validation, redaction, risk rules, CLI JSON output, CLI exit codes, generate no-write behavior, command checks, invalid JSON handling, broad filesystem paths, unpinned `npx`, shell command risks, duplicate server names, and JSON redaction.
- Documentation for getting started, configuration, supported clients, security model, risk rules, development, contribution, and responsible disclosure.

### Known Limitations

- This is an early preview and interfaces may change before a stable release.
- The package is not published to npm.
- The VS Code extension is not packaged as a `.vsix` and is not published to the VS Code Marketplace.
- Codex and Gemini configuration discovery are best effort because config paths may vary.
- Static analysis cannot guarantee MCP server safety.
- Secret redaction is best effort and may not recognize every possible secret format.
