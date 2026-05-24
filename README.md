# Chest

Chest is an open-source self-governance store for AI agent workflows.

It keeps project governance criteria in local, versioned files so agents can
plan, execute, and validate work against explicit goals without defaulting to a
human checkpoint for every decision.

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

The local store is created under `.chest/` with these files:

- `.chest/okrs.yaml`
- `.chest/kpis.yaml`
- `.chest/definition-of-ready.yaml`
- `.chest/definition-of-done.yaml`
- `.chest/reports/*.yaml`

The registry exposes:

- `chest.init`
- `chest.okrs.list`, `chest.okrs.get`, `chest.okrs.upsert`, `chest.okrs.remove`
- `chest.kpis.list`, `chest.kpis.get`, `chest.kpis.upsert`, `chest.kpis.remove`
- `chest.kpis.run`, `chest.kpis.run-all`
- `chest.dor.list`, `chest.dor.upsert`
- `chest.dod.list`, `chest.dod.upsert`
- `chest.validate.ready`, `chest.validate.done`
- `chest.judge.align`
- `chest.reports.list`, `chest.reports.get`

## Architecture

Chest follows a screaming-architecture, vertical-slice layout:

1. Domain slices own governance concepts and validation semantics.
2. Workspace modules own storage paths, runtime composition, and repo-local initialization.
3. Plugin modules expose thin `ohtools` bridges for MCP and CLI use.
4. Shared helpers stay small and reusable.

Design details and feature boundaries are documented in:

- [`docs/concept.spec`](docs/concept.spec)
- [`docs/functional.spec`](docs/functional.spec)
- [`docs/technical.spec`](docs/technical.spec)
- [`docs/test.spec`](docs/test.spec)

## Getting Started

Install dependencies with Bun:

```sh
bun install
```

Inspect the tool registry:

```sh
bun run ohtools:list
```

Generate documentation:

```sh
bun run ohtools:docs
```

Generate the architecture graph:

```sh
bun run ohtools:graph
```

Initialize a local Chest store in the current repository:

```sh
bunx ohtools --app src/ohtools.ts run chest.init --input '{}'
```

Inspect governance:

```sh
bunx ohtools --app src/ohtools.ts run chest.okrs.list --input '{}'
bunx ohtools --app src/ohtools.ts run chest.kpis.list --input '{}'
bunx ohtools --app src/ohtools.ts run chest.dor.list --input '{}'
bunx ohtools --app src/ohtools.ts run chest.dod.list --input '{}'
```

Validate a plan or completed work:

```sh
bunx ohtools --app src/ohtools.ts run chest.validate.ready --input '{"plan":"Implement the feature with acceptance criteria, risks, and tests."}'
bunx ohtools --app src/ohtools.ts run chest.validate.done --input '{"work_evidence":"Implemented the feature and all checks pass."}'
```

Run KPI commands and fetch persisted validation reports:

```sh
bunx ohtools --app src/ohtools.ts run chest.kpis.run-all --input '{}'
bunx ohtools --app src/ohtools.ts run chest.reports.list --input '{}'
```

Run the stdio MCP parity bridge used by the e2e coverage from your own launcher
or client process. The server entrypoint lives in
[`src/workspace/mcp-server.ts`](src/workspace/mcp-server.ts) and exposes the
same 20 Chest tools over MCP `tools/list` and `tools/call`.

Judge workflows use the configured provider when available and return structured
`ValidationReport` envelopes. Validation failures are persisted as reports when
the workflow can complete, so later agents or CI jobs can inspect the decision
history through `chest.reports.list` and `chest.reports.get`.

## Development Workflow

The repo uses the same commands locally and in CI:

```sh
bun run lint
bun run test:unit
bun run test:e2e
bun run build
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
