<spec name="Judge Governance Alignment Functional Specification" feature="judge-governance-alignment" extends="../../functional.spec">

  <summary>
    The judge-governance-alignment slice orchestrates provider-agnostic
    LLM-as-judge evaluation. It accepts a GovernanceSnapshot and evidence,
    assembles a JudgeRequest, calls the configured JudgeProvider, validates and
    normalizes the response, retries on malformed output, and returns a
    ValidationReport. The domain never references a specific LLM vendor.
  </summary>

  <use_cases>
    <use_case id="UC-JUDGE-01" actor="implementing-agent" surface="both">
      <goal>
        Evaluate whether a plan or completed work aligns with OKRs and
        governance criteria.
      </goal>
      <preconditions>
        JudgeProvider is configured and reachable. GovernanceSnapshot is
        loadable or supplied.
      </preconditions>
      <inputs>
        {
          "snapshot": {
            "okrs": [ { "id": "okr-1", "objective": "...", "keyResults": [...] } ],
            "kpis": [],
            "dor": [],
            "dod": []
          },
          "evidence": "Implemented feature X per plan Y. All tests pass."
        }
      </inputs>
      <steps>
        1. Assemble JudgeRequest from mode "align", snapshot criteria, and evidence.
        2. Call JudgeProvider.judge(request).
        3. Validate the returned JudgeResponse shape.
        4. Normalize into ValidationReport (workflow: "align").
        5. Persist the report.
        6. Return the ValidationReport.
      </steps>
      <outputs>
        {
          "id": "rep-&lt;timestamp&gt;-align",
          "workflow": "align",
          "timestamp": "2026-05-23T10:00:00Z",
          "status": "passed",
          "rationale": "The implementation satisfies all stated OKR key results.",
          "evidenceRefs": [ { "kind": "okr", "refId": "okr-1", "summary": "Objective met" } ],
          "confidence": 0.92,
          "followUps": []
        }
      </outputs>
      <postconditions>
        ValidationReport persisted under .chest/reports/. Returned to caller.
      </postconditions>
    </use_case>

    <use_case id="UC-JUDGE-02" actor="implementing-agent" surface="both">
      <goal>Receive a failed alignment result with follow-up actions.</goal>
      <preconditions>JudgeProvider returns a "failed" status for the evidence.</preconditions>
      <inputs>
        {
          "snapshot": { "okrs": [...], "kpis": [], "dor": [], "dod": [] },
          "evidence": "Work was started but tests are not yet written."
        }
      </inputs>
      <steps>
        1–5. Same as UC-JUDGE-01.
        6. JudgeProvider returns status: failed with follow_ups.
        7. Normalize into ValidationReport with follow_ups populated.
        8. Return report (not an error; failed alignment is a business outcome).
      </steps>
      <outputs>
        {
          "status": "failed",
          "rationale": "Evidence does not demonstrate test coverage.",
          "evidenceRefs": [],
          "confidence": 0.85,
          "followUps": ["Add unit tests covering the new feature.", "Re-run chest.validate.done."]
        }
      </outputs>
      <postconditions>Report persisted. Caller receives structured follow-ups.</postconditions>
    </use_case>

    <use_case id="UC-JUDGE-03" actor="implementing-agent" surface="both">
      <goal>Handle a malformed judge response by retrying and eventually erroring.</goal>
      <preconditions>JudgeProvider returns invalid JSON or a shape that does not match JudgeResponse.</preconditions>
      <inputs>
        { "snapshot": {...}, "evidence": "..." }
      </inputs>
      <steps>
        1. Call JudgeProvider.judge(request).
        2. Response is not valid JudgeResponse shape.
        3. Retry up to 2 additional times (3 total attempts).
        4. All attempts return malformed output.
        5. Return ERR-CHEST-08.
      </steps>
      <outputs>{ ok: false, error: { code: "ERR-CHEST-08", message: "Judge response malformed after 3 attempts." } }</outputs>
      <postconditions>No report is persisted. Tool returns { ok: false, error: { code: "ERR-CHEST-08", ... } } to caller.</postconditions>
    </use_case>
  </use_cases>

  <error_scenarios>
    <scenario id="ES-JUDGE-01" ref="ERR-CHEST-07">
      <trigger>JudgeProvider is unreachable (network error, HTTP 5xx, connection refused).</trigger>
      <observable>
        ERR-CHEST-07 with provider name and the underlying network error.
        No report is persisted.
      </observable>
    </scenario>
    <scenario id="ES-JUDGE-02" ref="ERR-CHEST-08">
      <trigger>
        JudgeProvider responds but the JSON body is malformed or does not match
        JudgeResponse shape after all retry attempts.
      </trigger>
      <observable>
        ERR-CHEST-08 with the raw response excerpt and the shape validation
        error. No report is persisted.
      </observable>
    </scenario>
  </error_scenarios>

  <acceptance_criteria>
    <ac id="AC-JUDGE-01" rolls_up_to="AC-FUN-07">
      chest.judge.align assembles a JudgeRequest from the supplied snapshot
      and evidence and calls JudgeProvider.judge.
    </ac>
    <ac id="AC-JUDGE-02" rolls_up_to="AC-FUN-08">
      chest.judge.align returns a ValidationReport with status, rationale,
      evidenceRefs, confidence, and followUps for both passed and failed
      provider responses.
    </ac>
    <ac id="AC-JUDGE-03" rolls_up_to="AC-FUN-08">
      A needs_review status from the provider is preserved in the
      ValidationReport without being coerced to passed or failed.
    </ac>
    <ac id="AC-JUDGE-04" rolls_up_to="AC-FUN-11">
      chest.judge.align retries up to 2 times on malformed provider responses
      before returning ERR-CHEST-08.
    </ac>
    <ac id="AC-JUDGE-05" rolls_up_to="AC-FUN-11">
      chest.judge.align returns ERR-CHEST-07 on provider unreachability,
      including the provider error context.
    </ac>
  </acceptance_criteria>

  <out_of_scope>
    Choosing or configuring a specific LLM provider (the OpenAIJudgeAdapter is
    a reference implementation in src/judge/providers/openai/; the domain does
    not reference it).
    Storing the prompt or raw provider response in the validation report.
    Rate limiting or cost tracking.
  </out_of_scope>

</spec>
