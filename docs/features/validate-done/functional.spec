<spec name="Validate Done Functional Specification" feature="validate-done" extends="../../functional.spec">

  <summary>
    The validate-done slice evaluates completed work against the Definition of
    Done criteria stored in .chest/. It loads DoD criteria, runs any required
    KPI checks unless pre-computed results are supplied, assembles a judge
    request in "done" mode with KPI evidence included, calls the JudgeProvider,
    normalizes the response into a ValidationReport, persists it, and returns it.
  </summary>

  <use_cases>
    <use_case id="UC-DONE-01" actor="implementing-agent" surface="both">
      <goal>Validate that completed work satisfies Definition of Done.</goal>
      <preconditions>
        definition-of-done.yaml is present and valid. KPIs referenced by any
        DoD criterion are present and runnable. JudgeProvider is reachable.
      </preconditions>
      <inputs>
        {
          "work_evidence": "Implemented chest.init. All tests pass (42/42). TypeCheck passes. PR #5 merged."
        }
      </inputs>
      <steps>
        1. Load DoD criteria from definition-of-done.yaml.
        2. Identify DoD criteria with requires_kpi set.
        3. Load KPI definitions for each required KPI.
        4. Run each required KPI via KPIRunner.
        5. Load OKRs for context.
        6. Assemble JudgeRequest: mode "done", criteria = dod, okrs, evidence =
           work_evidence, kpiEvidence = run results.
        7. Call JudgeProvider.judge.
        8. Normalize to ValidationReport (workflow "done").
        9. Persist the report.
        10. Return the report.
      </steps>
      <outputs>
        {
          "workflow": "done",
          "status": "passed",
          "rationale": "All DoD criteria satisfied. KPI kpi-1 passed.",
          "evidenceRefs": [
            { "kind": "kpi", "refId": "kpi-1", "summary": "exit 0, 42 tests passed" },
            { "kind": "work_evidence", "refId": "dod-2", "summary": "Plan alignment confirmed" }
          ],
          "confidence": 0.94,
          "followUps": []
        }
      </outputs>
      <postconditions>ValidationReport persisted under .chest/reports/.</postconditions>
    </use_case>

    <use_case id="UC-DONE-02" actor="implementing-agent" surface="both">
      <goal>Submit pre-computed KPI results to avoid re-running checks.</goal>
      <preconditions>
        Caller has already run KPI checks and has KPIEvidence array.
      </preconditions>
      <inputs>
        {
          "work_evidence": "Feature complete.",
          "kpi_results": [
            { "kpiId": "kpi-1", "exitCode": 0, "stdout": "42 pass", "stderr": "", "timedOut": false, "durationMs": 312 }
          ]
        }
      </inputs>
      <steps>
        1. Load DoD criteria.
        2. Skip KPI execution because kpi_results is supplied.
        3. Assemble JudgeRequest with supplied kpiEvidence.
        4. Call judge and normalize response.
        5. Persist and return report.
      </steps>
      <outputs>Same shape as UC-DONE-01 output.</outputs>
      <postconditions>KPIs not re-run. Supplied evidence used directly.</postconditions>
    </use_case>

    <use_case id="UC-DONE-03" actor="ci-runner" surface="cli">
      <goal>Detect that a DoD criterion is not met and receive follow-up actions.</goal>
      <preconditions>Judge returns failed because a required KPI exited nonzero.</preconditions>
      <inputs>{ "work_evidence": "Tests were skipped due to CI timeout." }</inputs>
      <steps>
        1–7. Same as UC-DONE-01.
        8. JudgeProvider returns status: failed because KPI kpi-1 exited 1.
        9. Normalize to ValidationReport with follow_ups.
        10. Persist and return.
      </steps>
      <outputs>
        {
          "workflow": "done",
          "status": "failed",
          "rationale": "KPI kpi-1 exited 1; test failures detected.",
          "followUps": ["Fix failing tests before marking work done."]
        }
      </outputs>
      <postconditions>Report persisted with status failed.</postconditions>
    </use_case>
  </use_cases>

  <error_scenarios>
    <scenario id="ES-DONE-01" ref="ERR-CHEST-03">
      <trigger>definition-of-done.yaml does not exist.</trigger>
      <observable>ERR-CHEST-03 with the missing file path and init suggestion.</observable>
    </scenario>
    <scenario id="ES-DONE-02" ref="ERR-CHEST-06">
      <trigger>A KPI command required by a DoD criterion is not found on PATH.</trigger>
      <observable>
        ERR-CHEST-06 identifying the KPI id and command. Validation is aborted;
        no report is persisted.
      </observable>
    </scenario>
    <scenario id="ES-DONE-03" ref="ERR-CHEST-07">
      <trigger>JudgeProvider is unreachable and no fallback is configured for done validation.</trigger>
      <observable>ERR-CHEST-07 with provider context.</observable>
    </scenario>
  </error_scenarios>

  <acceptance_criteria>
    <ac id="AC-DONE-01" rolls_up_to="AC-FUN-10">
      chest.validate.done loads DoD criteria, runs required KPIs, and returns
      a ValidationReport with status passed when all criteria are satisfied.
    </ac>
    <ac id="AC-DONE-02" rolls_up_to="AC-FUN-10">
      chest.validate.done returns a ValidationReport with status failed and
      followUps when a required KPI exits nonzero and the judge determines
      DoD criteria are not met.
    </ac>
    <ac id="AC-DONE-03" rolls_up_to="AC-FUN-10">
      chest.validate.done accepts pre-computed kpi_results and does not re-run
      KPI commands when they are supplied.
    </ac>
    <ac id="AC-DONE-04" rolls_up_to="AC-FUN-11">
      chest.validate.done returns ERR-CHEST-06 with the KPI id when a required
      KPI command is not found.
    </ac>
  </acceptance_criteria>

  <out_of_scope>
    Validating plan readiness (that is validate-ready).
    Running all KPIs unconditionally (done validation runs only the KPIs
    required by DoD criteria unless the caller supplies kpi_results for all).
    Rule-based fallback for done validation in v1.
  </out_of_scope>

</spec>
