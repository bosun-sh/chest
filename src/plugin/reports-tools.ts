import { defineTool, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { listReportFiles, readReportFile } from "./record-store";
import { ok } from "../shared/result";

type ReportsListInput = { workflow?: string; since?: string };

export const reportsListTool = defineTool({
  id: "chest.reports.list",
  description: "List stored validation reports.",
  input: jsonSchema<ReportsListInput>(chestInputSchemas["chest.reports.list"]),
  run: async ({ workflow, since }: ReportsListInput) => {
    const result = await listReportFiles(process.cwd(), { workflow, since });
    return result.ok ? ok({ items: result.data }) : result;
  },
});

export const reportsGetTool = defineTool({
  id: "chest.reports.get",
  description: "Get a stored validation report by id.",
  input: jsonSchema<{ id: string }>(chestInputSchemas["chest.reports.get"]),
  run: async ({ id }: { id: string }) => readReportFile(process.cwd(), id),
});
