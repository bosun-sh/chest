import { type Ohtools, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { validateReady } from "../validation/ready";
import { validateDone } from "../validation/done";
import { writeReportFile } from "./record-store";
import { ok } from "../shared/result";

export const registerValidateTools = (app: Ohtools): Ohtools =>
  app
    .tool("chest.validate.ready", {
      description: "Validate a plan against Definition of Ready criteria.",
      input: jsonSchema(chestInputSchemas.validateReady),
      run: async ({ plan }: { plan: string; ref?: string }) => {
        const report = validateReady(plan);
        await writeReportFile(process.cwd(), report);
        return ok(report);
      },
    })
    .tool("chest.validate.done", {
      description: "Validate completed work against Definition of Done criteria.",
      input: jsonSchema(chestInputSchemas.validateDone),
      run: async ({ work_evidence }: { work_evidence: string }) => {
        const report = validateDone(work_evidence);
        await writeReportFile(process.cwd(), report);
        return ok(report);
      },
    });
