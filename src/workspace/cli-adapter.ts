import { cliAdapter } from "@bosun-sh/ohtools/adapters/cli";
import { createChestApp } from "./ohtools-app";

export const chestCliApp = createChestApp().adapter(cliAdapter());
