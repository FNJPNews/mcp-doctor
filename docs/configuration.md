# Configuration

MCP Doctor reads existing MCP configuration files. It does not rewrite those files.

## Explicit Config

```sh
corepack pnpm cli scan --config .mcp.json --client codex
```

When `--client` is omitted for an explicit file, the client is reported as `unknown`.

## Discovered Configs

MCP Doctor checks known project-level and user-level paths for supported clients. Run:

```sh
corepack pnpm cli paths
```

Codex and Gemini support are best effort because configuration locations may vary.

## Generate Templates

Generation is print-only by default:

```sh
corepack pnpm cli generate --target codex --server filesystem
```

Writing requires `--write` and an output path:

```sh
corepack pnpm cli generate --target codex --server filesystem --out .mcp.json --write
```

Existing files are not overwritten unless `--force` is present.
