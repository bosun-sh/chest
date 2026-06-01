import type { JudgeProvider } from "../../ports";
import { buildJudgePrompt } from "../../prompt";
import type { JudgeRequest, JudgeResponse } from "../../schema";
import { readOpenAIJudgeConfig } from "./config";

const isJudgeResponse = (value: unknown): value is JudgeResponse => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as JudgeResponse;
  return (
    (candidate.status === "passed" ||
      candidate.status === "failed" ||
      candidate.status === "needs_review") &&
    typeof candidate.rationale === "string" &&
    Array.isArray(candidate.followUps) &&
    Array.isArray(candidate.evidenceRefs)
  );
};

export const createOpenAIJudgeAdapter = (): JudgeProvider => ({
  judge: async (request: JudgeRequest): Promise<JudgeResponse> => {
    const config = readOpenAIJudgeConfig();
    if (!config.apiKey || !config.model) {
      throw new Error("OpenAI judge configuration is incomplete.");
    }

    const prompt = buildJudgePrompt(request);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI judge request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as unknown;

    if (!isJudgeResponse(parsed)) {
      throw new Error("OpenAI judge returned a malformed response.");
    }

    return parsed;
  },
});
