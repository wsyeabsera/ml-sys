---
description: Explain something I'm confused about — use my project's code and tools to clarify
---

The user is confused about something. Figure out what, then explain it using the project's own code and MCP tools.

## MCP tools used
- `read_file` — read the relevant Rust source code
- Any tensor/autograd/attention tools — to create live demonstrations
- `cargo_exec` — to run Rust code if needed

## Parameters
- $ARGUMENTS — what they're confused about (e.g., "why does transpose make data non-contiguous", "I don't get gradient accumulation", "what does the KV cache actually do")

## Behavior
1. Identify the concept they're stuck on
2. Read the relevant source code using `read_file` to find the actual implementation
3. Create a minimal live example using MCP tools that demonstrates the concept
4. Explain step by step, connecting the code to the concept
5. Show what happens when you get it wrong (e.g., "here's what happens WITHOUT gradient accumulation")
6. Ask them to predict what a slightly different example would produce, then verify
7. Reference which chapter covers this topic for further reading
