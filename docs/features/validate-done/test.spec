<spec name="Validate Done Test Specification" feature="validate-done" extends="../../test.spec">

  <fixtures_used>
    tests/fixtures/governance/valid/        (DoD with blocking criterion requiring kpi-1)
    tests/fixtures/governance/kpi-failing/  (kpi-failing exits 1)
    tests/doubles/fake-judge-provider.ts    (FakeJudgeProvider)
  </fixtures_used>

  <test_cases>
    <test_case id="TC-DONE-01" level="judge-contract" covers="UC-DONE-01 AC-DONE-01">
      <given>
        .chest/ initialized from valid fixture.
        definition-of-done.yaml:
          dod-1 (blocking, requires_kpi: kpi-1): "All tests pass"
          dod-2 (blocking): "Implementation matches plan"
        kpis.yaml: kpi-1 with command ["echo", "42 tests pass"], timeout_ms 5000.
        FakeJudgeProvider scripted to return:
          { status: "passed", rationale: "All DoD criteria met.",
            confidence: 0.94, followUps: [],
            evidenceRefs: [{ kind: "kpi", refId: "kpi-1", summary: "exit 0, 42 tests passed" }] }
      </given>
      <input>
        { "work_evidence": "Implemented chest.init. 42 tests pass. PR merged." }
      </input>
      <when>chest.validate.done handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "workflow": "done",
            "status": "passed",
            "rationale": "All DoD criteria met.",
            "confidence": 0.94,
            "followUps": [],
            "evidenceRefs": [{ "kind": "kpi", "refId": "kpi-1", "summary": "exit 0, 42 tests passed" }]
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-DONE-02" level="judge-contract" covers="UC-DONE-03 AC-DONE-02">
      <given>
        .chest/ initialized from kpi-failing fixture.
        kpi-failing command ["false"] exits 1.
        FakeJudgeProvider scripted to return:
          { status: "failed", rationale: "KPI kpi-failing exited 1.",
            confidence: 0.90, followUps: ["Fix failing tests before marking work done."],
            evidenceRefs: [{ kind: "kpi", refId: "kpi-failing", summary: "exit 1" }] }
      </given>
      <input>{ "work_evidence": "Tests were skipped due to CI timeout." }</input>
      <when>chest.validate.done handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "workflow": "done",
            "status": "failed",
            "rationale": "KPI kpi-failing exited 1.",
            "followUps": ["Fix failing tests before marking work done."]
          }
        }
      </expected_output>
      <expected_errors>None. Failed status is a business outcome.</expected_errors>
    </test_case>

    <test_case id="TC-DONE-03" level="judge-contract" covers="UC-DONE-02 AC-DONE-03">
      <given>
        .chest/ initialized from valid fixture.
        FakeJudgeProvider scripted to return passed.
      </given>
      <input>
        {
          "work_evidence": "Feature complete.",
          "kpi_results": [
            { "kpiId": "kpi-1", "exitCode": 0, "stdout": "42 pass", "stderr": "", "timedOut": false, "durationMs": 312 }
          ]
        }
      </input>
      <when>chest.validate.done handler is called with pre-supplied kpi_results.</when>
      <expected_output>
        { "ok": true, "data": { "workflow": "done", "status": "passed" } }
      </expected_output>
      <expected_errors>None. KPI commands not re-run when kpi_results supplied.</expected_errors>
    </test_case>

    <test_case id="TC-DONE-04" level="integration" covers="ES-DONE-01">
      <given>A temporary directory with no .chest/ directory.</given>
      <input>{ "work_evidence": "some work" }</input>
      <when>chest.validate.done handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        { "ok": false, "error": { "code": "ERR-CHEST-03", "message": "Governance file not found: &lt;path&gt;/.chest/definition-of-done.yaml." } }
      </expected_errors>
    </test_case>

    <test_case id="TC-DONE-05" level="integration" covers="ES-DONE-02 AC-DONE-04">
      <given>
        .chest/ initialized from valid fixture.
        dod-1 requires_kpi: "kpi-missing-cmd".
        kpis.yaml has kpi-missing-cmd with command ["__no_such_cmd__"], timeout_ms 5000.
      </given>
      <input>{ "work_evidence": "Work done." }</input>
      <when>chest.validate.done handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        { "ok": false, "error": { "code": "ERR-CHEST-06", "message": "KPI command not found: __no_such_cmd__" } }
      </expected_errors>
    </test_case>
  </test_cases>

  <coverage_matrix>
    <row uc="UC-DONE-01" tests="TC-DONE-01"/>
    <row uc="UC-DONE-02" tests="TC-DONE-03"/>
    <row uc="UC-DONE-03" tests="TC-DONE-02"/>
  </coverage_matrix>

</spec>
