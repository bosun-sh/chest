import { join } from "node:path";

export type ChestWorkspacePaths = {
  root: string;
  storeDir: string;
  reportsDir: string;
  okrsFile: string;
  kpisFile: string;
  dorFile: string;
  dodFile: string;
};

export const resolveChestPaths = (workspaceRoot: string): ChestWorkspacePaths => {
  const storeDir = process.env.CHEST_HOME?.trim() || join(workspaceRoot, ".chest");

  return {
    root: workspaceRoot,
    storeDir,
    reportsDir: join(storeDir, "reports"),
    okrsFile: join(storeDir, "okrs.yaml"),
    kpisFile: join(storeDir, "kpis.yaml"),
    dorFile: join(storeDir, "definition-of-ready.yaml"),
    dodFile: join(storeDir, "definition-of-done.yaml"),
  };
};
