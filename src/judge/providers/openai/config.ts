export type OpenAIJudgeConfig = {
  apiKey?: string;
  model?: string;
  timeoutMs: number;
};

export const readOpenAIJudgeConfig = (): OpenAIJudgeConfig => ({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_JUDGE_MODEL,
  timeoutMs: Number(process.env.CHEST_JUDGE_TIMEOUT_MS || "30000"),
});
