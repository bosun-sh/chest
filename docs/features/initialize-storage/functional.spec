<spec name="Initialize Storage Functional Specification" feature="initialize-storage" extends="../../functional.spec">

  <summary>
    The initialize-storage slice creates the local .chest/ governance store for
    a project. It writes four empty YAML files (okrs.yaml, kpis.yaml,
    definition-of-ready.yaml, definition-of-done.yaml) in the target directory,
    validating that no prior store exists unless the actor explicitly requests
    an overwrite. It is the required first step for all other Chest workflows.
  </summary>

  <use_cases>
    <use_case id="UC-INIT-01" actor="planning-agent" surface="both">
      <goal>Initialize a fresh governance store in a project that has never used Chest.</goal>
      <preconditions>Target directory exists. No .chest/ subdirectory is present.</preconditions>
      <inputs>
        { "dir": "/path/to/project" }
        or {} to use the current working directory.
      </inputs>
      <steps>
        1. Resolve the target path from input or cwd.
        2. Check for existing .chest/ directory.
        3. Create .chest/ and write four empty governance files.
        4. Return a summary of created paths.
      </steps>
      <outputs>
        {
          "created": [".chest/okrs.yaml", ".chest/kpis.yaml",
                      ".chest/definition-of-ready.yaml",
                      ".chest/definition-of-done.yaml"],
          "skipped": []
        }
      </outputs>
      <postconditions>
        .chest/ exists with four parseable, schema-valid empty governance files.
      </postconditions>
    </use_case>

    <use_case id="UC-INIT-02" actor="planning-agent" surface="both">
      <goal>Reinitialize an existing store when it is known to be stale or corrupt.</goal>
      <preconditions>Target directory contains an existing .chest/.</preconditions>
      <inputs>{ "force": true }</inputs>
      <steps>
        1. Resolve the target path.
        2. Detect existing .chest/ directory.
        3. Because force is true, overwrite the four governance files.
        4. Return a summary showing which files were overwritten.
      </steps>
      <outputs>
        {
          "created": [".chest/okrs.yaml", ".chest/kpis.yaml",
                      ".chest/definition-of-ready.yaml",
                      ".chest/definition-of-done.yaml"],
          "skipped": []
        }
      </outputs>
      <postconditions>
        .chest/ contains four fresh, empty, schema-valid governance files.
      </postconditions>
    </use_case>

    <use_case id="UC-INIT-03" actor="ci-runner" surface="cli">
      <goal>Attempt initialization when a store already exists without force flag.</goal>
      <preconditions>Target directory contains an existing .chest/.</preconditions>
      <inputs>{ "dir": "/path/to/project" }</inputs>
      <steps>
        1. Resolve the target path.
        2. Detect existing .chest/ directory.
        3. Return a conflict error because force is not set.
      </steps>
      <outputs>
        { ok: false, error: { code: "ERR-CHEST-10", message: "Chest store already exists at <path>/.chest. Pass force: true to overwrite." } }
      </outputs>
      <postconditions>Existing .chest/ is unchanged.</postconditions>
    </use_case>
  </use_cases>

  <error_scenarios>
    <scenario id="ES-INIT-01" ref="ERR-CHEST-10">
      <trigger>chest.init called without force when .chest/ already exists.</trigger>
      <observable>
        Error code ERR-CHEST-10, message includes the path of the existing
        store and the suggestion to pass force: true.
      </observable>
    </scenario>
    <scenario id="ES-INIT-02" ref="ERR-CHEST-03">
      <trigger>Target directory does not exist or Chest lacks write permission.</trigger>
      <observable>
        Error code ERR-CHEST-03, message includes the target path and the
        operating system error.
      </observable>
    </scenario>
  </error_scenarios>

  <acceptance_criteria>
    <ac id="AC-INIT-01" rolls_up_to="AC-FUN-01">
      chest.init creates .chest/ with okrs.yaml, kpis.yaml,
      definition-of-ready.yaml, and definition-of-done.yaml in a directory
      that had no prior Chest store.
    </ac>
    <ac id="AC-INIT-02" rolls_up_to="AC-FUN-02">
      chest.init returns ERR-CHEST-10 when .chest/ exists and force is not true.
    </ac>
    <ac id="AC-INIT-03" rolls_up_to="AC-FUN-01">
      chest.init with force: true overwrites all four governance files and
      returns created paths.
    </ac>
    <ac id="AC-INIT-04" rolls_up_to="AC-FUN-11">
      chest.init returns a ToolResult error envelope when the target directory is not
      writable, including the path and the OS error.
    </ac>
  </acceptance_criteria>

  <out_of_scope>
    Migrating or upgrading an existing governance store schema. Merging
    existing records from a prior store during force init. Initializing
    multiple stores in a single call.
  </out_of_scope>

</spec>
