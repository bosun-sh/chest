import { Effect } from "effect";
import { KPIRepository, KPIRunner, type KPIRepositoryError, type KPIRunnerError } from "./ports";
import type { KPI, KPIEvidence } from "./schema";
import { normalizeKPIEvidence } from "./evidence";

type BunSpawnSyncResult = {
  stdout: Uint8Array | string;
  stderr: Uint8Array | string;
  exitCode: number | null;
  signalCode?: string | null;
  error?: Error & { code?: string };
};

const bun = globalThis as typeof globalThis & {
  Bun?: {
    spawnSync(command: string[], options?: { timeout?: number; cwd?: string; env?: Record<string, string | undefined> }): BunSpawnSyncResult;
  };
};

const toText = (value: Uint8Array | string): string => {
  if (typeof value === "string") {
    return value;
  }

  return new TextDecoder().decode(value);
};

const executeKPI = async (kpi: KPI): Promise<KPIEvidence> => {
  const started = Date.now();
  const command = kpi.command[0] ?? "";
  const args = kpi.command.slice(1);
  let result: BunSpawnSyncResult;

  try {
    result = bun.Bun?.spawnSync([command, ...args], {
      timeout: kpi.timeoutMs,
      cwd: process.cwd(),
    }) ?? {
      stdout: "",
      stderr: "",
      exitCode: 0,
    };
  } catch (error) {
    if (error && typeof error === "object" && (error as { code?: string }).code === "ENOENT") {
      throw { _tag: "command_not_found", command };
    }

    throw error;
  }

  const durationMs = Math.max(0, Date.now() - started);
  const timedOut = result.signalCode === "SIGTERM" || result.exitCode === null;
  const exitCode = timedOut ? -1 : result.exitCode ?? -1;

  return normalizeKPIEvidence(
    {
      kpiId: kpi.id,
      exitCode,
      stdout: toText(result.stdout),
      stderr: toText(result.stderr),
      timedOut,
      durationMs,
    },
    kpi.evidenceNormalizer,
  );
};

export function runKPI(
  id: string,
): Effect.Effect<KPIEvidence, KPIRepositoryError | KPIRunnerError, KPIRepository | KPIRunner>;
export function runKPI(kpi: KPI): Promise<KPIEvidence>;
export function runKPI(
  idOrKpi: string | KPI,
):
  | Effect.Effect<KPIEvidence, KPIRepositoryError | KPIRunnerError, KPIRepository | KPIRunner>
  | Promise<KPIEvidence> {
  if (typeof idOrKpi !== "string") {
    return executeKPI(idOrKpi);
  }

  return Effect.gen(function* () {
    const repository = yield* KPIRepository;
    const runner = yield* KPIRunner;
    const kpi = yield* Effect.tryPromise({
      try: () => repository.findById(idOrKpi),
      catch: (cause) => cause as KPIRepositoryError,
    });

    if (!kpi) {
      return yield* Effect.fail({ _tag: "not_found", id: idOrKpi } as const);
    }

    return yield* Effect.tryPromise({
      try: () => runner.run(kpi),
      catch: (cause) => cause as KPIRunnerError,
    });
  });
}
