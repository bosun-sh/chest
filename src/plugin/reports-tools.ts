import { type Ohtools, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { listReportFiles, readReportFile } from "./record-store";
import { ok } from "../shared/result";

export const registerReportTools = (app: Ohtools): Ohtools =>
  app
    .tool("chest.reports.list", {
      description: "List stored validation reports.",
      input: jsonSchema(chestInputSchemas.reportsList),
      run: async ({ workflow, since }: { workflow?: string; since?: string }) => {
        const result = await listReportFiles(process.cwd(), { workflow, since });
        return result.ok ? ok({ items: result.data }) : result;
      },
    })
    .tool("chest.reports.get", {
      description: "Get a stored validation report by id.",
      input: jsonSchema(chestInputSchemas.id),
      run: async ({ id }: { id: string }) => readReportFile(process.cwd(), id),
    });
