# Chest

[![CI](https://github.com/bosun-sh/chest/actions/workflows/ci.yml/badge.svg)](https://github.com/bosun-sh/chest/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@bosun-sh/chest)](https://www.npmjs.com/package/@bosun-sh/chest)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

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

## Caller-supplied judges

Use the public `judgeValidation` function for revision-bound readiness or
completion reports. You supply the judge, which can use your existing local or
subscription-backed runtime. Chest does not select a provider, authenticate,
make API calls, or authorize completion or merge.

This disposable fixture shows the contract without invoking a model:

```ts
import {
  judgeValidation,
  type JudgeProvider,
  type JudgeValidationRequest,
  type JudgeValidationResponse,
} from "@bosun-sh/chest";

const request: JudgeValidationRequest = {
  mode: "done", // or "ready"
  binding: {
    taskId: "task-123",
    taskRevision: "criteria-contract-revision",
    candidateRevision: "exact-source-revision",
    criteria: [{ id: "tests", text: "Required tests pass" }],
    evidenceRefs: [{
      kind: "test-log",
      refId: "artifact:checks",
      summary: "Required checks passed",
      digest: "sha256:fixture-only",
    }],
  },
};
const fixture: JudgeProvider<JudgeValidationRequest, JudgeValidationResponse> = {
  async judge(input) {
    return {
      ...input,
      source: "judge",
      status: "passed",
      rationale: "Fixture evidence satisfies the supplied criteria.",
      evidenceRefs: input.binding.evidenceRefs,
      followUps: [],
    };
  },
};
const report = await judgeValidation(request, fixture);
console.log(report.verdict, report.binding.candidateRevision);
```

`JudgeProvider` defaults to the legacy request/response types; its type arguments
allow this strict contract. A strict provider may return `unknown` so Chest can
validate decoded runtime output. It must return the mode and binding that were
actually evaluated, `source: "judge"` for a real judgement (or `"fallback"` for
an advisory fallback), a status, nonempty rationale, evidence citations, and
follow-ups. Do not attach the current binding to an older or unbound judgement.

The report's `verdict` is explicit:

| Outcome | Verdict | Compatible `status` |
| --- | --- | --- |
| Bound judged success | `pass` | `passed` |
| Bound judged failure | `fail` | `failed` |
| Needs review, missing criteria/evidence, fallback, malformed output or mismatched binding | `inconclusive` | `needs_review` |
| No provider, or provider throws/rejects | `unavailable` | `needs_review` |

Criteria and evidence IDs must be unique, and revisions, criterion text and
evidence fields must be nonempty. Invalid request shapes reject with `TypeError`;
empty criteria/evidence arrays return `inconclusive` without calling the judge.
Responses must echo the exact mode, task/candidate revisions, ordered criteria
and ordered evidence bindings. Citations must be nonempty and match supplied
references, including their digests. Optional confidence must be finite and in
`[0, 1]`. Only a valid, matching response with `source: "judge"` can pass.
Strict responses must be structured-cloneable. Chest validates the returned
value and an owned snapshot, then uses that snapshot so later provider mutation
cannot change the verdict. Sparse arrays, throwing properties and snapshot
failures produce `inconclusive`.

Each call invokes the provider at most once and has no fallback, retry, timeout,
storage or network policy. The caller owns deadlines/cancellation, resolves and
verifies evidence content against its digest, and ensures the judge evaluates
all criteria. Digests and revisions are opaque caller-supplied identifiers;
Chest checks their equality, not artifact contents or judge honesty. Provider
errors become `unavailable` without exposing raw error details in the report.
Persist the complete report to retain its binding and source; callers own the
later acceptance/authorization decision and must recheck that the binding is
still current.

Existing CLI/MCP tools and stored report formats remain compatible. Their legacy
`passed` status, including the nonempty-description completion fallback, is not
an affirmative result from this strict API. Use `judgeValidation` and its full
report when an independently judged result is required.

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
