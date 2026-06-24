# Security Model

MCP Doctor is local-first. It does not collect telemetry, upload configuration data, or make hidden network requests.

## Data Flow

Configuration files are read from disk, parsed in process, normalized, redacted, and printed or shown locally. The tool does not store scan results.

## Redaction

MCP Doctor redacts:

- API keys
- Tokens
- Passwords
- Bearer tokens
- Private keys
- Credential-like strings
- Environment variables with names containing `TOKEN`, `KEY`, `SECRET`, `PASSWORD`, `AUTH`, `PRIVATE`, or `CREDENTIAL`

Redaction is applied to text and JSON output.

## Risk Scoring

Risk levels are `info`, `low`, `medium`, `high`, and `critical`.

Findings are warnings. Static analysis cannot guarantee MCP server safety.

## MCP Server Risks

MCP servers can execute local binaries, read files, and access networks depending on their implementation and configuration. Users are responsible for reviewing third-party MCP servers before running them.

## Limitations

- Static analysis cannot prove server behavior.
- Command existence checks only confirm that a command can be found.
- Spawn tests execute configured commands locally with a timeout.
- Secret redaction is best effort.
- Findings are not a guarantee that an MCP server is safe.

## Disclosure

Report vulnerabilities privately as described in `SECURITY.md`. Do not include real credentials, tokens, or private keys in reports.
