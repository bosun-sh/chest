import { Context } from "effect";
import type { JudgeRequest, JudgeResponse } from "./schema";

export type JudgeProviderError =
  | { _tag: "unreachable"; provider?: string; cause: unknown; message?: string }
  | { _tag: "malformed_response"; provider?: string; raw: string; attempt: number; message?: string };

export interface JudgeProvider<Request = JudgeRequest, Response = JudgeResponse> {
  judge(request: Request): Promise<Response>;
}

export const JudgeProvider = Context.GenericTag<JudgeProvider>("JudgeProvider");
