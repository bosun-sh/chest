<spec name="Write Governance State Test Specification" feature="write-governance-state" extends="../../test.spec">

  <fixtures_used>
    tests/fixtures/governance/valid/   (baseline for all write tests)
    Tests copy fixture files to a fresh tmp dir before each test.
  </fixtures_used>

  <test_cases>
    <test_case id="TC-WRITE-01" level="integration" covers="UC-WRITE-01 AC-WRITE-01">
      <given>
        .chest/okrs.yaml copied from valid fixture (two OKR records: okr-1, okr-2).
      </given>
      <input>
        {
          "record": {
            "id": "okr-3",
            "objective": "Improve test coverage",
            "keyResults": [
              { "id": "kr-5", "description": "Branch coverage above 90%", "target": "90%" }
            ]
          }
        }
      </input>
      <when>chest.okrs.upsert handler is called.</when>
      <expected_output>{ "ok": true, "data": { "op": "inserted", "id": "okr-3" } }</expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-WRITE-02" level="integration" covers="UC-WRITE-02 AC-WRITE-02">
      <given>
        .chest/okrs.yaml contains okr-1 with objective "Deliver chest v1 to production".
      </given>
      <input>
        {
          "record": {
            "id": "okr-1",
            "objective": "Deliver chest v1.1 to production",
            "keyResults": [
              { "id": "kr-1", "description": "All 30 spec files written", "target": "30 files" }
            ]
          }
        }
      </input>
      <when>chest.okrs.upsert handler is called.</when>
      <expected_output>{ "ok": true, "data": { "op": "updated", "id": "okr-1" } }</expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-WRITE-03" level="integration" covers="UC-WRITE-03 AC-WRITE-03">
      <given>
        .chest/okrs.yaml contains okr-1 and okr-2.
      </given>
      <input>{ "id": "okr-2" }</input>
      <when>chest.okrs.remove handler is called.</when>
      <expected_output>{ "ok": true, "data": { "op": "removed", "id": "okr-2" } }</expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-WRITE-04" level="unit" covers="UC-WRITE-05 ES-WRITE-01 AC-WRITE-04">
      <given>
        .chest/okrs.yaml exists (contents not inspected because error must fire before read).
      </given>
      <input>
        { "record": { "id": "okr-bad" } }
      </input>
      <when>chest.okrs.upsert handler is called with input missing objective and keyResults.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        {
          "ok": false,
          "error": {
            "code": "ERR-CHEST-04",
            "violations": [
              { "path": "record.objective", "constraint": "required field missing" },
              { "path": "record.keyResults", "constraint": "required field missing" }
            ]
          }
        }
      </expected_errors>
    </test_case>

    <test_case id="TC-WRITE-05" level="integration" covers="AC-WRITE-05">
      <given>
        .chest/okrs.yaml exists.
        After a successful upsert, verify that the file was written atomically
        by confirming the temp file no longer exists and the main file contains
        the updated content.
      </given>
      <input>
        {
          "record": {
            "id": "okr-atomic",
            "objective": "Atomic write test",
            "keyResults": [ { "id": "kr-a", "description": "Passes", "target": "yes" } ]
          }
        }
      </input>
      <when>chest.okrs.upsert handler completes.</when>
      <expected_output>{ "ok": true, "data": { "op": "inserted", "id": "okr-atomic" } }</expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-WRITE-06" level="integration" covers="UC-WRITE-04 AC-WRITE-06">
      <given>
        definition-of-ready.yaml contains dor-1 and dor-2.
      </given>
      <input>
        {
          "record": {
            "id": "dor-3",
            "text": "Plan specifies target audience",
            "severity": "advisory"
          }
        }
      </input>
      <when>chest.dor.upsert handler is called.</when>
      <expected_output>{ "ok": true, "data": { "op": "inserted", "id": "dor-3" } }</expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-WRITE-07" level="integration" covers="ES-WRITE-04">
      <given>
        .chest/okrs.yaml contains okr-1 and okr-2. No record with id okr-99.
      </given>
      <input>{ "id": "okr-99" }</input>
      <when>chest.okrs.remove handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        {
          "ok": false,
          "error": {
            "code": "ERR-CHEST-02",
            "message": "OKR with id 'okr-99' not found; nothing removed."
          }
        }
      </expected_errors>
    </test_case>
  </test_cases>

  <coverage_matrix>
    <row uc="UC-WRITE-01" tests="TC-WRITE-01"/>
    <row uc="UC-WRITE-02" tests="TC-WRITE-02"/>
    <row uc="UC-WRITE-03" tests="TC-WRITE-03"/>
    <row uc="UC-WRITE-04" tests="TC-WRITE-06"/>
    <row uc="UC-WRITE-05" tests="TC-WRITE-04"/>
  </coverage_matrix>

</spec>
