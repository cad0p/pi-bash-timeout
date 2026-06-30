# pi-bash-timeout

⏱️ Wraps [pi](https://github.com/badlogic/pi-mono)'s built-in `bash` tool with a **120-second default timeout**.

The native `bash` tool has no default timeout — a hanging command blocks the agent forever. This extension injects `timeout: 120` whenever the model omits the `timeout` parameter, while preserving the stock bash renderer (`$ command` + `Took X.Xs`) and delegating execution to pi's own bash implementation.

## Install

Stable npm release:

```bash
pi install npm:@cad0p/pi-bash-timeout
```

Pre-release npm snapshots from `main` are published with the `next` dist-tag:

```bash
pi install npm:@cad0p/pi-bash-timeout@next
```

You can also install directly from the git source when testing unreleased branches:

```bash
pi install git:github.com/cad0p/pi-bash-timeout
```

## What it does

| Scenario | Behavior |
|---|---|
| Model omits `timeout` | Uses **120s** default |
| Model passes explicit `timeout` | Uses that timeout (explicit always wins) |
| Command exceeds timeout | Killed, shows `Command timed out after N seconds` |

The extension re-registers the `bash` tool by name (extension tools win over built-ins of the same name in pi's tool registry). It spreads the built-in `ToolDefinition` from `createBashToolDefinition()` and overrides **only** `execute` — so `description`, `promptSnippet`, `parameters`, `renderCall`, and `renderResult` all stay the stock built-in values. The TUI looks identical to the native bash tool.

A short `(default timeout: 120s when omitted)` note is appended to the description so the LLM knows the fallback when it omits the parameter.

## How it works

```typescript
const builtinBash = createBashToolDefinition(process.cwd());

pi.registerTool({
  ...builtinBash,
  name: "bash",
  description: `${builtinBash.description} (default timeout: ${DEFAULT_TIMEOUT_SECONDS}s when omitted)`,
  async execute(toolCallId, params, signal, onUpdate, ctx) {
    const effectiveParams = {
      ...params,
      timeout: params.timeout ?? DEFAULT_TIMEOUT_SECONDS,
    };
    const bashTool = createBashToolDefinition(ctx.cwd);
    return bashTool.execute(toolCallId, effectiveParams, signal, onUpdate, ctx);
  },
});
```

Key points:

- `createBashToolDefinition()` returns the full `ToolDefinition` pi uses internally, including the renderers that produce the stock bash UI.
- Spreading it and overriding only `execute` keeps every other field the built-in default.
- `ctx.cwd` scopes execution to the correct project directory regardless of where pi was launched.
- `ToolDefinition.execute` takes 5 params (including `ctx`), unlike `AgentTool.execute` which takes 4 — we pass `ctx` through.

## Requirements

- **pi 0.74+** with at least one model provider configured.
- Peer dependencies (the source of truth is `package.json` `peerDependencies`):
  - `@earendil-works/pi-coding-agent >=0.74.0`
  - `typebox ^1.0.0` (used to declare the tool's parameter schema; bundled with pi but listed explicitly so a standalone install resolves correctly).

## Configuration

The default timeout is hardcoded to 120 seconds. To change it, edit `DEFAULT_TIMEOUT_SECONDS` in `extensions/pi-bash-timeout/index.ts` and rebuild/reinstall.

## Publishing

This repo uses [`cad0p/semver-calver-release`](https://github.com/cad0p/semver-calver-release)'s npm-package workflow:

- Pushes to `main` compute the next hybrid SemVer + CalVer version, tag a GitHub prerelease, and publish to npm with the `next` dist-tag.
- Curated release PRs from `release/from-v*` branches bump the base `package.json` version and publish stable npm releases.
- npm publishing uses GitHub OIDC / npm trusted publishing via `.github/workflows/release.yml` (`id-token: write`) and `publishConfig.access: public`.

## License

MIT © Pier Carlo Cadoppi
