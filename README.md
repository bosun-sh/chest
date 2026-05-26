# Chest

Chest is an open-source self-governance store for AI agent workflows.

It keeps project governance criteria in local, versioned files so agents can
plan, execute, and validate work against explicit goals without turning every
decision into a human checkpoint.

## Install

```sh
bun add @bosun-sh/chest
```

The package is published as a normal npm artifact and exposes:

- `@bosun-sh/chest` for the core registry and tool IDs
- `@bosun-sh/chest/ohtools` for the default prewired Ohtools app
- `@bosun-sh/chest/cli` for the CLI-attached app
- `@bosun-sh/chest/mcp` for the stdio MCP app

## Use

If you want to embed Chest in your own launcher, import the registry or one of
the ready-made app entrypoints:

```ts
import { createChestApp, chestCliApp, chestMcpApp, chestToolIds } from "@bosun-sh/chest";
import chestApp from "@bosun-sh/chest/ohtools";

console.log(chestToolIds.length);
console.log(chestApp.build().adapters.has("mcp"));
console.log(chestCliApp.build().adapters.has("cli"));
console.log(chestMcpApp.build().adapters.has("mcp"));

const registry = createChestApp().build();
console.log([...registry.tools.keys()]);
```

To launch Chest through `ohtools`, create a tiny local wrapper and point the CLI
at it:

```ts
// chest-app.ts
import chestApp from "@bosun-sh/chest/ohtools";

export default chestApp;
```

```sh
bunx ohtools --app ./chest-app.ts list
```

## What It Solves

AI-assisted workflows often need governance, but repeated checkpoints can turn
into a throughput bottleneck. Chest is designed for projects where the agent
can evaluate most decisions against machine-verifiable criteria instead of
stopping for approval every time.

Chest organizes that governance around:

1. OKRs
2. KPIs
3. Definition of Ready
4. Definition of Done

The project is based on the intervention-penalty problem described in:
[The Intervention Penalty: A Simulation Study of Human Checkpoint Costs in AI Coding Governance](https://zenodo.org/records/19457265).

## Storage

Chest stores its local state under `.chest/` by default:

- `.chest/okrs.yaml`
- `.chest/kpis.yaml`
- `.chest/definition-of-ready.yaml`
- `.chest/definition-of-done.yaml`
- `.chest/reports/*.yaml`

Set `CHEST_HOME` to redirect the store to another location.

## Current State

Chest is implemented as a real `@bosun-sh/ohtools` registry with 20 Chest tool
IDs exposed through the CLI and MCP surfaces. The checked-in implementation
includes:

1. `src/ohtools.ts` as the registry composition root used by `bunx ohtools`.
2. `src/workspace/cli-adapter.ts` for CLI attachment.
3. `src/workspace/mcp-server.ts` as the stdio MCP bridge used by the e2e parity
   test.
4. YAML-backed OKR, KPI, DoR, DoD, validation, judge, and report workflows.
5. Validation and report tools that persist report files under `.chest/reports/`.

## Development

The repo uses the same commands locally and in CI:

```sh
bun run lint
bun run test:unit
bun run test:e2e
bun run build
bun run pack:check
bun run smoke:packed
```

Git hooks are managed with Husky:

- `pre-commit` runs `lint` and `test:unit`
- `pre-push` runs `test:e2e` and `build`

CLI error envelopes are JSON and exit nonzero; capture the error stream when
parsing failures such as `OHTOOLS_VALIDATION_ERROR`.

## Repository Layout

- `src/` contains the Chest registry, adapters, domain slices, ports, and workspace helpers.
- `tests/` contains unit, integration, and e2e coverage.
- `docs/` contains the contract specs for the implemented v1 feature slices.
- `.github/workflows/ci.yml` defines the GitHub Actions pipeline.

## Contributing

Issues and pull requests are welcome.

If you plan to change behavior, keep the docs, tests, and public tool surface
aligned with the implementation. The repo is intended to stay easy for agents
and humans to navigate.

## License

Apache-2.0. See [`LICENSE`](LICENSE) and [`package.json`](package.json) for the current license declaration.
