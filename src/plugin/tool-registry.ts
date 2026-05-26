import { defineGroup, plugin } from "@bosun-sh/ohtools";
import { initTool } from "./init-tool";
import {
  okrsGetTool,
  okrsListTool,
  okrsRemoveTool,
  okrsUpsertTool,
} from "./okrs-tools";
import {
  kpisGetTool,
  kpisListTool,
  kpisRemoveTool,
  kpisRunAllTool,
  kpisRunTool,
  kpisUpsertTool,
} from "./kpis-tools";
import { dorListTool, dorUpsertTool } from "./dor-tools";
import { dodListTool, dodUpsertTool } from "./dod-tools";
import { validateDoneTool, validateReadyTool } from "./validate-tools";
import { judgeAlignTool } from "./judge-tools";
import { reportsGetTool, reportsListTool } from "./reports-tools";

const okrsGroup = defineGroup(
  { id: "okrs", description: "OKR governance tools." },
  (group) => group.tool(okrsListTool).tool(okrsGetTool).tool(okrsUpsertTool).tool(okrsRemoveTool),
);

const kpisGroup = defineGroup(
  { id: "kpis", description: "KPI governance tools." },
  (group) =>
    group
      .tool(kpisListTool)
      .tool(kpisGetTool)
      .tool(kpisUpsertTool)
      .tool(kpisRemoveTool)
      .tool(kpisRunTool)
      .tool(kpisRunAllTool),
);

const dorGroup = defineGroup(
  { id: "dor", description: "Definition of Ready tools." },
  (group) => group.tool(dorListTool).tool(dorUpsertTool),
);

const dodGroup = defineGroup(
  { id: "dod", description: "Definition of Done tools." },
  (group) => group.tool(dodListTool).tool(dodUpsertTool),
);

const validateGroup = defineGroup(
  { id: "validate", description: "Validation workflows." },
  (group) => group.tool(validateReadyTool).tool(validateDoneTool),
);

const judgeGroup = defineGroup(
  { id: "judge", description: "Judgement workflows." },
  (group) => group.tool(judgeAlignTool),
);

const reportsGroup = defineGroup(
  { id: "reports", description: "Validation report tools." },
  (group) => group.tool(reportsListTool).tool(reportsGetTool),
);

export const chestPlugin = plugin("chest")
  .tool(initTool)
  .group(okrsGroup)
  .group(kpisGroup)
  .group(dorGroup)
  .group(dodGroup)
  .group(validateGroup)
  .group(judgeGroup)
  .group(reportsGroup);

export const chestPlugins = [chestPlugin] as const;
