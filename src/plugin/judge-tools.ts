import { defineTool, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { judgeAlign } from "../judge/align";
import { writeReportFile } from "./record-store";
import { ok } from "../shared/result";

type JudgeAlignInput = { snapshot: unknown; evidence: string };

export const judgeAlignTool = defineTool({
  id: "chest.judge.align",
  description: "Judge alignment between governance criteria and evidence.",
  input: jsonSchema<JudgeAlignInput>(chestInputSchemas["chest.judge.align"]),
  run: async ({ snapshot, evidence }: JudgeAlignInput) => {
    const report = await judgeAlign({
      mode: "align",
      criteria: [],
      okrs: [],
      evidence: { snapshot, evidence },
    });
    await writeReportFile(process.cwd(), report);
    return ok(report);
  },
});
