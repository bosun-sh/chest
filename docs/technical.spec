<spec name="Chest Technical Specification" status="v1" extends="concept.spec">

  <architecture_overview>
    Chest uses screaming architecture with vertical slicing. Top-level source
    folders are entity names or composition concerns only. No layered source
    tree from the prior draft remains.

    The functional core lives in entity slices under src/{okrs,kpis,dor,dod,
    validation,judge,reports}/. The imperative shell lives in src/plugin/ and
    src/workspace/. Plugin bridges are thin adapters around pure Effect
    programs. Result envelopes are explicit. Errors are tagged unions on the
    Effect failure channel. Public JSON Schemas are object-rooted and
    machine-readable.

    Architecture-as-tests is part of the contract: boundary tests must prevent
    entity code from importing ohtools, workspace adapters, or provider SDKs.
  </architecture_overview>

  <source_layout>
    <file path="src/okrs/schema.ts">Zod schema for OKR and KeyResult.</file>
    <file path="src/okrs/ports.ts">OKRRepository interface + Context.GenericTag + OKRRepositoryError.</file>
    <file path="src/okrs/list.ts">listOKRs(): Effect&lt;OKR[], OKRRepositoryError, OKRRepository&gt;.</file>
    <file path="src/okrs/get.ts">getOKR(id): Effect&lt;OKR, OKRRepositoryError, OKRRepository&gt;.</file>
    <file path="src/okrs/upsert.ts">upsertOKR(record): Effect&lt;WriteResult, OKRRepositoryError, OKRRepository&gt;.</file>
    <file path="src/okrs/remove.ts">removeOKR(id): Effect&lt;WriteResult, OKRRepositoryError, OKRRepository&gt;.</file>
    <file path="src/okrs/rules.ts">Pure OKR validation rules.</file>
    <file path="src/kpis/schema.ts">Zod schema for KPI and KPIEvidence.</file>
    <file path="src/kpis/ports.ts">KPIRepository and KPIRunner interfaces + Context.GenericTags + error unions.</file>
    <file path="src/kpis/list.ts">listKPIs(): Effect&lt;KPI[], KPIRepositoryError, KPIRepository&gt;.</file>
    <file path="src/kpis/get.ts">getKPI(id): Effect&lt;KPI, KPIRepositoryError, KPIRepository&gt;.</file>
    <file path="src/kpis/upsert.ts">upsertKPI(record): Effect&lt;WriteResult, KPIRepositoryError, KPIRepository&gt;.</file>
    <file path="src/kpis/remove.ts">removeKPI(id): Effect&lt;WriteResult, KPIRepositoryError, KPIRepository&gt;.</file>
    <file path="src/kpis/run.ts">runKPI(id): Effect&lt;KPIEvidence, KPIRunnerError | KPIRepositoryError, KPIRepository | KPIRunner&gt;.</file>
    <file path="src/kpis/run-all.ts">runAllKPIs(): Effect&lt;KPIEvidence[], KPIRepositoryError, KPIRepository | KPIRunner&gt;.</file>
    <file path="src/kpis/evidence.ts">Pure KPI evidence normalization.</file>
    <file path="src/dor/schema.ts">Zod schema for DoRCriterion.</file>
    <file path="src/dor/ports.ts">DoRRepository interface + Context.GenericTag + DoRRepositoryError.</file>
    <file path="src/dor/list.ts">listDoR(): Effect&lt;DoRCriterion[], DoRRepositoryError, DoRRepository&gt;.</file>
    <file path="src/dor/upsert.ts">upsertDoR(record): Effect&lt;WriteResult, DoRRepositoryError, DoRRepository&gt;.</file>
    <file path="src/dod/schema.ts">Zod schema for DoDCriterion.</file>
    <file path="src/dod/ports.ts">DoDRepository interface + Context.GenericTag + DoDRepositoryError.</file>
    <file path="src/dod/list.ts">listDoD(): Effect&lt;DoDCriterion[], DoDRepositoryError, DoDRepository&gt;.</file>
    <file path="src/dod/upsert.ts">upsertDoD(record): Effect&lt;WriteResult, DoDRepositoryError, DoDRepository&gt;.</file>
    <file path="src/validation/schema.ts">Zod schema for ValidationReport and EvidenceRef.</file>
    <file path="src/validation/ready.ts">validateReady(plan, dor, okrs): Effect&lt;JudgeResponse, never, JudgeProvider&gt;.</file>
    <file path="src/validation/done.ts">validateDone(evidence, dod, okrs, kpiEvidence): Effect&lt;JudgeResponse, JudgeProviderError, JudgeProvider&gt;.</file>
    <file path="src/validation/rules.ts">Pure readiness fallback rules.</file>
    <file path="src/judge/schema.ts">Zod schema for JudgeRequest and JudgeResponse.</file>
    <file path="src/judge/ports.ts">JudgeProvider interface + Context.GenericTag + JudgeProviderError.</file>
    <file path="src/judge/align.ts">judgeAlign(request): Effect&lt;ValidationReport, JudgeProviderError, JudgeProvider | Clock&gt;.</file>
    <file path="src/judge/prompt.ts">buildJudgePrompt(request): {system, user}.</file>
    <file path="src/judge/providers/openai/adapter.ts">OpenAIJudgeAdapter. Only file allowed to import openai.</file>
    <file path="src/judge/providers/openai/config.ts">Reads OpenAI judge environment variables.</file>
    <file path="src/reports/schema.ts">Zod schema for ValidationReport alias.</file>
    <file path="src/reports/ports.ts">ReportRepository interface + Context.GenericTag + ReportRepositoryError.</file>
    <file path="src/reports/list.ts">listReports(filter?): Effect&lt;ReportSummary[], ReportRepositoryError, ReportRepository&gt;.</file>
    <file path="src/reports/get.ts">getReport(id): Effect&lt;ValidationReport, ReportRepositoryError, ReportRepository&gt;.</file>
    <file path="src/reports/write.ts">writeReport(report): Effect&lt;void, ReportRepositoryError, ReportRepository&gt;.</file>
    <file path="src/shared/result.ts">ToolResult&lt;T&gt; envelope.</file>
    <file path="src/shared/ids.ts">newId() and ID helpers.</file>
    <file path="src/shared/time.ts">Timestamp utilities.</file>
    <file path="src/shared/atomic-write.ts">Atomic write helper used only from workspace/.</file>
    <file path="src/shared/yaml-parse.ts">Pure YAML parsing helpers.</file>
    <file path="src/shared/error-codes.ts">ERR-CHEST-NN constants for bridge translation.</file>
    <file path="src/shared/ports.ts">Clock and Logger cross-cutting tags.</file>
    <file path="src/plugin/public-schemas.ts">Public input JSON Schemas as const literals.</file>
    <file path="src/plugin/registry.ts">Exports the chest plugin list.</file>
    <file path="src/plugin/tool-registry.ts">Assembles tool groups and validates tool IDs.</file>
    <file path="src/plugin/init-tool.ts">defineTool for chest.init.</file>
    <file path="src/plugin/okrs-tools.ts">Bridges chest.okrs tools.</file>
    <file path="src/plugin/kpis-tools.ts">Bridges chest.kpis tools.</file>
    <file path="src/plugin/dor-tools.ts">Bridges chest.dor tools.</file>
    <file path="src/plugin/dod-tools.ts">Bridges chest.dod tools.</file>
    <file path="src/plugin/validate-tools.ts">Bridges chest.validate tools.</file>
    <file path="src/plugin/judge-tools.ts">Bridges chest.judge tools.</file>
    <file path="src/plugin/reports-tools.ts">Bridges chest.reports tools.</file>
    <file path="src/workspace/layers.ts">makeChestLayer(workspaceRoot): Layer composition root.</file>
    <file path="src/workspace/runtime.ts">Managed runtime for Effect execution.</file>
    <file path="src/workspace/ohtools-app.ts">createChestApp() applies chestPlugins.</file>
    <file path="src/workspace/cli-adapter.ts">CLI entry point.</file>
    <file path="src/workspace/mcp-server.ts">MCP stdio entry point.</file>
    <file path="src/workspace/yaml-repository.ts">YAML repository implementations.</file>
    <file path="src/workspace/storage-paths.ts">Resolves .chest/ paths from CHEST_HOME or cwd.</file>
    <file path="src/workspace/init.ts">Workspace initialization workflow.</file>
    <file path="src/index.ts">Public barrel export.</file>
    <file path="src/ohtools.ts">Re-exports the chest Ohtools app.</file>
  </source_layout>

  <runtime>
    <engine>Bun with TypeScript strict mode.</engine>
    <effect>Effect is used at handler boundaries for dependency injection, cancellation, and structured errors.</effect>
    <dependencies>@bosun-sh/ohtools, @modelcontextprotocol/sdk, effect, js-yaml or equivalent, openai only in the judge adapter.</dependencies>
  </runtime>

  <storage_conventions>
    <root>
      Default: ./.chest/ relative to cwd. Override via CHEST_HOME. Path
      resolution lives in src/workspace/storage-paths.ts.
    </root>
    <files>
      <file name="okrs.yaml">okrs.v1</file>
      <file name="kpis.yaml">kpis.v1</file>
      <file name="definition-of-ready.yaml">dor.v1</file>
      <file name="definition-of-done.yaml">dod.v1</file>
      <file name="reports/&lt;timestamp&gt;-&lt;workflow&gt;.yaml">report.v1</file>
    </files>
    <write_policy>All writes use atomic temp-file + rename.</write_policy>
  </storage_conventions>

  <yaml_schemas>
    <schema name="okrs.v1">Top-level array of OKR objects.</schema>
    <schema name="kpis.v1">Top-level array of KPI objects.</schema>
    <schema name="dor.v1">Top-level array of DoRCriterion objects.</schema>
    <schema name="dod.v1">Top-level array of DoDCriterion objects.</schema>
    <schema name="report.v1">ValidationReport object stored per workflow run.</schema>
  </yaml_schemas>

  <domain_types>
    <interface name="OKR">id, objective, keyResults, owner?, tags?</interface>
    <interface name="KeyResult">id, description, target</interface>
    <interface name="KPI">id, name, target, command, timeoutMs, evidenceNormalizer?</interface>
    <interface name="KPIEvidence">kpiId, exitCode, stdout, stderr, timedOut, durationMs, normalizedValue?</interface>
    <interface name="DoRCriterion">id, text, severity</interface>
    <interface name="DoDCriterion">id, text, severity, requiresKpi?</interface>
    <interface name="ValidationReport">id, workflow, timestamp, status, rationale, evidenceRefs, confidence?, followUps</interface>
    <interface name="EvidenceRef">kind, refId, summary</interface>
    <interface name="JudgeRequest">mode, criteria, okrs, evidence, kpiEvidence?</interface>
    <interface name="JudgeResponse">status, rationale, confidence?, followUps, evidenceRefs</interface>
    <interface name="GovernanceSnapshot">okrs, kpis, dor, dod</interface>
  </domain_types>

  <ports>
    <port entity="okrs" file="src/okrs/ports.ts">
      interface OKRRepository { list(); findById(id); save(record); remove(id); }
      export const OKRRepository = Context.GenericTag&lt;OKRRepository&gt;("OKRRepository")
      type OKRRepositoryError = not_found | conflict | invalid_yaml | schema_violation | missing_file | unsafe_write
    </port>
    <port entity="kpis" file="src/kpis/ports.ts">
      interface KPIRepository { list(); findById(id); save(record); remove(id); }
      interface KPIRunner { run(kpi); runAll(kpis); }
      export const KPIRepository = Context.GenericTag&lt;KPIRepository&gt;("KPIRepository")
      export const KPIRunner = Context.GenericTag&lt;KPIRunner&gt;("KPIRunner")
      type KPIRepositoryError = not_found | invalid_yaml | schema_violation | missing_file | unsafe_write
      type KPIRunnerError = command_not_found
    </port>
    <port entity="dor" file="src/dor/ports.ts">
      interface DoRRepository { list(); save(record); }
      export const DoRRepository = Context.GenericTag&lt;DoRRepository&gt;("DoRRepository")
      type DoRRepositoryError = not_found | invalid_yaml | schema_violation | missing_file | unsafe_write
    </port>
    <port entity="dod" file="src/dod/ports.ts">
      interface DoDRepository { list(); save(record); }
      export const DoDRepository = Context.GenericTag&lt;DoDRepository&gt;("DoDRepository")
      type DoDRepositoryError = not_found | invalid_yaml | schema_violation | missing_file | unsafe_write
    </port>
    <port entity="judge" file="src/judge/ports.ts">
      interface JudgeProvider { judge(request); }
      export const JudgeProvider = Context.GenericTag&lt;JudgeProvider&gt;("JudgeProvider")
      type JudgeProviderError = unreachable | malformed_response
    </port>
    <port entity="reports" file="src/reports/ports.ts">
      interface ReportRepository { list(filter?); findById(id); write(report); }
      export const ReportRepository = Context.GenericTag&lt;ReportRepository&gt;("ReportRepository")
      type ReportRepositoryError = not_found | missing_dir
    </port>
    <port entity="shared" file="src/shared/ports.ts">
      interface Clock { now(); newId(); }
      interface Logger { info(); warn(); error(); }
      export const Clock = Context.GenericTag&lt;Clock&gt;("Clock")
      export const Logger = Context.GenericTag&lt;Logger&gt;("Logger")
    </port>
  </ports>

  <judge_adapter>
    <port_interface>JudgeProvider in src/judge/ports.ts</port_interface>
    <reference_adapter name="OpenAIJudgeAdapter" path="src/judge/providers/openai/adapter.ts">
      <env_vars>OPENAI_API_KEY, OPENAI_JUDGE_MODEL, CHEST_JUDGE_TIMEOUT_MS</env_vars>
      <behavior>Build prompt, call OpenAI, validate JudgeResponse, map malformed responses to JudgeProviderError.</behavior>
      <retry_policy>Retry malformed_response up to 3 total attempts; fail fast on unreachable.</retry_policy>
      <domain_isolation>Only src/judge/providers/openai/** may import openai.</domain_isolation>
    </reference_adapter>
  </judge_adapter>

  <tool_registry>
    Tool IDs are authoritative and stay stable.
    The registry validates lowercase dotted IDs, enforces a 100-tool ceiling,
    and rejects duplicates at module load time.

    chest.init
    chest.okrs.list, chest.okrs.get, chest.okrs.upsert, chest.okrs.remove
    chest.kpis.list, chest.kpis.get, chest.kpis.upsert, chest.kpis.remove, chest.kpis.run, chest.kpis.run-all
    chest.dor.list, chest.dor.upsert
    chest.dod.list, chest.dod.upsert
    chest.validate.ready, chest.validate.done
    chest.judge.align
    chest.reports.list, chest.reports.get

    Plugins are assembled from thin defineTool bridges in src/plugin/*.ts and
    grouped in src/plugin/tool-registry.ts. createChestApp() applies chestPlugins
    in src/workspace/ohtools-app.ts.
  </tool_registry>

  <json_schema_conventions>
    Public tool inputs are object-rooted, additionalProperties:false, and live as
    as const literals in src/plugin/public-schemas.ts. Internal validation uses
    Zod schemas in entity schema.ts files. The two representations are separate.
  </json_schema_conventions>

  <error_taxonomy>
    ERR-CHEST-NN codes remain stable. Entity slices only emit _tag errors.
    Plugin bridges translate _tag values to public error codes through shared
    mapError helpers.
  </error_taxonomy>

  <dependency_injection>
    Each port exports Context.GenericTag&lt;T&gt;(name). Handlers acquire services
    with yield* Tag inside Effect.gen. There is no service-factory closure
    passing or constructor injection in the entity slices. makeChestLayer(workspaceRoot)
    composes the runtime in src/workspace/layers.ts, and src/workspace/runtime.ts
    builds the ManagedRuntime consumed by plugin bridges.
  </dependency_injection>

  <result_envelope>
    src/shared/result.ts defines ToolResult&lt;T&gt; = { ok: true, data, warnings? } |
    { ok: false, error: { code, message, details? } }. All public handlers
    return Effect&lt;ToolResult&lt;T&gt;, never, Deps&gt;. Bridges never throw; every
    failure is mapped into the envelope.
  </result_envelope>

  <path_aliases>
    tsconfig.json maps @chest/* to ./src/*. All intra-repo imports use the alias.
    The only provider exception is src/judge/providers/openai/**, which may
    import the OpenAI SDK directly.
  </path_aliases>

</spec>
