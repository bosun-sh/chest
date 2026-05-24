import type { Ohtools } from "@bosun-sh/ohtools";
import { registerInitTool } from "./init-tool";
import { registerOKRTools } from "./okrs-tools";
import { registerKpiTools } from "./kpis-tools";
import { registerDoRTools } from "./dor-tools";
import { registerDoDTools } from "./dod-tools";
import { registerValidateTools } from "./validate-tools";
import { registerJudgeTools } from "./judge-tools";
import { registerReportTools } from "./reports-tools";

export const registerChestTools = (app: Ohtools): Ohtools =>
  registerReportTools(
    registerJudgeTools(
      registerValidateTools(
        registerDoDTools(
          registerDoRTools(
            registerKpiTools(registerOKRTools(registerInitTool(app))),
          ),
        ),
      ),
    ),
  );
