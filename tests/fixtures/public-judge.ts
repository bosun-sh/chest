// Copied into the installed tarball consumer; use only the public package entrypoint.
import {
  type JudgeBinding,
  type JudgeProvider,
  type JudgeValidationReport,
  type JudgeValidationRequest,
  type JudgeValidationResponse,
  judgeValidation,
} from "@bosun-sh/chest";

const assert = (condition: boolean) => {
  if (!condition) throw new Error("Public judge contract assertion failed");
};

const binding: JudgeBinding = {
  taskId: "package-consumer",
  taskRevision: "criteria-v1",
  candidateRevision: "revision-1",
  criteria: [{ id: "tests", text: "All required checks pass" }],
  evidenceRefs: [{ kind: "test-log", refId: "artifact:checks", summary: "Checks passed", digest: "sha256:fixture" }],
};
const request: JudgeValidationRequest = { mode: "done", binding };
const response = (input: JudgeValidationRequest): JudgeValidationResponse => ({
  mode: input.mode, source: "judge", binding: input.binding, status: "passed", rationale: "All criteria supported by evidence.",
  evidenceRefs: input.binding.evidenceRefs, followUps: [],
});
// This stand-in has the same seam as a caller-owned local/subscription runtime; it never uses a provider SDK.
const provider: JudgeProvider<JudgeValidationRequest, JudgeValidationResponse> = { judge: async (input) => response(input) };
const passed: JudgeValidationReport = await judgeValidation(request, provider);
assert(passed.verdict === "pass");
assert(JSON.stringify(passed.binding) === JSON.stringify(binding));
assert((await judgeValidation({ ...request, mode: "ready" }, provider)).verdict === "pass");
assert((await judgeValidation(request, { judge: async (input) => ({ ...response(input), status: "failed" }) })).verdict === "fail");
assert((await judgeValidation(request, { judge: async (input) => ({ ...response(input), status: "needs_review" }) })).verdict === "inconclusive");
assert((await judgeValidation({ ...request, binding: { ...binding, evidenceRefs: [] } }, provider)).verdict === "inconclusive");
assert((await judgeValidation(request)).verdict === "unavailable");
assert((await judgeValidation(request, { judge: async () => { throw new Error("runtime offline"); } })).verdict === "unavailable");
for (const output of [
  null,
  { status: "passed", rationale: "Description is nonempty", followUps: [], evidenceRefs: [] },
  { ...response(request), source: "fallback" },
  { ...response(request), mode: "ready" },
  { ...response(request), binding: { ...binding, candidateRevision: "stale" } },
  { ...response(request), binding: { ...binding, taskRevision: "stale" } },
  { ...response(request), binding: { ...binding, criteria: [{ id: "tests", text: "Weaker criterion" }] } },
  { ...response(request), evidenceRefs: [{ ...binding.evidenceRefs[0], digest: "stale" }] },
  { ...response(request), followUps: Array(1) },
  Object.defineProperty(response(request), "status", { get() { throw new Error("malformed property"); } }),
  Object.defineProperty(response(request), "confidence", { value: NaN }),
]) {
  const report = await judgeValidation(request, { judge: async () => output });
  assert(report.verdict === "inconclusive");
  assert(report.status === "needs_review");
  assert(JSON.stringify(report.binding) === JSON.stringify(binding));
}
const owned = await judgeValidation(request, { judge: async (input) => {
  const value = response(input);
  value.status = "failed";
  queueMicrotask(() => queueMicrotask(() => queueMicrotask(() => {
    value.status = "passed";
    value.rationale = "";
  })));
  return value;
} });
assert(owned.verdict === "fail" && owned.status === "failed" && owned.rationale.length > 0);
console.log("public judge packed contract passed");
