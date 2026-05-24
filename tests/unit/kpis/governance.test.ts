import { describe, expect, it } from "bun:test";
import { getKPI } from "../../../src/kpis/get";
import { listKPIs } from "../../../src/kpis/list";
import { removeKPI } from "../../../src/kpis/remove";
import { upsertKPI } from "../../../src/kpis/upsert";
import type { KPI } from "../../../src/kpis/schema";

const kpis: KPI[] = [
  { id: "kpi-1", name: "Test suite passes", target: "exit 0", command: ["bun", "test"], timeoutMs: 5000 },
  { id: "kpi-2", name: "Typecheck passes", target: "exit 0", command: ["bun", "run", "typecheck"], timeoutMs: 5000 },
];

describe("kpis helpers", () => {
  it("lists the records unchanged", () => {
    expect(listKPIs(kpis)).toEqual(kpis);
  });

  it("finds a record by id", () => {
    expect(getKPI(kpis, "kpi-1")).toEqual(kpis[0]);
  });

  it("upserts by inserting a new record", () => {
    const next = upsertKPI(kpis, {
      id: "kpi-3",
      name: "Docs published",
      target: "done",
      command: ["bun", "test"],
      timeoutMs: 1000,
    });

    expect(next).toHaveLength(3);
    expect(next[2].id).toBe("kpi-3");
  });

  it("removes by id", () => {
    expect(removeKPI(kpis, "kpi-2")).toEqual([kpis[0]]);
  });
});
