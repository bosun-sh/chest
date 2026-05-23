# chest

## description

chest is a tool for ai to store the goals of a project.
it stores:

1. OKR
2. KPI
3. Definition of done
4. Definition of ready

and contains scripts to review tasks against this stored goals using an llm-as-a-judge approach.

it's based in this bosun's paper: https://zenodo.org/records/19457265

## tooling

this project is built in typescript, using mcp/cli framework "ohtools" (@bosun-sh/ohtools)[https://www.npmjs.com/package/@bosun-sh/ohtools]

## architecture

this project should follow a clear separation of concerns, being optimized for new agents to rapidly understand the codebase.
the approach is:

1. screaming architecture: all files and directories should clearly state what they do in business terms on their name
2. vertical slicing: each directory contains a vertical
3. interface-first: each entity should have clear interfaces in a standarized directory within the verticals to be easily accessible
4. test-driven: all functionalities should be 100% tested

this architectural decisions are meant to make the code easier to navigate, debug and understand.
