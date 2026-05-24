# Chest

Chest is a self-governance storage system for AI agents.

It stores project governance criteria in local, versioned files so agents can
plan, execute, and validate work against explicit goals without requiring a
human checkpoint for every decision.

## Overview

Chest helps AI agents keep project work aligned with:

1. OKRs
2. KPIs
3. Definition of Ready
4. Definition of Done

The project is based on the intervention-penalty problem described in:
[The Intervention Penalty: A Simulation Study of Human Checkpoint Costs in AI Coding Governance](https://zenodo.org/records/19457265).

## Problem

Human-in-the-loop AI workflows often depend on repeated approval checkpoints.
Those checkpoints improve oversight, but they also slow the agent down. As
checkpoint frequency increases, coordination overhead can become larger than
the work being governed.

Chest is designed for workflows where agents need governance, but repeated
human intervention should be reserved for cases that cannot be evaluated by
machine-verifiable criteria.

## Solution

Chest replaces repeated human checkpoints with structured agent
self-regulation.

Instead of asking for approval at every step, an agent can read project goals,
run validation checks, and report whether a plan or completed task satisfies
the stored governance criteria.

Chest v1 is specified as a local YAML-backed governance store exposed through
[`@bosun-sh/ohtools`](https://www.npmjs.com/package/@bosun-sh/ohtools). The
same tool registry should be available to agents through MCP and to humans or
automation through CLI commands.

## Core Concepts

### OKRs

Objectives and Key Results define what success means for the project. Agents
use OKRs to decide whether work is aligned with intended outcomes.

### KPIs

Key Performance Indicators define measurable signals of progress or quality.
In v1, KPIs are evaluated through command-based checks that produce structured
evidence.

### Definition of Ready

Definition of Ready defines the minimum criteria a plan must satisfy before an
agent starts implementation.

### Definition of Done

Definition of Done defines the minimum criteria completed work must satisfy
before an agent reports it as finished.

## How It Works

Chest is intended to work as a repository-local governance layer:

1. A project initializes Chest storage in local YAML files.
2. Humans or agents define OKRs, KPIs, Definition of Ready, and Definition of Done.
3. Agents read the stored governance criteria before planning or implementing.
4. Agents run KPI command checks to collect measurable evidence.
5. Agents use provider-agnostic LLM-as-judge validation to evaluate plans or work against the stored criteria.
6. Agents return structured validation reports that explain pass/fail status, evidence, rationale, and confidence.

## Architecture

Chest should follow a clear separation of concerns and remain easy for new
agents to understand.

Architectural principles:

1. Screaming architecture: files and directories should be named in business terms.
2. Vertical slicing: each feature area should keep related domain, application, and adapter code close together.
3. Interface-first design: domain entities and ports should be explicit and easy to find.
4. Test-driven implementation: behavior should be covered by automated tests before it is considered complete.

Implementation details and feature boundaries are defined in
[`docs/concept.spec`](docs/concept.spec).

## Tooling

Chest is a Bun/TypeScript project.

Primary tooling:

1. `@bosun-sh/ohtools` for shared MCP and CLI tool definitions.
2. `@modelcontextprotocol/sdk` for MCP integration through ohtools adapters.
3. `effect` for typed effects, dependency boundaries, and runtime composition where needed.

Available scripts:

```sh
bun run ohtools:list
bun run ohtools:docs
bun run ohtools:graph
```

## Project Status

This repository is currently at the initial specification stage.

The current ohtools app contains placeholder behavior. The README and
`docs/concept.spec` define the intended product and architecture so atomic
feature specs can be written next.

## Development

Install dependencies with Bun:

```sh
bun install
```

Inspect the ohtools registry:

```sh
bun run ohtools:list
```

Generate ohtools documentation:

```sh
bun run ohtools:docs
```

Generate the ohtools graph:

```sh
bun run ohtools:graph
```

## Reference

- Concept and architecture spec: [`docs/concept.spec`](docs/concept.spec)
- ohtools package: [`@bosun-sh/ohtools`](https://www.npmjs.com/package/@bosun-sh/ohtools)
- Research background: [Zenodo record 19457265](https://zenodo.org/records/19457265)
