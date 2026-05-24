import { type Ohtools, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { judgeAlign } from "../judge/align";
import { writeReportFile } from "./record-store";
import { ok } from "../shared/result";

export const registerJudgeTools = (app: Ohtools): Ohtools =>
  app.tool("chest.judge.align", {
    description: "Judge alignment between governance criteria and evidence.",
    input: jsonSchema(chestInputSchemas.judgeAlign),
    run: async ({ snapshot, evidence }: { snapshot: unknown; evidence: string }) => {
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
