<spec name="Chest Functional Specification" status="v1" extends="concept.spec">

  <purpose>
    Chest is a local governance store that lets AI agents self-regulate their
    planning and completion workflows without defaulting to human checkpoints.
    It stores OKRs, KPIs, Definition of Ready, and Definition of Done in
    repository-local YAML files and exposes validation workflows through ohtools
    MCP tools and CLI commands. All behaviors are equally available on both
    surfaces; no capability is exclusive to MCP or to CLI.
  </purpose>

  <actors>
    <actor id="planning-agent">
      An AI agent preparing to begin implementation work. Triggers:
      initialize, inspect-governance, edit-governance, validate-readiness.
    </actor>
    <actor id="implementing-agent">
      An AI agent executing a plan. Triggers: run-kpis, judge-alignment,
      validate-done, fetch-report.
    </actor>
    <actor id="reviewer-human">
      A human reviewing agent work or governance criteria. Triggers:
      inspect-governance, fetch-report.
    </actor>
    <actor id="ci-runner">
      An automated pipeline step. Triggers: validate-readiness, validate-done,
      run-kpis, fetch-report.
    </actor>
  </actors>

  <surfaces>
    <surface id="mcp">
      Exposed through the @bosun-sh/ohtools MCP adapter. Agents invoke tools
      by name with JSON input objects. Every tool available over MCP must also
      be available over CLI.
    </surface>
    <surface id="cli">
      Exposed through the @bosun-sh/ohtools CLI adapter via
      `bunx ohtools --app src/ohtools.ts run <tool-id> --input <json>`.
      Every tool available over CLI must also be available over MCP.
      CLI output is a JSON envelope by default; human-readable with --human.
    </surface>
  </surfaces>

  <workflows>
    <workflow id="initialize">
      <trigger>Actor calls chest.init with an optional target directory.</trigger>
      <preconditions>Target directory is accessible. Chest has write permission.</preconditions>
      <steps>
        1. Resolve the target path (default: current working directory).
        2. Check whether .chest/ already exists.
        3. If it exists and force is not set, return a conflict error.
        4. If it exists and force is true, overwrite the governance files.
        5. Write empty okrs.yaml, kpis.yaml, definition-of-ready.yaml,
           definition-of-done.yaml under .chest/.
        6. Return a summary of created paths.
      </steps>
      <postconditions>
        .chest/ contains four parseable, schema-valid empty governance files.
      </postconditions>
      <failure_modes>
        Target directory does not exist or is not writable. .chest/ already
        exists and force is false. Partial write leaves .chest/ in an
        inconsistent state.
      </failure_modes>
    </workflow>

    <workflow id="inspect-governance">
      <trigger>
        Actor calls chest.okrs.list, chest.okrs.get, chest.kpis.list,
        chest.kpis.get, chest.dor.list, or chest.dod.list.
      </trigger>
      <preconditions>.chest/ exists and governance files are present.</preconditions>
      <steps>
        1. Resolve the governance file path.
        2. Read and parse the YAML file.
        3. Validate the parsed value against the relevant schema.
        4. Normalize into domain types.
        5. Filter or project to the requested record(s).
        6. Return structured output.
      </steps>
      <postconditions>
        Caller receives zero or more normalized domain records. On read error,
        caller receives a diagnostic with file path and line context.
      </postconditions>
      <failure_modes>
        File absent. File not parseable as YAML. Parsed shape violates schema.
        Requested ID does not exist.
      </failure_modes>
    </workflow>

    <workflow id="edit-governance">
      <trigger>
        Actor calls chest.okrs.upsert, chest.okrs.remove, chest.kpis.upsert,
        chest.kpis.remove, chest.dor.upsert, or chest.dod.upsert.
      </trigger>
      <preconditions>.chest/ exists. Governance file for the target entity is present.</preconditions>
      <steps>
        1. Validate the incoming record against the relevant schema.
        2. Load the current governance file contents.
        3. Apply the upsert or remove operation to the in-memory list.
        4. Write the updated list atomically via temp file and rename.
        5. Return a diff summary describing what changed.
      </steps>
      <postconditions>
        Governance file reflects the applied change. Prior content is not
        readable between write start and rename completion.
      </postconditions>
      <failure_modes>
        Input fails schema validation. Concurrent write detected. File system
        rename fails. Unsafe write would corrupt existing data.
      </failure_modes>
    </workflow>

    <workflow id="validate-readiness">
      <trigger>Actor calls chest.validate.ready with a plan description and optional ref.</trigger>
      <preconditions>
        .chest/ exists. definition-of-ready.yaml is present and valid.
        JudgeProvider is reachable or rule-based fallback is acceptable.
      </preconditions>
      <steps>
        1. Load and normalize the Definition of Ready criteria.
        2. Assemble a JudgeRequest from the plan text, DoR criteria, and any
           available OKR context.
        3. Call the configured JudgeProvider.
        4. Normalize the judge response into a ValidationReport.
        5. Persist the report under .chest/reports/.
        6. Return the ValidationReport.
      </steps>
      <postconditions>
        A ValidationReport with status passed, failed, or needs_review is
        persisted and returned.
      </postconditions>
      <failure_modes>
        DoR file absent or malformed. JudgeProvider unreachable. Judge response
        malformed after retries. Validation criteria not satisfied.
      </failure_modes>
    </workflow>

    <workflow id="validate-done">
      <trigger>
        Actor calls chest.validate.done with work evidence, optional plan ref,
        and optional pre-computed KPI results.
      </trigger>
      <preconditions>
        .chest/ exists. definition-of-done.yaml is present and valid.
        KPIs configured for any DoD criterion requiring them are present and
        runnable.
      </preconditions>
      <steps>
        1. Load and normalize the Definition of Done criteria.
        2. If any DoD criterion requires KPI evidence, run those KPIs now
           unless kpi_results were supplied.
        3. Assemble a JudgeRequest from work evidence, KPI evidence, DoD
           criteria, and OKR context.
        4. Call the configured JudgeProvider.
        5. Normalize the judge response into a ValidationReport.
        6. Persist the report under .chest/reports/.
        7. Return the ValidationReport.
      </steps>
      <postconditions>
        A ValidationReport persisted and returned. KPI evidence is embedded in
        the report evidence_refs.
      </postconditions>
      <failure_modes>
        DoD file absent or malformed. Required KPI command fails or times out.
        JudgeProvider unreachable. Judge response malformed. Validation not
        satisfied.
      </failure_modes>
    </workflow>

    <workflow id="run-kpis">
      <trigger>Actor calls chest.kpis.run or chest.kpis.run-all.</trigger>
      <preconditions>kpis.yaml is present and valid. Commands in KPI definitions are reachable.</preconditions>
      <steps>
        1. Load and normalize KPI definitions.
        2. For each targeted KPI, spawn the command in argv form.
        3. Capture exit code, stdout, and stderr within timeout_ms.
        4. Apply evidence_normalizer if configured.
        5. Return KPIEvidence records for each KPI run.
      </steps>
      <postconditions>
        Each KPI yields a KPIEvidence record. Nonzero exits are captured as
        evidence, not as unhandled process failures.
      </postconditions>
      <failure_modes>
        KPI command not found. Timeout exceeded. Output exceeds capture limit.
        Signal cancellation before completion.
      </failure_modes>
    </workflow>

    <workflow id="judge-alignment">
      <trigger>Actor calls chest.judge.align with a GovernanceSnapshot and evidence.</trigger>
      <preconditions>
        JudgeProvider is configured and reachable. GovernanceSnapshot is
        supplied or derivable from loaded governance files.
      </preconditions>
      <steps>
        1. Assemble the JudgeRequest from the governance snapshot and evidence.
        2. Call JudgeProvider with the assembled request.
        3. Validate the raw provider response matches the JudgeResponse shape.
        4. Retry on parse failure up to the configured retry limit.
        5. Normalize the validated response into a ValidationReport.
        6. Return the ValidationReport.
      </steps>
      <postconditions>
        ValidationReport returned with status, rationale, evidence_refs,
        confidence, and follow_ups populated.
      </postconditions>
      <failure_modes>
        JudgeProvider unreachable. Response malformed after retries. Response
        shape violates the JudgeResponse contract.
      </failure_modes>
    </workflow>

    <workflow id="fetch-report">
      <trigger>Actor calls chest.reports.list or chest.reports.get.</trigger>
      <preconditions>.chest/reports/ directory exists and contains persisted report files.</preconditions>
      <steps>
        1. Resolve .chest/reports/.
        2. For list: enumerate report files, apply filters (workflow, date), return summaries.
        3. For get: resolve the report by id, parse and return the full report.
      </steps>
      <postconditions>
        Caller receives one or more ValidationReport records or summaries.
      </postconditions>
      <failure_modes>
        Reports directory absent. Report file not found by id. Report file
        contents do not match report.v1 schema.
      </failure_modes>
    </workflow>
  </workflows>

  <inputs_outputs_summary>
    <row workflow="initialize"
         input="InitInput { force?: boolean, dir?: string }"
         output="InitResult { created: string[], skipped: string[] }"/>
    <row workflow="inspect-governance"
         input="ListInput | GetInput { id: string }"
         output="OKR[] | KPI[] | DoRCriterion[] | DoDCriterion[] | single record"/>
    <row workflow="edit-governance"
         input="UpsertInput { record } | RemoveInput { id: string }"
         output="WriteResult { op: 'inserted'|'updated'|'removed', id: string }"/>
    <row workflow="validate-readiness"
         input="ValidateReadyInput { plan: string, ref?: string }"
         output="ValidationReport"/>
    <row workflow="validate-done"
         input="ValidateDoneInput { work_evidence: string, plan_ref?: string, kpi_results?: KPIEvidence[] }"
         output="ValidationReport"/>
    <row workflow="run-kpis"
         input="RunKPIInput { id: string } | RunAllKPIsInput {}"
         output="KPIEvidence[]"/>
    <row workflow="judge-alignment"
         input="JudgeAlignInput { snapshot: GovernanceSnapshot, evidence: string }"
         output="ValidationReport"/>
    <row workflow="fetch-report"
         input="ListReportsInput { workflow?: string, since?: string } | GetReportInput { id: string }"
         output="ValidationReport[] | ValidationReport"/>
  </inputs_outputs_summary>

  <error_scenarios>
    <scenario id="invalid-yaml">
      A governance file cannot be parsed as YAML. The error must include the
      file path and the line number of the first parse failure.
    </scenario>
    <scenario id="missing-file">
      A governance file expected at a known path does not exist. The error
      must name the missing path and suggest running chest.init.
    </scenario>
    <scenario id="schema-shape-violation">
      A governance file parses as valid YAML but its structure does not match
      the expected schema. The error must name each invalid field with its
      path and the constraint that was violated.
    </scenario>
    <scenario id="kpi-command-timeout">
      A KPI command does not complete within timeout_ms. The error is captured
      as KPIEvidence with a timed_out flag; it does not throw an unhandled
      exception.
    </scenario>
    <scenario id="kpi-command-nonzero">
      A KPI command exits with a nonzero code. The exit code, stdout, and
      stderr are captured as KPIEvidence. Validation may still proceed and
      the evidence is passed to the judge.
    </scenario>
    <scenario id="judge-provider-unreachable">
      The JudgeProvider cannot be contacted. Chest returns a structured error
      with code ERR-CHEST-07. The validate-ready workflow may fall back to
      rule-based evaluation if configured.
    </scenario>
    <scenario id="judge-response-malformed">
      The JudgeProvider returns a response that does not parse or does not
      match the JudgeResponse shape. Chest retries up to the configured limit,
      then returns ERR-CHEST-08.
    </scenario>
    <scenario id="validation-not-satisfied">
      The judge returns a failed or needs_review status. This is a valid
      business outcome, not a system error. It is returned as a ValidationReport
      with follow_ups populated.
    </scenario>
    <scenario id="unsafe-write-conflict">
      A governance file was modified between the time it was read and the time
      an atomic rename would replace it. Chest detects the conflict and returns
      ERR-CHEST-05 without completing the write.
    </scenario>
  </error_scenarios>

  <acceptance_criteria>
    <ac id="AC-FUN-01" concept_ac="1">
      chest.init creates .chest/ with all four required governance files in a
      directory that did not previously contain a Chest store.
    </ac>
    <ac id="AC-FUN-02" concept_ac="1">
      chest.init refuses to overwrite an existing store unless force is true.
    </ac>
    <ac id="AC-FUN-03" concept_ac="2">
      chest.okrs.list, chest.kpis.list, chest.dor.list, and chest.dod.list
      each return a structured list of normalized domain records when the
      corresponding file is present and valid.
    </ac>
    <ac id="AC-FUN-04" concept_ac="2">
      Any read tool returns a diagnostic with file path and line context when
      the governance file is absent, unparseable, or shape-invalid.
    </ac>
    <ac id="AC-FUN-05" concept_ac="3">
      Every chest tool is callable over both MCP and CLI with the same input
      and produces the same structured output.
    </ac>
    <ac id="AC-FUN-06" concept_ac="4">
      chest.kpis.run captures exit code, stdout, and stderr for every invoked
      command, including commands that exit nonzero or time out.
    </ac>
    <ac id="AC-FUN-07" concept_ac="5">
      chest.judge.align assembles a JudgeRequest from governance criteria and
      evidence and calls the configured JudgeProvider.
    </ac>
    <ac id="AC-FUN-08" concept_ac="6">
      Every judge call produces a ValidationReport with status, rationale,
      evidence_refs, confidence, and follow_ups.
    </ac>
    <ac id="AC-FUN-09" concept_ac="7">
      chest.validate.ready evaluates a supplied plan against DoR criteria and
      returns a ValidationReport with status passed, failed, or needs_review.
    </ac>
    <ac id="AC-FUN-10" concept_ac="8">
      chest.validate.done evaluates work evidence against DoD criteria,
      incorporating KPI evidence when required, and returns a ValidationReport.
    </ac>
    <ac id="AC-FUN-11" concept_ac="9">
      All nine error scenario classes from this spec produce structured error
      output containing enough context for an agent to take corrective action
      without human clarification.
    </ac>
    <ac id="AC-FUN-12" concept_ac="2">
      chest.okrs.upsert, chest.kpis.upsert, chest.dor.upsert, and
      chest.dod.upsert persist changes atomically and return a diff summary.
    </ac>
    <ac id="AC-FUN-13" concept_ac="4">
      chest.kpis.run-all runs every configured KPI and returns a KPIEvidence
      array with one entry per KPI.
    </ac>
    <ac id="AC-FUN-14" concept_ac="6">
      chest.reports.list and chest.reports.get return persisted ValidationReport
      records filterable by workflow type and date.
    </ac>
  </acceptance_criteria>

  <glossary>
    <term name="OKR">
      Objective and Key Results. A goal-setting structure where an Objective
      describes the intended outcome and Key Results are measurable indicators
      of progress toward that objective.
    </term>
    <term name="KPI">
      Key Performance Indicator. A measurable signal with a configured command
      check that collects runtime evidence for use in validation.
    </term>
    <term name="DoR">
      Definition of Ready. A set of criteria that must be true before
      implementation begins. Used by validate-readiness.
    </term>
    <term name="DoD">
      Definition of Done. A set of criteria that must be true before work is
      reported complete. Used by validate-done.
    </term>
    <term name="validation report">
      The structured result of any Chest validation workflow. Contains status,
      rationale, evidence references, confidence score, and follow-up actions.
    </term>
    <term name="judge">
      The provider-agnostic LLM-as-judge component. Accepts a JudgeRequest and
      returns a JudgeResponse. The JudgeProvider port decouples the domain from
      any specific model vendor.
    </term>
    <term name="evidence">
      Captured artifacts used to support or refute a validation claim. Includes
      KPI command output (exit code, stdout, stderr) and free-text work
      descriptions supplied by the actor.
    </term>
    <term name="governance store">
      The .chest/ directory containing OKR, KPI, DoR, DoD, and report files for
      a given repository. Initialized by chest.init. Path overridable via the
      CHEST_HOME environment variable.
    </term>
  </glossary>

  <cross_references>
    <ref feature="initialize-storage" path="features/initialize-storage/functional.spec"/>
    <ref feature="read-governance-state" path="features/read-governance-state/functional.spec"/>
    <ref feature="write-governance-state" path="features/write-governance-state/functional.spec"/>
    <ref feature="validate-ready" path="features/validate-ready/functional.spec"/>
    <ref feature="validate-done" path="features/validate-done/functional.spec"/>
    <ref feature="run-kpi-checks" path="features/run-kpi-checks/functional.spec"/>
    <ref feature="judge-governance-alignment" path="features/judge-governance-alignment/functional.spec"/>
    <ref feature="validation-reports" path="features/validation-reports/functional.spec"/>
    <ref feature="ohtools-exposure" path="features/ohtools-exposure/functional.spec"/>
  </cross_references>

</spec>
