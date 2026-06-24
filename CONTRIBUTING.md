# Contributing

Thank you for considering a contribution to MCP Doctor.

## Development Setup

```sh
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Guidelines

- Keep changes small and reviewable.
- Preserve local-first behavior.
- Do not add telemetry.
- Do not add hidden network requests.
- Keep CLI output stable and professional.
- Add or update tests for behavior changes.
- Redact secrets in all user-visible output.

## Pull Requests

Before opening a pull request, run:

```sh
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Include a short description of the change, tests run, and any security considerations.
