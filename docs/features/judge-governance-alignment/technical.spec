<spec name="Judge Governance Alignment Technical Specification" feature="judge-governance-alignment" extends="../../technical.spec">

  <slice_layout>
    <file path="src/judge/align.ts">
      judgeAlign(request: JudgeRequest): Effect&lt;ValidationReport, JudgeProviderError, JudgeProvider | Clock&gt;.
      Orchestrates: calls JudgeProvider.judge, validates response, retries on
      malformed_response, normalizes to ValidationReport. Pure; no I/O.
    </file>
    <file path="src/judge/prompt.ts">
      buildJudgePrompt(request: JudgeRequest): { system: string; user: string }.
      Pure function. No I/O. Constructs the system rubric and user evidence
      message from JudgeRequest fields.
    </file>
    <file path="src/judge/ports.ts">
      JudgeProvider interface + Context.GenericTag + JudgeProviderError:
        | { _tag: "unreachable"; cause: unknown }
        | { _tag: "malformed_response"; raw: string; attempt: number }
    </file>
    <file path="src/judge/schema.ts">
      Zod schemas for JudgeRequest and JudgeResponse.
    </file>
    <file path="src/judge/providers/openai/adapter.ts">
      OpenAIJudgeAdapter. Implements JudgeProvider. Only file allowed to import openai SDK.
      Reads config from src/judge/providers/openai/config.ts.
      Calls OpenAI Chat Completions API with response_format: json_object.
    </file>
    <file path="src/judge/providers/openai/config.ts">
      Exports openAIConfig(): { apiKey, model, timeoutMs }.
      Reads OPENAI_API_KEY, OPENAI_JUDGE_MODEL, CHEST_JUDGE_TIMEOUT_MS env vars.
    </file>
    <file path="src/plugin/judge-tools.ts">
      defineGroup for chest.judge containing chest.judge.align tool.
      Calls src/judge/align.ts and then src/reports/write.ts to persist the report.
      Maps JudgeProviderError _tags to ToolResult.
    </file>
  </slice_layout>

  <domain_types>
    Uses: JudgeRequest, JudgeResponse, ValidationReport, EvidenceRef from domain_types.
    Zod schemas in src/judge/schema.ts and src/validation/schema.ts.
  </domain_types>

  <ports_used>
    JudgeProvider.judge (called once per attempt, up to 3 total; from src/judge/ports.ts).
    ReportRepository.write (to persist the ValidationReport; called from the plugin
    bridge after judgeAlign succeeds, NOT inside the entity Effect program).
    Clock.now and Clock.newId (to generate report id and timestamp).
    No KPIRunner, OKRRepository, KPIRepository, DoRRepository, or DoDRepository.
  </ports_used>

  <yaml_touchpoints>
    Reads: none (snapshot is passed in by the caller via tool input).
    Writes: .chest/reports/&lt;timestamp&gt;-align.yaml (schema: report.v1).
    Write is performed by the plugin bridge via ReportRepository.write, not by
    the entity Effect program src/judge/align.ts.
  </yaml_touchpoints>

  <tools>
    <tool id="chest.judge.align" api="defineTool" group="chest.judge">
      <description>
        Evaluate whether evidence aligns with governance criteria by calling
        the configured judge provider. Returns a ValidationReport with status,
        rationale, confidence, and follow-up actions.
      </description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "snapshot": {
              "type": "object",
              "description": "GovernanceSnapshot with okrs, kpis, dor, dod arrays.",
              "properties": {
                "okrs": { "type": "array", "items": { "$ref": "#/$defs/OKR" } },
                "kpis": { "type": "array", "items": { "$ref": "#/$defs/KPI" } },
                "dor":  { "type": "array", "items": { "$ref": "#/$defs/DoRCriterion" } },
                "dod":  { "type": "array", "items": { "$ref": "#/$defs/DoDCriterion" } }
              },
              "required": ["okrs", "kpis", "dor", "dod"],
              "additionalProperties": false
            },
            "evidence": {
              "type": "string",
              "description": "Text description of the plan, work, or completion evidence under evaluation."
            }
          },
          "required": ["snapshot", "evidence"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        { "$ref": "#/$defs/ValidationReport" }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-07"/>
        <error ref="ERR-CHEST-08"/>
      </errors>
      <handler_contract>
        1. Parse unknown input; extract snapshot and evidence.
        2. Build JudgeRequest: mode "align", criteria from snapshot dor+dod,
           okrs from snapshot, evidence from input.
        3. Call judgeAlign(request) as an Effect program via runtime (requires
           JudgeProvider and Clock from the layer).
        4. On success: call writeReport(report) via ReportRepository to persist.
        5. Map JudgeProviderError _tags to ToolResult:
             { _tag: "unreachable" }        → { ok: false, error: { code: "ERR-CHEST-07", ... } }
             { _tag: "malformed_response" } → { ok: false, error: { code: "ERR-CHEST-08", ... } }
        6. On success after persistence: return { ok: true, data: validationReport }.
        Bridges return ToolResult envelopes; reports are only persisted on a successful judge call.
      </handler_contract>
    </tool>
  </tools>

  <plugin_composition>
    judgeGroup defined in src/plugin/judge-tools.ts. Contains chest.judge.align.
    Composed into chestPlugins via plugin("chest").group(judgeGroup).
    See umbrella tool_registry for full composition.
  </plugin_composition>

  <effects>
    src/judge/align.ts: Effect (no direct I/O; uses JudgeProvider and Clock ports).
    src/judge/providers/openai/adapter.ts: fetch (HTTP calls to OpenAI API).
    src/reports/write.ts: Effect (uses ReportRepository port; no direct I/O).
    src/workspace/yaml-repository.ts: fs/promises.writeFile + rename (atomic write).
    src/plugin/judge-tools.ts: ohtools defineTool, ToolResult mapping, orchestrates
      judgeAlign then writeReport.
    No child_process.
  </effects>

  <observability>
    Logger.info on successful judge call with workflow, status, confidence.
    Logger.warn on retry attempt with attempt number and parse error excerpt.
    Logger.error on ERR-CHEST-07 with provider error.
    Logger.error on ERR-CHEST-08 after all retries with raw response excerpt.
  </observability>

</spec>
