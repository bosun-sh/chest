import type { ChestLayer } from "./layers";
import { createChestApp } from "./ohtools-app";

export type ChestRuntime = {
  layer: ChestLayer;
  app: ReturnType<typeof createChestApp>;
};

export const makeChestRuntime = (workspaceRoot: string): ChestRuntime => ({
  layer: { workspaceRoot },
  app: createChestApp(),
});
