import { Effect } from "effect";
import { isJudgeResponse } from "../judge/align";
import { invokeJudge } from "../judge/invoke";
import type { JudgeProvider } from "../judge/ports";
import { systemClock } from "../shared/ports";
import type {
  JudgeBinding,
  JudgeEvidenceRef,
  JudgeValidationReport,
  JudgeValidationRequest,
  JudgeValidationResponse,
} from "./schema";

const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isEvidence = (value: unknown): value is JudgeEvidenceRef => {
  if (!value || typeof value !== "object") return false;
  const ref = value as JudgeEvidenceRef;
  return nonempty(ref.kind) && nonempty(ref.refId) && nonempty(ref.summary) && nonempty(ref.digest);
};

const isBinding = (value: unknown): value is JudgeBinding => {
  if (!value || typeof value !== "object") return false;
  const binding = value as JudgeBinding;
  return nonempty(binding.taskId) && nonempty(binding.taskRevision) && nonempty(binding.candidateRevision)
    && Array.isArray(binding.criteria)
    && Array.from(binding.criteria).every((item) => item && nonempty(item.id) && nonempty(item.text))
    && new Set(binding.criteria.map((item) => item.id)).size === binding.criteria.length
    && Array.isArray(binding.evidenceRefs) && Array.from(binding.evidenceRefs).every(isEvidence)
    && new Set(binding.evidenceRefs.map((item) => item.refId)).size === binding.evidenceRefs.length;
};

const sameEvidence = (left: JudgeEvidenceRef, right: JudgeEvidenceRef) =>
  left.kind === right.kind && left.refId === right.refId && left.summary === right.summary && left.digest === right.digest;

const sameBinding = (left: JudgeBinding, right: JudgeBinding) =>
  left.taskId === right.taskId && left.taskRevision === right.taskRevision && left.candidateRevision === right.candidateRevision
  && left.criteria.length === right.criteria.length
  && left.criteria.every((item, index) => item.id === right.criteria[index].id && item.text === right.criteria[index].text)
  && left.evidenceRefs.length === right.evidenceRefs.length
  && left.evidenceRefs.every((item, index) => sameEvidence(item, right.evidenceRefs[index]));

const isResponse = (value: unknown): value is JudgeValidationResponse => {
  if (!isJudgeResponse(value)) return false;
  const response = value as JudgeValidationResponse;
  return (response.mode === "ready" || response.mode === "done") && isBinding(response.binding)
    && (response.source === "judge" || response.source === "fallback")
    && Array.from(response.followUps).every((item) => typeof item === "string")
    && nonempty(response.rationale) && Array.from(response.evidenceRefs).every(isEvidence)
    && (response.confidence === undefined || (Number.isFinite(response.confidence) && response.confidence >= 0 && response.confidence <= 1));
};

/** One caller-owned judge invocation. No provider selection, retries, storage or authorization. */
export const judgeValidation = async (
  request: JudgeValidationRequest,
  provider?: JudgeProvider<JudgeValidationRequest, unknown>,
): Promise<JudgeValidationReport> => {
  if (!request || (request.mode !== "ready" && request.mode !== "done") || !isBinding(request.binding)) {
    throw new TypeError("A ready/done request with unique criteria/evidence IDs and nonempty revision/evidence bindings is required.");
  }
  // Keep the report bound to the original input even if the caller or provider mutates its copy.
  const snapshot = structuredClone(request);
  const report: JudgeValidationReport = {
    id: systemClock.newId(),
    workflow: snapshot.mode,
    timestamp: systemClock.now().toISOString(),
    status: "needs_review",
    verdict: "inconclusive",
    binding: snapshot.binding,
    source: "none",
    rationale: "Criteria and evidence references are required for a judged result.",
    evidenceRefs: [],
    followUps: [],
  };
  if (!snapshot.binding.criteria.length || !snapshot.binding.evidenceRefs.length) return report;
  if (!provider) return { ...report, verdict: "unavailable", rationale: "Judge provider unavailable." };

  const result = await Effect.runPromise(Effect.either(invokeJudge(structuredClone(snapshot), provider, isResponse, 1, structuredClone)));
  if (result._tag === "Left") {
    return {
      ...report,
      verdict: result.left._tag === "unreachable" ? "unavailable" : "inconclusive",
      rationale: result.left._tag === "unreachable" ? "Judge provider unavailable." : "Judge response malformed.",
    };
  }
  const response = result.right;
  if (response.source === "fallback") return { ...report, source: "fallback", rationale: "Fallback is not a judged result." };
  if (snapshot.mode !== response.mode || !sameBinding(snapshot.binding, response.binding)) return { ...report, rationale: "Judge response binding does not match the request." };
  if (!response.evidenceRefs.length || !response.evidenceRefs.every((ref) => snapshot.binding.evidenceRefs.some((expected) => sameEvidence(ref, expected)))) {
    return { ...report, rationale: "Judge response must cite supplied evidence references." };
  }
  return {
    ...report,
    source: "judge",
    verdict: response.status === "passed" ? "pass" : response.status === "failed" ? "fail" : "inconclusive",
    status: response.status,
    rationale: response.rationale,
    confidence: response.confidence,
    evidenceRefs: structuredClone(response.evidenceRefs),
    followUps: [...response.followUps],
  };
};
