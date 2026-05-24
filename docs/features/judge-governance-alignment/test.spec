<spec name="Judge Governance Alignment Test Specification" feature="judge-governance-alignment" extends="../../test.spec">

  <fixtures_used>
    tests/fixtures/governance/valid/  (okrs, dor, dod as snapshot source)
    tests/doubles/fake-judge-provider.ts (FakeJudgeProvider)
    tests/integration/openai-adapter.test.ts (gated, uses recorded HTTP fixture)
  </fixtures_used>

  <test_cases>
    <test_case id="TC-JUDGE-01" level="judge-contract" covers="UC-JUDGE-01 AC-JUDGE-01 AC-JUDGE-02">
      <given>
        FakeJudgeProvider scripted to return:
        { status: "passed", rationale: "Evidence meets OKR key results.",
          confidence: 0.92, followUps: [], evidenceRefs: [{ kind: "okr", refId: "okr-1", summary: "Objective met" }] }
      </given>
      <input>
        {
          "snapshot": {
            "okrs": [{ "id": "okr-1", "objective": "Deliver chest v1", "keyResults": [{ "id": "kr-1", "description": "30 specs", "target": "30 files" }] }],
            "kpis": [], "dor": [], "dod": []
          },
          "evidence": "All 30 spec files have been authored and verified."
        }
      </input>
      <when>chest.judge.align handler is called with FakeJudgeProvider.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "workflow": "align",
            "status": "passed",
            "rationale": "Evidence meets OKR key results.",
            "confidence": 0.92,
            "followUps": [],
            "evidenceRefs": [{ "kind": "okr", "refId": "okr-1", "summary": "Objective met" }]
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-JUDGE-02" level="judge-contract" covers="UC-JUDGE-02 AC-JUDGE-02">
      <given>
        FakeJudgeProvider scripted to return:
        { status: "failed", rationale: "No test evidence found.", confidence: 0.88,
          followUps: ["Add tests.", "Re-run validate.done."], evidenceRefs: [] }
      </given>
      <input>
        {
          "snapshot": { "okrs": [...], "kpis": [], "dor": [], "dod": [] },
          "evidence": "Implementation started, tests not yet written."
        }
      </input>
      <when>chest.judge.align handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "workflow": "align",
            "status": "failed",
            "rationale": "No test evidence found.",
            "followUps": ["Add tests.", "Re-run validate.done."]
          }
        }
      </expected_output>
      <expected_errors>None. "failed" is a business outcome, not a system error.</expected_errors>
    </test_case>

    <test_case id="TC-JUDGE-03" level="judge-contract" covers="AC-JUDGE-03">
      <given>
        FakeJudgeProvider scripted to return:
        { status: "needs_review", rationale: "Confidence too low to auto-pass.",
          confidence: 0.55, followUps: ["Human review recommended."], evidenceRefs: [] }
      </given>
      <input>
        { "snapshot": { "okrs": [...], "kpis": [], "dor": [], "dod": [] }, "evidence": "Partial work." }
      </input>
      <when>chest.judge.align handler is called.</when>
      <expected_output>
        { "ok": true, "data": { "status": "needs_review", "confidence": 0.55, "followUps": ["Human review recommended."] } }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-JUDGE-04" level="judge-contract" covers="UC-JUDGE-03 AC-JUDGE-04">
      <given>
        FakeJudgeProvider scripted with { malformed: true } so each call
        returns a string that fails JudgeResponse shape validation.
      </given>
      <input>
        { "snapshot": { "okrs": [], "kpis": [], "dor": [], "dod": [] }, "evidence": "some evidence" }
      </input>
      <when>chest.judge.align handler is called. All 3 attempts return malformed output.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        { "ok": false, "error": { "code": "ERR-CHEST-08", "message": "Judge response malformed after 3 attempts." } }
      </expected_errors>
    </test_case>

    <test_case id="TC-JUDGE-05" level="judge-contract" covers="ES-JUDGE-01 AC-JUDGE-05">
      <given>
        FakeJudgeProvider scripted with { throws: true } to simulate provider
        unreachability.
      </given>
      <input>
        { "snapshot": { "okrs": [], "kpis": [], "dor": [], "dod": [] }, "evidence": "test" }
      </input>
      <when>chest.judge.align handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        { "ok": false, "error": { "code": "ERR-CHEST-07", "message": "Judge provider unreachable: &lt;provider error&gt;" } }
      </expected_errors>
    </test_case>

    <test_case id="TC-JUDGE-06" level="contract" covers="AC-JUDGE-01">
      <given>
        OpenAI adapter test, gated behind CHEST_TEST_OPENAI_ADAPTER=1.
        Recorded HTTP fixture returns a valid JSON-mode response.
      </given>
      <input>
        JudgeRequest with mode "align", one OKR criterion, and evidence "test passed".
      </input>
      <when>OpenAIJudgeAdapter.judge is called with the recorded fixture intercepted.</when>
      <expected_output>
        A valid JudgeResponse with status one of [passed, failed, needs_review].
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>
  </test_cases>

  <coverage_matrix>
    <row uc="UC-JUDGE-01" tests="TC-JUDGE-01"/>
    <row uc="UC-JUDGE-02" tests="TC-JUDGE-02"/>
    <row uc="UC-JUDGE-03" tests="TC-JUDGE-04"/>
  </coverage_matrix>

</spec>
