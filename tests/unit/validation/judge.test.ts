import { describe, expect, it } from "bun:test";
import type { JudgeProvider, JudgeValidationRequest, JudgeValidationResponse } from "../../../src/index";
import { judgeValidation } from "../../../src/index";
import { isValidationReport } from "../../../src/reports/schema";

const request = (): JudgeValidationRequest => ({
  mode: "done",
  binding: {
    taskId: "task-1",
    taskRevision: "contract-v1",
    candidateRevision: "commit-1",
    criteria: [{ id: "test", text: "Required tests pass" }],
    evidenceRefs: [{ kind: "test", refId: "test-log", summary: "12 passing tests", digest: "sha256:fixture" }],
  },
});

const response = (input: JudgeValidationRequest): JudgeValidationResponse => ({
  mode: input.mode,
  binding: structuredClone(input.binding),
  source: "judge",
  status: "passed",
  rationale: "The supplied evidence satisfies all criteria.",
  followUps: [],
  evidenceRefs: structuredClone(input.binding.evidenceRefs),
});

describe("strict public validation", () => {
  it.each(["ready", "done"] as const)("binds a %s pass and preserves report compatibility", async (mode) => {
    const input = { ...request(), mode };
    const provider: JudgeProvider<JudgeValidationRequest, JudgeValidationResponse> = { judge: async (value) => response(value) };
    const report = await judgeValidation(input, provider);
    expect(report).toMatchObject({ workflow: mode, source: "judge", verdict: "pass", status: "passed", binding: input.binding });
    expect(isValidationReport(report)).toBe(true);
    input.binding.candidateRevision = "later";
    expect(report.binding.candidateRevision).toBe("commit-1");
  });

  it.each([
    ["failed", "fail"],
    ["needs_review", "inconclusive"],
  ] as const)("reports judged %s explicitly", async (status, verdict) => {
    expect(await judgeValidation(request(), { judge: async (value) => ({ ...response(value), status }) }))
      .toMatchObject({ status, verdict, source: "judge" });
  });

  it("does not call a judge without both criteria and evidence", async () => {
    let calls = 0;
    for (const field of ["criteria", "evidenceRefs"] as const) {
      const input = request();
      input.binding[field] = [];
      const report = await judgeValidation(input, { judge: async (value) => { calls++; return response(value); } });
      expect(report).toMatchObject({ verdict: "inconclusive", status: "needs_review", source: "none", binding: input.binding });
    }
    expect(calls).toBe(0);
  });

  it("reports absent or throwing providers as unavailable without leaking error details", async () => {
    const absent = await judgeValidation(request());
    let calls = 0;
    const outage = await judgeValidation(request(), { judge: async () => { calls++; throw new Error("private runtime error"); } });
    for (const report of [absent, outage]) {
      expect(report).toMatchObject({ verdict: "unavailable", status: "needs_review", source: "none", binding: request().binding });
      expect(JSON.stringify(report)).not.toContain("private runtime error");
    }
    expect(calls).toBe(1);
  });

  it("rejects legacy permissive reports and explicit fallback without retrying", async () => {
    let calls = 0;
    const legacy = { status: "passed", rationale: "Work evidence has a non-empty description.", followUps: [], evidenceRefs: [] };
    for (const value of [legacy, { ...response(request()), source: "fallback" }]) {
      const report = await judgeValidation(request(), { judge: async () => { calls++; return value; } });
      expect(report.verdict).toBe("inconclusive");
      expect(report.status).toBe("needs_review");
    }
    expect(calls).toBe(2);
  });

  it.each(["taskId", "taskRevision", "candidateRevision"] as const)("rejects mismatched %s", async (key) => {
    const report = await judgeValidation(request(), { judge: async (input) => {
      const value = response(input);
      value.binding[key] = "stale";
      return value;
    } });
    expect(report).toMatchObject({ verdict: "inconclusive", status: "needs_review", binding: request().binding });
  });

  it("rejects altered criteria, evidence digests, unbound citations and missing citations", async () => {
    const values = Array.from({ length: 6 }, () => response(request()));
    values[0].binding.criteria[0].text = "Weakened criteria";
    values[1].binding.evidenceRefs[0].digest = "stale";
    values[2].evidenceRefs[0].digest = "fabricated";
    values[3].evidenceRefs = [];
    values[4].binding.criteria = [];
    values[5].mode = "ready";
    for (const value of values) {
      expect(await judgeValidation(request(), { judge: async () => value }))
        .toMatchObject({ verdict: "inconclusive", status: "needs_review" });
    }
  });

  it("does not let provider mutation change the expected binding", async () => {
    const input = request();
    const report = await judgeValidation(input, { judge: async (value) => {
      value.binding.candidateRevision = "different";
      return response(value);
    } });
    expect(report.verdict).toBe("inconclusive");
    expect(report.binding).toEqual(input.binding);
  });

  it("compares binding fields independently of object key order", async () => {
    const report = await judgeValidation(request(), { judge: async (value) => ({
      ...response(value),
      binding: Object.fromEntries(Object.entries(value.binding).reverse()),
    }) });
    expect(report.verdict).toBe("pass");
  });

  it("fails closed on malformed and unserializable output", async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    for (const value of [null, undefined, 1n, circular, { ...response(request()), confidence: Infinity }, { ...response(request()), rationale: " " }, { ...response(request()), evidenceRefs: Array(1) }]) {
      expect(await judgeValidation(request(), { judge: async () => value }))
        .toMatchObject({ verdict: "inconclusive", status: "needs_review" });
    }
  });

  it("rejects invalid request boundaries before invoking the provider", async () => {
    const inputs = Array.from({ length: 4 }, request);
    inputs[0].binding.taskRevision = " ";
    inputs[1].binding.evidenceRefs[0].digest = "";
    inputs[2].binding.criteria.push(inputs[2].binding.criteria[0]);
    inputs[3].binding.evidenceRefs.push(inputs[3].binding.evidenceRefs[0]);
    let calls = 0;
    for (const input of inputs) {
      await expect(judgeValidation(input, { judge: async (value) => { calls++; return response(value); } })).rejects.toBeInstanceOf(TypeError);
    }
    expect(calls).toBe(0);
  });

  it("owns the validated response across asynchronous continuations", async () => {
    const value = response(request());
    value.status = "failed";
    value.followUps = ["Fix the failing check"];
    const report = await judgeValidation(request(), { judge: async () => {
      queueMicrotask(() => queueMicrotask(() => queueMicrotask(() => {
        value.status = "passed";
        value.rationale = "";
        value.binding.candidateRevision = "later";
        value.evidenceRefs[0].digest = "later";
        value.followUps[0] = "Skip the check";
      })));
      return value;
    } });
    expect(value.status).toBe("passed");
    expect(report).toMatchObject({
      verdict: "fail", status: "failed", source: "judge", binding: request().binding,
      evidenceRefs: request().binding.evidenceRefs, followUps: ["Fix the failing check"],
      rationale: "The supplied evidence satisfies all criteria.",
    });
  });

  it("rejects sparse arrays at every strict response boundary", async () => {
    const values = Array.from({ length: 4 }, () => response(request()));
    values[0].followUps = Array(1);
    values[1].evidenceRefs = Array(1);
    values[2].binding.criteria = Array(1);
    values[3].binding.evidenceRefs = Array(1);
    for (const value of values) {
      expect(await judgeValidation(request(), { judge: async () => value }))
        .toMatchObject({ verdict: "inconclusive", status: "needs_review" });
    }
  });

  it("classifies throwing accessors and snapshot failures as malformed without retrying", async () => {
    const getter = response(request());
    Object.defineProperty(getter, "status", { get() { throw new Error("private property error"); } });
    const uncloneable = { ...response(request()), extra: () => undefined };
    for (const value of [getter, uncloneable]) {
      let calls = 0;
      const report = await judgeValidation(request(), { judge: async () => { calls++; return value; } });
      expect(report).toMatchObject({ verdict: "inconclusive", status: "needs_review", rationale: "Judge response malformed." });
      expect(calls).toBe(1);
      expect(JSON.stringify(report)).not.toContain("private property error");
    }
  });

  it("does not let cloning discard invalid non-enumerable or inherited confidence", async () => {
    const hidden = Object.defineProperty(response(request()), "confidence", { value: NaN });
    const inherited = Object.setPrototypeOf(response(request()), { confidence: Infinity });
    for (const value of [hidden, inherited]) {
      expect(await judgeValidation(request(), { judge: async () => value }))
        .toMatchObject({ verdict: "inconclusive", status: "needs_review" });
    }
  });

  it("validates the snapshot when a getter changes during cloning", async () => {
    let reads = 0;
    const value = Object.defineProperty(response(request()), "source", {
      enumerable: true,
      get() { return ++reads === 1 ? "judge" : "bogus"; },
    });
    expect(await judgeValidation(request(), { judge: async () => value }))
      .toMatchObject({ verdict: "inconclusive", status: "needs_review" });
  });
});
