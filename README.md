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

This repository is in the initial scaffold phase for the open-source project.
The current branch establishes the platform for future feature work:

1. A real `@bosun-sh/ohtools` composition root.
2. A docs-driven architecture and test layout.
3. GitHub Actions CI.
4. Husky pre-commit and pre-push hooks.

The implementation is intentionally platform-first so future feature slices can
be added without reshaping the foundation.

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

## Repository Layout

- `src/` contains the implementation scaffold.
- `tests/` contains unit, integration, and e2e coverage.
- `docs/` contains the contract specs for the project and future feature slices.
- `.github/workflows/ci.yml` defines the GitHub Actions pipeline.

## Contributing

Issues and pull requests are welcome.

If you plan to change behavior, keep the docs, tests, and public tool surface
aligned with the implementation. The repo is intended to stay easy for agents
and humans to navigate.

## License

ISC. See [`package.json`](package.json) for the current license declaration.
