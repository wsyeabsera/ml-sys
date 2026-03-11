---
description: Show progress through the ml-sys learning roadmap
---

Display current progress through the learning arc and suggest what to work on next.

## MCP tools used
- `read_file` — read `docs/ml-rust-project.md` for the roadmap
- `read_file` — read doc chapters to check completeness
- `tensor_list` — check if MCP server is running and has state

## Parameters
- $ARGUMENTS — optional: "detailed" for full breakdown, or a phase number to focus on

## Behavior
1. Read `docs/ml-rust-project.md` to get the current checklist state
2. Display each phase with status (Done / In Progress / Planned)
3. For the current phase, show individual task completion
4. List which doc chapters exist and which are missing
5. Suggest the next concrete task to work on
6. If "detailed", also show reading list progress and note any gaps
