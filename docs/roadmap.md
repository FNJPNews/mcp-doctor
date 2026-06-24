# Roadmap

This roadmap is provisional and may change as early users test real configurations.

## v0.2.0-alpha Goals

- Improve local try-it flow with safe example configs.
- Document future npm and npx publishing plans.
- Clarify package structure for future CLI publishing.
- Improve README examples for scan, audit, test, and doctor workflows.
- Collect feedback on risk rules and JSON output shape.

## v0.3.0 Goals

- Add more client-specific config discovery tests.
- Improve diagnostics for malformed but parseable config shapes.
- Add more command and transport test cases.
- Improve VS Code extension usability and error states.
- Evaluate package naming and npm availability.

## v1.0.0 Stability Goals

- Stable CLI command and option surface.
- Stable machine-readable JSON output schema.
- Clear support policy for client config formats.
- Documented compatibility matrix for supported Node versions and clients.
- Repeatable release process with package tarball verification.

## npm Publishing Plan

The preferred user-facing CLI package name was `mcp-doctor`, but npm currently has an existing `mcp-doctor` package. Unless ownership or transfer changes, use a scoped fallback such as `@fnjp/mcp-doctor` or `@mcp-doctor/cli`.

Before publishing:

- Verify package name availability again immediately before publishing.
- Inspect `npm pack --dry-run` output.
- Decide whether to publish `@mcp-doctor/core` separately or bundle it into the CLI package.
- Confirm redaction and secret search checks.
- Decide provenance and token strategy.
- Update README only when npm publishing is actually complete.

## VS Code Marketplace Plan

The extension currently builds locally but is not packaged or published.

Before Marketplace publishing:

- Add a repeatable `.vsix` packaging workflow.
- Verify the extension in a clean VS Code profile.
- Prepare Marketplace metadata and publisher configuration.
- Confirm no telemetry or network behavior is introduced.
- Update README only when Marketplace publishing is actually complete.

## Good First Issue Ideas

- Add fixtures for additional real-world config shapes using placeholders.
- Improve docs for client-specific config path differences.
- Add tests for more redaction edge cases.
- Improve CLI text table formatting while preserving stable JSON output.
- Add more VS Code sidebar states for empty, warning, and error results.

## Feedback Wanted

- Client config paths that MCP Doctor misses.
- False positives or false negatives in risk rules.
- JSON output fields needed for automation.
- Redaction cases that should be covered.
- CLI workflows that are unclear or too verbose.
