import { Effect } from "effect";
import { KPIRepository, KPIRunner, type KPIRepositoryError, type KPIRunnerError } from "./ports";
import type { KPI, KPIEvidence } from "./schema";
import { runKPI } from "./run";

const executeAllKPIs = async (kpis: KPI[]): Promise<KPIEvidence[]> => {
  const results: KPIEvidence[] = [];

  for (const kpi of kpis) {
    results.push(await runKPI(kpi));
  }

  return results;
};

export function runAllKPIs(): Effect.Effect<
  KPIEvidence[],
  KPIRepositoryError | KPIRunnerError,
  KPIRepository | KPIRunner
>;
export function runAllKPIs(kpis: KPI[]): Promise<KPIEvidence[]>;
export function runAllKPIs(
  kpis?: KPI[],
):
  | Effect.Effect<KPIEvidence[], KPIRepositoryError | KPIRunnerError, KPIRepository | KPIRunner>
  | Promise<KPIEvidence[]> {
  if (kpis) {
    return executeAllKPIs(kpis);
  }

  return Effect.gen(function* () {
    const repository = yield* KPIRepository;
    const runner = yield* KPIRunner;
    const loaded = yield* Effect.tryPromise({
      try: () => repository.list(),
      catch: (cause) => cause as KPIRepositoryError,
    });

    return yield* Effect.tryPromise({
      try: () => runner.runAll(loaded),
      catch: (cause) => cause as KPIRunnerError,
    });
  });
};
