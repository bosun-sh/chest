<spec name="Ohtools Exposure Technical Specification" feature="ohtools-exposure" extends="../../technical.spec">

  <slice_layout>
    <file path="src/plugin/public-schemas.ts">
      Public JSON Schema `as const` literals for all 20 tool inputs.
      Machine-readable; referenced by each bridge's defineTool call.
      Separate from Zod schemas in entity schema.ts files.
    </file>
    <file path="src/plugin/tool-registry.ts">
      defineGroup per entity (okrsGroup, kpisGroup, dorGroup, dodGroup,
      validateGroup, judgeGroup, reportsGroup). ID validation: lowercase dotted
      hierarchy, ≤100 tools total, no duplicates. Exports chestPlugins array.
    </file>
    <file path="src/plugin/registry.ts">
      chestPlugins array: one plugin("chest") wiring all groups and the init tool.
    </file>
    <file path="src/workspace/layers.ts">
      makeChestLayer(workspaceRoot): Layer assembled via Layer.mergeAll with all
      entity repository implementations, KPIRunner, JudgeProvider, Clock, Logger.
    </file>
    <file path="src/workspace/runtime.ts">
      makeChestRuntime(workspaceRoot): ManagedRuntime built from makeChestLayer.
      Plugin bridges use this runtime to execute entity Effect programs.
    </file>
    <file path="src/workspace/ohtools-app.ts">
      createChestApp(): Ohtools instance with all chestPlugins applied.
        export const createChestApp = () => {
          const app = new Ohtools()
          for (const p of chestPlugins) app.use(p)
          return app
        }
    </file>
    <file path="src/ohtools.ts">
      Re-exports default from workspace/ohtools-app.ts. Entry point for ohtools CLI.
        import { createChestApp } from "@chest/workspace/ohtools-app.js"
        export default createChestApp()
    </file>
  </slice_layout>

  <domain_types>
    No new entity domain types. This slice only composes existing types and tools.
  </domain_types>

  <ports_used>
    All ports are wired in src/workspace/layers.ts and injected into tool handlers
    via the Effect Layer/Context mechanism:
      OKRRepository    ← YAMLRepository.okrs()
      KPIRepository    ← YAMLRepository.kpis()
      KPIRunner        ← BunKPIRunner
      DoRRepository    ← YAMLRepository.dor()
      DoDRepository    ← YAMLRepository.dod()
      ReportRepository ← YAMLRepository.reports()
      JudgeProvider    ← OpenAIJudgeAdapter
      Clock            ← systemClock
      Logger           ← consoleLogger
    No direct port calls in this slice.
  </ports_used>

  <yaml_touchpoints>
    No direct YAML access. All governance file access goes through entity
    repository implementations wired in src/workspace/layers.ts.
  </yaml_touchpoints>

  <tools>
    All 20 tool IDs are defined in their respective feature bridge files.
    This spec confirms the complete authoritative list as registered in
    src/plugin/tool-registry.ts:

      chest.init
      chest.okrs.list, chest.okrs.get, chest.okrs.upsert, chest.okrs.remove
      chest.kpis.list, chest.kpis.get, chest.kpis.upsert, chest.kpis.remove,
      chest.kpis.run, chest.kpis.run-all
      chest.dor.list, chest.dor.upsert
      chest.dod.list, chest.dod.upsert
      chest.validate.ready, chest.validate.done
      chest.judge.align
      chest.reports.list, chest.reports.get
  </tools>

  <plugin_composition>
    src/plugin/tool-registry.ts:

      const okrsGroup    = defineGroup({ id: "okrs",     ... }, (g) =&gt; g.tool(okrsList).tool(okrsGet).tool(okrsUpsert).tool(okrsRemove))
      const kpisGroup    = defineGroup({ id: "kpis",     ... }, (g) =&gt; g.tool(kpisList).tool(kpisGet).tool(kpisUpsert).tool(kpisRemove).tool(kpisRun).tool(kpisRunAll))
      const dorGroup     = defineGroup({ id: "dor",      ... }, (g) =&gt; g.tool(dorList).tool(dorUpsert))
      const dodGroup     = defineGroup({ id: "dod",      ... }, (g) =&gt; g.tool(dodList).tool(dodUpsert))
      const validateGroup = defineGroup({ id: "validate", ... }, (g) =&gt; g.tool(validateReady).tool(validateDone))
      const judgeGroup   = defineGroup({ id: "judge",    ... }, (g) =&gt; g.tool(judgeAlign))
      const reportsGroup = defineGroup({ id: "reports",  ... }, (g) =&gt; g.tool(reportsList).tool(reportsGet))

      export const chestPlugins = [
        plugin("chest")
          .tool(initTool)
          .group(okrsGroup)
          .group(kpisGroup)
          .group(dorGroup)
          .group(dodGroup)
          .group(validateGroup)
          .group(judgeGroup)
          .group(reportsGroup)
      ]

    src/workspace/ohtools-app.ts:

      import { Ohtools }      from "@bosun-sh/ohtools"
      import { chestPlugins } from "@chest/plugin/registry.js"

      export const createChestApp = () => {
        const app = new Ohtools()
        for (const p of chestPlugins) app.use(p)
        return app
      }

    src/ohtools.ts:

      import { createChestApp } from "@chest/workspace/ohtools-app.js"
      export default createChestApp()
  </plugin_composition>

  <effects>
    None in this slice. Effects are delegated to entity repository implementations
    wired in src/workspace/layers.ts.
  </effects>

  <observability>
    ohtools runtime logs are surfaced through the Logger port. No additional
    logging in this composition slice.
  </observability>

</spec>
