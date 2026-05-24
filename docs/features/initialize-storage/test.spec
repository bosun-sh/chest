<spec name="Initialize Storage Test Specification" feature="initialize-storage" extends="../../test.spec">

  <fixtures_used>
    tests/fixtures/governance/valid/ (as baseline for force-overwrite tests).
    No fixture needed for fresh-directory tests; those use tmpdir.
  </fixtures_used>

  <test_cases>
    <test_case id="TC-INIT-01" level="integration" covers="UC-INIT-01 AC-INIT-01">
      <given>A temporary directory with no .chest/ subdirectory.</given>
      <input>{ "dir": "/tmp/chest-test-&lt;unique&gt;" }</input>
      <when>chest.init handler is called with the above input.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "created": [
              "/tmp/chest-test-&lt;unique&gt;/.chest/okrs.yaml",
              "/tmp/chest-test-&lt;unique&gt;/.chest/kpis.yaml",
              "/tmp/chest-test-&lt;unique&gt;/.chest/definition-of-ready.yaml",
              "/tmp/chest-test-&lt;unique&gt;/.chest/definition-of-done.yaml"
            ],
            "skipped": []
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-INIT-02" level="integration" covers="UC-INIT-03 AC-INIT-02">
      <given>A temporary directory where .chest/ already exists with valid governance files.</given>
      <input>{ "dir": "/tmp/chest-test-existing" }</input>
      <when>chest.init handler is called without force.</when>
      <expected_output>None (error is returned instead).</expected_output>
      <expected_errors>
        {
          "ok": false,
          "error": {
            "code": "ERR-CHEST-10",
            "message": "Chest store already exists at /tmp/chest-test-existing/.chest. Pass force: true to overwrite."
          }
        }
      </expected_errors>
    </test_case>

    <test_case id="TC-INIT-03" level="integration" covers="UC-INIT-02 AC-INIT-03">
      <given>A temporary directory where .chest/ already exists with modified governance files.</given>
      <input>{ "dir": "/tmp/chest-test-force", "force": true }</input>
      <when>chest.init handler is called with force: true.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "created": [
              "/tmp/chest-test-force/.chest/okrs.yaml",
              "/tmp/chest-test-force/.chest/kpis.yaml",
              "/tmp/chest-test-force/.chest/definition-of-ready.yaml",
              "/tmp/chest-test-force/.chest/definition-of-done.yaml"
            ],
            "skipped": []
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-INIT-04" level="integration" covers="ES-INIT-02 AC-INIT-04">
      <given>A path that does not exist and cannot be created (e.g., /nonexistent/deep/path on a read-only fs or a path inside a file).</given>
      <input>{ "dir": "/dev/null/cannot-create" }</input>
      <when>chest.init handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        {
          "ok": false,
          "error": {
            "code": "ERR-CHEST-03",
            "message": "Cannot write to /dev/null/cannot-create/.chest: &lt;os error&gt;"
          }
        }
      </expected_errors>
    </test_case>

    <test_case id="TC-INIT-05" level="unit" covers="UC-INIT-01">
      <given>Four YAML files are written by TC-INIT-01.</given>
      <input>Read each created file after TC-INIT-01.</input>
      <when>Each file is parsed as YAML.</when>
      <expected_output>
        Each file parses to an empty array: []. No YAML parse errors.
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>
  </test_cases>

  <coverage_matrix>
    <row uc="UC-INIT-01" tests="TC-INIT-01,TC-INIT-05"/>
    <row uc="UC-INIT-02" tests="TC-INIT-03"/>
    <row uc="UC-INIT-03" tests="TC-INIT-02"/>
  </coverage_matrix>

</spec>
