# Risk Rules

## Critical

- Invalid JSON.

## High

- Missing command for a stdio server.
- Command not found in PATH.
- Token-like or key-like string appears in config.
- Broad filesystem access such as `/`, `~`, `C:\`, or `%USERPROFILE%`.
- Shell execution through `sh -c`, `bash -c`, `cmd /c`, or `powershell -Command`.
- Inline code execution through `python -c` or `node -e`.

## Medium

- Missing environment variable value.
- Environment variable name suggests a secret and the value is inline.
- `npx` package without a pinned version.
- Remote URL transport over plain HTTP.
- Dangerous binaries such as `rm`, `curl`, `wget`, `powershell`, `cmd`, `bash`, `sh`, or `osascript`.

## Low

- Unknown transport.
- Duplicate server names.
- Very long arguments.

## Info

- Disabled server.

Findings are warnings and should be reviewed in context.
