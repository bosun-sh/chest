<spec name="Validate Ready Test Specification" feature="validate-ready" extends="../../test.spec">

  <fixtures_used>
    tests/fixtures/governance/valid/        (DoR with blocking + advisory criteria)
    tests/fixtures/governance/missing-keys/ (malformed DoR for error tests)
    tests/doubles/fake-judge-provider.ts    (FakeJudgeProvider)
  </fixtures_used>

  <test_cases>
    <test_case id="TC-RDY-01" level="judge-contract" covers="UC-RDY-01 AC-RDY-01">
      <given>
        .chest/ initialized from valid fixture.
        definition-of-ready.yaml has two criteria:
          dor-1 (blocking): "Plan includes acceptance criteria"
          dor-2 (advisory): "Plan identifies key risks"
        FakeJudgeProvider scripted to return:
          { status: "passed", rationale: "AC and risks present.", confidence: 0.91,
            followUps: [], evidenceRefs: [
              { kind: "plan", refId: "dor-1", summary: "Acceptance criteria present" }
            ] }
      </given>
      <input>
        {
          "plan": "Implement chest.init. Acceptance criteria: creates .chest/. Risk: write permissions."
        }
      </input>
      <when>chest.validate.ready handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "workflow": "ready",
            "status": "passed",
            "rationale": "AC and risks present.",
            "confidence": 0.91,
            "followUps": []
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-RDY-02" level="judge-contract" covers="UC-RDY-02 AC-RDY-02">
      <given>
        Same .chest/ setup as TC-RDY-01.
        FakeJudgeProvider scripted to return:
          { status: "failed", rationale: "No acceptance criteria found.",
            confidence: 0.88, followUps: ["Add acceptance criteria.", "Add risk analysis."],
            evidenceRefs: [] }
      </given>
      <input>{ "plan": "Implement something." }</input>
      <when>chest.validate.ready handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "workflow": "ready",
            "status": "failed",
            "rationale": "No acceptance criteria found.",
            "followUps": ["Add acceptance criteria.", "Add risk analysis."]
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-RDY-03" level="judge-contract" covers="UC-RDY-03 AC-RDY-03">
      <given>
        Same .chest/ setup.
        FakeJudgeProvider scripted with { throws: true } to simulate
        provider unreachability.
        Plan text contains keywords matching all blocking DoR criteria.
      </given>
      <input>
        {
          "plan": "Implement feature X. Acceptance criteria: tests pass. Risk: breaking change."
        }
      </input>
      <when>chest.validate.ready handler is called. Judge is unavailable; fallback activates.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "workflow": "ready",
            "status": "needs_review",
            "rationale": "Judge unavailable; rule-based check passed blocking criteria. Human review recommended.",
            "followUps": ["Judge provider was unreachable. Consider re-running when available."]
          }
        }
      </expected_output>
      <expected_errors>None. Fallback path produces a ToolResult report rather than an error.</expected_errors>
    </test_case>

    <test_case id="TC-RDY-04" level="integration" covers="ES-RDY-01 AC-RDY-04">
      <given>A temporary directory with no .chest/ directory.</given>
      <input>{ "plan": "some plan" }</input>
      <when>chest.validate.ready handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        {
          "ok": false,
          "error": {
            "code": "ERR-CHEST-03",
            "message": "Governance file not found: &lt;path&gt;/.chest/definition-of-ready.yaml. Run chest.init."
          }
        }
      </expected_errors>
    </test_case>
  </test_cases>

  <coverage_matrix>
    <row uc="UC-RDY-01" tests="TC-RDY-01"/>
    <row uc="UC-RDY-02" tests="TC-RDY-02"/>
    <row uc="UC-RDY-03" tests="TC-RDY-03"/>
  </coverage_matrix>

</spec>
