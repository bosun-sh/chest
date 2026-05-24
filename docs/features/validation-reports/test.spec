<spec name="Validation Reports Test Specification" feature="validation-reports" extends="../../test.spec">

  <fixtures_used>
    tests/fixtures/governance/valid/  (used as base for integration tests that
    run validate-ready or validate-done to produce report files).
    Inline report JSON objects constructed in unit tests.
    tests/doubles/fake-judge-provider.ts (to produce reports without real judge).
  </fixtures_used>

  <test_cases>
    <test_case id="TC-REP-01" level="integration" covers="AC-REP-01">
      <given>
        .chest/ initialized from valid fixture.
        chest.validate.ready handler called with FakeJudgeProvider returning passed.
      </given>
      <input>{ "plan": "Implement chest.init with all acceptance criteria." }</input>
      <when>
        chest.validate.ready completes successfully.
        Then .chest/reports/ is inspected.
      </when>
      <expected_output>
        .chest/reports/ contains exactly one file matching the pattern
        "&lt;ISO-timestamp&gt;-ready.json".
        The file parses to a ValidationReport with workflow "ready" and status "passed".
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-REP-02" level="integration" covers="UC-REP-01 UC-REP-02 AC-REP-02 AC-REP-03">
      <given>
        .chest/reports/ contains two pre-written report files:
          2026-05-22T09-00-00Z-done.json  (status: failed)
          2026-05-23T10-00-00Z-ready.json (status: passed)
      </given>
      <input>{}  (chest.reports.list, no filter)</input>
      <when>chest.reports.list handler is called without filter.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "items": [
              { "id": "rep-2026-05-23T10-00-00Z-ready", "workflow": "ready", "timestamp": "2026-05-23T10:00:00Z", "status": "passed" },
              { "id": "rep-2026-05-22T09-00-00Z-done",  "workflow": "done",  "timestamp": "2026-05-22T09:00:00Z", "status": "failed" }
            ]
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-REP-03" level="integration" covers="UC-REP-03 AC-REP-04">
      <given>
        Same two report files as TC-REP-02.
      </given>
      <input>{ "id": "rep-2026-05-23T10-00-00Z-ready" }</input>
      <when>chest.reports.get handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "id": "rep-2026-05-23T10-00-00Z-ready",
            "workflow": "ready",
            "timestamp": "2026-05-23T10:00:00Z",
            "status": "passed",
            "rationale": "Plan satisfies all DoR criteria.",
            "evidenceRefs": [{ "kind": "plan", "refId": "dor-1", "summary": "AC present" }],
            "confidence": 0.91,
            "followUps": []
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-REP-04" level="integration" covers="UC-REP-02 AC-REP-03">
      <given>
        Same two report files as TC-REP-02.
      </given>
      <input>{ "workflow": "ready" }</input>
      <when>chest.reports.list handler is called with workflow filter "ready".</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "items": [
              { "id": "rep-2026-05-23T10-00-00Z-ready", "workflow": "ready", "timestamp": "2026-05-23T10:00:00Z", "status": "passed" }
            ]
          }
        }
      </expected_output>
      <expected_errors>None. The "done" report is excluded by the filter.</expected_errors>
    </test_case>

    <test_case id="TC-REP-05" level="integration" covers="ES-REP-01 AC-REP-05">
      <given>
        .chest/reports/ exists but contains no report matching id "rep-nonexistent".
      </given>
      <input>{ "id": "rep-nonexistent" }</input>
      <when>chest.reports.get handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        {
          "ok": false,
          "error": {
            "code": "ERR-CHEST-09",
            "message": "Report 'rep-nonexistent' not found in &lt;path&gt;/.chest/reports/."
          }
        }
      </expected_errors>
    </test_case>
  </test_cases>

  <coverage_matrix>
    <row uc="UC-REP-01" tests="TC-REP-02"/>
    <row uc="UC-REP-02" tests="TC-REP-04"/>
    <row uc="UC-REP-03" tests="TC-REP-03"/>
  </coverage_matrix>

</spec>
