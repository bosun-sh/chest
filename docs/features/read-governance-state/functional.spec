<spec name="Read Governance State Functional Specification" feature="read-governance-state" extends="../../functional.spec">

  <summary>
    The read-governance-state slice lets actors inspect the current OKRs, KPIs,
    Definition of Ready, and Definition of Done stored in .chest/. All reads are
    pure: they load, parse, validate, and normalize the relevant YAML file and
    return structured domain records. Reads never mutate the governance store.
    Actionable diagnostics are returned for any file that is absent,
    unparseable, or shape-invalid.
  </summary>

  <use_cases>
    <use_case id="UC-READ-01" actor="planning-agent" surface="both">
      <goal>List all OKRs in the governance store.</goal>
      <preconditions>.chest/okrs.yaml is present and valid.</preconditions>
      <inputs>{}</inputs>
      <steps>
        1. Resolve .chest/okrs.yaml path.
        2. Read and parse the file as YAML.
        3. Validate the parsed value against okrs.v1 schema.
        4. Normalize to OKR[] domain objects.
        5. Return the normalized list.
      </steps>
      <outputs>
        { "items": [ { "id": "okr-1", "objective": "...", "keyResults": [...] } ] }
      </outputs>
      <postconditions>No files written. .chest/ state unchanged.</postconditions>
    </use_case>

    <use_case id="UC-READ-02" actor="planning-agent" surface="both">
      <goal>Get a single OKR by ID.</goal>
      <preconditions>.chest/okrs.yaml is present and valid. Requested ID exists.</preconditions>
      <inputs>{ "id": "okr-1" }</inputs>
      <steps>
        1. Load and normalize OKR list (same as UC-READ-01 steps 1–4).
        2. Find the record with matching id.
        3. Return the single normalized OKR.
      </steps>
      <outputs>
        { "id": "okr-1", "objective": "...", "keyResults": [ { "id": "kr-1", "description": "...", "target": "..." } ] }
      </outputs>
      <postconditions>No files written.</postconditions>
    </use_case>

    <use_case id="UC-READ-03" actor="planning-agent" surface="both">
      <goal>List all KPIs configured for the project.</goal>
      <preconditions>.chest/kpis.yaml is present and valid.</preconditions>
      <inputs>{}</inputs>
      <steps>
        1. Resolve .chest/kpis.yaml.
        2. Parse, validate against kpis.v1, normalize to KPI[].
        3. Return the list.
      </steps>
      <outputs>{ "items": [ { "id": "kpi-1", "name": "...", "target": "...", "command": [...], "timeoutMs": 5000 } ] }</outputs>
      <postconditions>No files written.</postconditions>
    </use_case>

    <use_case id="UC-READ-04" actor="planning-agent" surface="both">
      <goal>List all DoR and DoD criteria for planning context.</goal>
      <preconditions>Both definition-of-ready.yaml and definition-of-done.yaml are present and valid.</preconditions>
      <inputs>{}  (one call per tool: chest.dor.list and chest.dod.list)</inputs>
      <steps>
        1. Resolve respective file path.
        2. Parse, validate, normalize.
        3. Return the list.
      </steps>
      <outputs>
        chest.dor.list: { "items": [ { "id": "dor-1", "text": "...", "severity": "blocking" } ] }
        chest.dod.list: { "items": [ { "id": "dod-1", "text": "...", "severity": "blocking", "requiresKpi": "kpi-1" } ] }
      </outputs>
      <postconditions>No files written.</postconditions>
    </use_case>

    <use_case id="UC-READ-05" actor="implementing-agent" surface="both">
      <goal>Attempt to read a governance file that does not exist.</goal>
      <preconditions>chest.init has not been run; .chest/ is absent.</preconditions>
      <inputs>{}</inputs>
      <steps>
        1. Resolve governance file path.
        2. Attempt to read file.
        3. File not found: return ERR-CHEST-03 with path and suggestion.
      </steps>
      <outputs>{ ok: false, error: { code: "ERR-CHEST-03", message: "Governance file not found: <path>. Run chest.init to create the governance store." } }</outputs>
      <postconditions>No files written.</postconditions>
    </use_case>
  </use_cases>

  <error_scenarios>
    <scenario id="ES-READ-01" ref="ERR-CHEST-03">
      <trigger>Governance file does not exist at expected path.</trigger>
      <observable>
        Structured error ERR-CHEST-03 with the absolute path of the missing
        file and the message "Run chest.init to create the governance store."
      </observable>
    </scenario>
    <scenario id="ES-READ-02" ref="ERR-CHEST-01">
      <trigger>Governance file exists but contains invalid YAML syntax.</trigger>
      <observable>
        Structured error ERR-CHEST-01 with file path, line number of first
        parse failure, and the YAML parser error message.
      </observable>
    </scenario>
    <scenario id="ES-READ-03" ref="ERR-CHEST-02">
      <trigger>Governance file parses as YAML but shape does not match schema.</trigger>
      <observable>
        Structured error ERR-CHEST-02 with file path, each invalid field path,
        and the schema constraint violated (e.g., "required field 'objective'
        missing at records[1]").
      </observable>
    </scenario>
    <scenario id="ES-READ-04" ref="ERR-CHEST-02">
      <trigger>chest.okrs.get called with an ID that does not exist in the file.</trigger>
      <observable>
        Structured error ERR-CHEST-02 with message "OKR with id 'X' not found."
      </observable>
    </scenario>
  </error_scenarios>

  <acceptance_criteria>
    <ac id="AC-READ-01" rolls_up_to="AC-FUN-03">
      chest.okrs.list returns a normalized OKR array when okrs.yaml is present
      and valid.
    </ac>
    <ac id="AC-READ-02" rolls_up_to="AC-FUN-03">
      chest.kpis.list returns a normalized KPI array when kpis.yaml is present
      and valid.
    </ac>
    <ac id="AC-READ-03" rolls_up_to="AC-FUN-03">
      chest.dor.list and chest.dod.list return normalized criterion arrays when
      the corresponding files are present and valid.
    </ac>
    <ac id="AC-READ-04" rolls_up_to="AC-FUN-03">
      chest.okrs.get and chest.kpis.get return a single record when the ID
      exists.
    </ac>
    <ac id="AC-READ-05" rolls_up_to="AC-FUN-04">
      Any read tool returns ERR-CHEST-03 with file path and init suggestion
      when the file is absent.
    </ac>
    <ac id="AC-READ-06" rolls_up_to="AC-FUN-04">
      Any read tool returns ERR-CHEST-01 with file path and line number when
      the file contains invalid YAML.
    </ac>
    <ac id="AC-READ-07" rolls_up_to="AC-FUN-04">
      Any read tool returns ERR-CHEST-02 with field path and constraint when
      the file is valid YAML but fails schema validation.
    </ac>
  </acceptance_criteria>

  <out_of_scope>
    Writing or modifying governance records (see write-governance-state).
    Aggregating reads across multiple files in a single call.
    Filtering list results by field values in v1.
  </out_of_scope>

</spec>
