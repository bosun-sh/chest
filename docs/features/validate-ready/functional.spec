<spec name="Validate Ready Functional Specification" feature="validate-ready" extends="../../functional.spec">

  <summary>
    The validate-ready slice evaluates a plan against the Definition of Ready
    criteria stored in .chest/. It loads DoR criteria, optionally loads OKRs
    for context, assembles a judge request in "ready" mode, calls the
    JudgeProvider, normalizes the response into a ValidationReport, persists it,
    and returns it. When the judge is unavailable, a rule-based fallback checks
    only blocking criteria.
  </summary>

  <use_cases>
    <use_case id="UC-RDY-01" actor="planning-agent" surface="both">
      <goal>Validate that a plan satisfies Definition of Ready before implementation begins.</goal>
      <preconditions>
        definition-of-ready.yaml is present and valid. JudgeProvider is reachable.
      </preconditions>
      <inputs>{ "plan": "Implement the chest.init tool per the spec in docs/features/initialize-storage/functional.spec." }</inputs>
      <steps>
        1. Load DoR criteria from definition-of-ready.yaml.
        2. Load OKRs for context (optional; empty list is acceptable).
        3. Assemble JudgeRequest: mode "ready", criteria = DoR list, evidence = plan text.
        4. Call JudgeProvider.judge.
        5. Normalize response to ValidationReport (workflow: "ready").
        6. Persist the report.
        7. Return the report.
      </steps>
      <outputs>
        {
          "workflow": "ready",
          "status": "passed",
          "rationale": "Plan includes acceptance criteria and identifies key risks.",
          "evidenceRefs": [
            { "kind": "plan", "refId": "dor-1", "summary": "Acceptance criteria present" },
            { "kind": "plan", "refId": "dor-2", "summary": "Risks identified" }
          ],
          "confidence": 0.91,
          "followUps": []
        }
      </outputs>
      <postconditions>ValidationReport persisted under .chest/reports/. Returned to caller.</postconditions>
    </use_case>

    <use_case id="UC-RDY-02" actor="planning-agent" surface="both">
      <goal>Detect that a plan is missing required criteria and receive actionable follow-ups.</goal>
      <preconditions>DoR criteria include blocking criteria for acceptance criteria and risks.</preconditions>
      <inputs>{ "plan": "Implement something." }</inputs>
      <steps>
        1–4. Same as UC-RDY-01.
        5. JudgeProvider returns status: failed with follow-up actions.
        6. Normalize to ValidationReport with followUps populated.
        7. Persist and return.
      </steps>
      <outputs>
        {
          "workflow": "ready",
          "status": "failed",
          "rationale": "Plan does not specify acceptance criteria or key risks.",
          "followUps": [
            "Add acceptance criteria to the plan.",
            "Identify at least one implementation risk."
          ]
        }
      </outputs>
      <postconditions>Report persisted. Caller has actionable next steps.</postconditions>
    </use_case>

    <use_case id="UC-RDY-03" actor="planning-agent" surface="both">
      <goal>
        Validate readiness when the judge is unavailable, using rule-based
        fallback that checks blocking criteria only.
      </goal>
      <preconditions>JudgeProvider is unreachable. DoR contains blocking and advisory criteria.</preconditions>
      <inputs>{ "plan": "Implement feature X with tests and acceptance criteria defined." }</inputs>
      <steps>
        1. Load DoR criteria.
        2. Call JudgeProvider; it returns ERR-CHEST-07.
        3. Apply rule-based fallback: scan plan text for presence of keywords
           associated with each blocking criterion.
        4. If all blocking criteria appear satisfied by keyword scan, return
           ValidationReport with status: needs_review and confidence: null.
        5. If any blocking criterion is clearly absent, return status: failed.
        6. Persist and return the report.
      </steps>
      <outputs>
        {
          "workflow": "ready",
          "status": "needs_review",
          "rationale": "Judge unavailable; rule-based check passed blocking criteria. Human review recommended.",
          "followUps": ["Judge provider was unreachable. Consider re-running when available."]
        }
      </outputs>
      <postconditions>Report persisted with status needs_review.</postconditions>
    </use_case>
  </use_cases>

  <error_scenarios>
    <scenario id="ES-RDY-01" ref="ERR-CHEST-03">
      <trigger>definition-of-ready.yaml does not exist.</trigger>
      <observable>
        ERR-CHEST-03 with the missing file path and suggestion to run chest.init.
      </observable>
    </scenario>
    <scenario id="ES-RDY-02" ref="ERR-CHEST-01">
      <trigger>definition-of-ready.yaml contains invalid YAML.</trigger>
      <observable>ERR-CHEST-01 with file path and line number.</observable>
    </scenario>
    <scenario id="ES-RDY-03" ref="ERR-CHEST-07">
      <trigger>JudgeProvider unreachable and rule-based fallback is disabled.</trigger>
      <observable>ERR-CHEST-07 with provider context.</observable>
    </scenario>
  </error_scenarios>

  <acceptance_criteria>
    <ac id="AC-RDY-01" rolls_up_to="AC-FUN-09">
      chest.validate.ready evaluates a plan against DoR criteria and returns a
      ValidationReport with status passed when all criteria are met.
    </ac>
    <ac id="AC-RDY-02" rolls_up_to="AC-FUN-09">
      chest.validate.ready returns a ValidationReport with status failed and
      populated followUps when blocking DoR criteria are not satisfied.
    </ac>
    <ac id="AC-RDY-03" rolls_up_to="AC-FUN-09">
      chest.validate.ready returns a ValidationReport with status needs_review
      when the judge is unavailable and the rule-based fallback passes blocking
      criteria.
    </ac>
    <ac id="AC-RDY-04" rolls_up_to="AC-FUN-11">
      chest.validate.ready returns ERR-CHEST-03 with actionable path context
      when definition-of-ready.yaml is absent.
    </ac>
  </acceptance_criteria>

  <out_of_scope>
    Evaluating work completion (that is validate-done).
    Running KPI checks during readiness validation.
    Blocking human review in the rule-based fallback path.
  </out_of_scope>

</spec>
