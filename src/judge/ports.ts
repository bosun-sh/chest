import type { JudgeRequest, JudgeResponse } from "./schema";

export type JudgeProviderError =
  | { _tag: "unreachable"; provider: string; message: string }
  | { _tag: "malformed_response"; provider: string; message: string };

export interface JudgeProvider {
  judge(request: JudgeRequest): Promise<JudgeResponse>;
}
