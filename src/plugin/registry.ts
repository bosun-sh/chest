export const chestToolIds = [
  "chest.init",
  "chest.okrs.list",
  "chest.okrs.get",
  "chest.okrs.upsert",
  "chest.okrs.remove",
  "chest.kpis.list",
  "chest.kpis.get",
  "chest.kpis.upsert",
  "chest.kpis.remove",
  "chest.kpis.run",
  "chest.kpis.run-all",
  "chest.dor.list",
  "chest.dor.upsert",
  "chest.dod.list",
  "chest.dod.upsert",
  "chest.validate.ready",
  "chest.validate.done",
  "chest.judge.align",
  "chest.reports.list",
  "chest.reports.get",
] as const;

export type ChestToolId = (typeof chestToolIds)[number];
