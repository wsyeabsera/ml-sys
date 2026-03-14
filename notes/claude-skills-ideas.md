# Claude skills — ideas for using the teaching MCP + rs-tensor tools

At the end of the build we want **skills for Claude** that use the teaching MCP (and rs-tensor MCP) to do cool stuff. Skills = reusable workflows: when the user asks X, Claude uses these tools/resources to do Y. **Content scope:** only React site + rs-tensor tools; no notes or other docs.

---

## Example skills (to build later)

- **Explain concept from my project**  
  Trigger: “explain autograd in my project,” “how does X work in what I built?”  
  Use: teaching MCP — fetch `teaching_context_for_concept(concept)` (or read `curriculum://chapter/{n}` + `curriculum://concepts`). Inject that context; Claude explains using our narrative, tool names, and viz. Optionally call rs-tensor MCP tools to run a tiny example and describe what happened.

- **Walk me through a chapter**  
  Trigger: “walk me through chapter 5,” “what’s in chapter N?”  
  Use: teaching MCP — read `curriculum://chapter/{n}` and (if available) `curriculum://viz` for that chapter. Claude narrates using our text and points to the viz we have. No content from outside React + rs-tensor.

- **Suggest a playground page**  
  Trigger: “suggest a new playground page for concept X.”  
  Use: teaching MCP — `teaching_get_context(concept)` or resources to get chapter + tools + viz. Claude suggests page structure, copy, and which viz/snippet to use. All from React + rs-tensor only.

- **Run a tiny demo and explain**  
  Trigger: “run a small tensor example and explain it.”  
  Use: rs-tensor MCP tools (e.g. `tensor_create`, `tensor_matmul`, `tensor_inspect`). Claude runs them, then optionally uses teaching MCP chapter text to explain in our words.

- **What tools do I have for X?**  
  Trigger: “what can I do with tensors in this project?” / “what tools exist for autograd?”  
  Use: teaching MCP `curriculum://concepts` (or list) + knowledge of rs-tensor MCP tool list. Claude answers with our concept → chapter, tools, viz — no generic API docs.

---

## Skill format

Skills are typically defined in a SKILL.md (or similar) that describes:

- **When to trigger** — e.g. user says “explain X in my project,” “walk me through chapter N.”
- **What to use** — teaching MCP resources/prompts, rs-tensor MCP tools (by name).
- **What to do** — e.g. inject context and explain, list tools and point to chapters, run a demo and summarize.

Where these live (e.g. repo `skills/` folder, or Claude’s skill directory) and exact trigger phrases we can decide when we implement Phase 6.
