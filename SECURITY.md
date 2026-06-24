# Security Policy

## Local-First Design

MCP Doctor runs locally. It does not collect telemetry, upload configuration data, or make hidden network requests.

## Secret Handling

MCP Doctor redacts API keys, tokens, passwords, bearer tokens, private keys, credentials, and token-like strings before output. The tool does not intentionally store secrets.

Redaction is a defensive control, not a guarantee that every possible secret format is recognized.

## MCP Server Risk

MCP servers can run local commands, access files, and communicate with external systems depending on how they are configured. MCP Doctor flags risky patterns, but static analysis cannot guarantee MCP server safety.

Treat findings as warnings that support human review.

## Responsible Disclosure

Please report security issues privately. Do not open a public issue for a vulnerability until maintainers have had time to respond.

Include:

- A description of the issue.
- A minimal reproduction.
- Affected version or commit.
- Any known mitigation.

Do not include real credentials, tokens, private keys, or user secrets in reports. Replace them with placeholders.

## Limitations

- Static analysis cannot prove that a command or package is safe.
- Redaction cannot cover every possible secret format.
- Command existence checks do not validate command behavior.
- Optional spawn tests run configured commands locally and should only be used on configurations you intend to test.
- A clean MCP Doctor audit does not guarantee that an MCP server is safe to run.
