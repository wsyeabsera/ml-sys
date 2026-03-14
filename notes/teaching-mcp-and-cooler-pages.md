# Teaching MCP + Cooler Pages

**Goal:** Learn ML by understanding what we built (Rust + React), then use that knowledge to make documentation and pages we actually want to look at and play with. This is for *me* — personal learning, not for shipping to others. End state: build a cool project and have an environment that teaches and excites.

**Tone:** We want this to be a **funny** learning experience — the kind where we laugh when we read the copy or see the visualisations. Not dry textbook; personality, wit, and “wait, that’s actually hilarious” moments in both text and viz.

---

## The setup

- **Claude** connected to the project (can use rs-tensor MCP).
- **Cursor** (me) in the same repo.
- **rs-tensor MCP** — already good: tools (tensor ops, autograd, gguf, read_file, cargo_exec) + resources (docs, source, tensor store). Great for *doing* and *reading* the Rust side.
- **React site** — 10 chapters + viz (GradientFlow, ComputationGraph, StrideExplorer, AttentionViz, etc.). It’s the *curriculum* and *narrative* we built around the Rust project. Good content, but “good not exciting.”

---

## What we’re gonna build

### 1. A second MCP — “teaching” / “understanding” MCP

- **Still centered on the Rust project** (same codebase we vibe-coded and want to understand).
- **Consumes the React site** as reference: chapter text, section headings, what each viz is meant to show, how the narrative flows.
- **Purpose:** Give the LLM **project-specific content** (our chapter text, our viz list, our concept → file/chapter mapping) so *the LLM* can answer “how does this work?” / “what did I build?” in context. The MCP does **not** “explain” things — that’s just an LLM call. The MCP’s job is to **retrieve and inject** the stuff only this repo has (our narrative, our structure, our paths). So when we ask “how does autograd work?”, the client fetches our Chapter 5 text + Rust path + viz from the MCP, passes that to the LLM, and the LLM explains using *our* words and code.
- **Content scope:** Only React site (chapters, viz) + rs-tensor tools (and the Rust that implements them). No `notes/` or other docs — the MCP never reads or exposes those.
- **Not** an MCP to optimize or refactor React — it’s a bridge that exposes our curriculum and structure so the LLM can teach from it.

### 2. Cooler, more exciting pages (additive)

- **Keep all existing pages** — we’re not deleting or replacing the current chapters. They stay as-is.
- Current docs/chapters: good but not exciting; don’t make us *want* to look and play. So we **add** new ones.
- Use the knowledge we gather (from the teaching MCP, from understanding Rust + React) to design **new** documentation pages (new routes, new content) that are:
  - **Playful** — one concept, one playground (e.g. strides, one backward pass).
  - **Runnable** — “here’s a tiny Rust snippet; here’s what it does; here’s before/after.”
  - **Progressive aha moments** — small, satisfying steps: reshape → transpose → “see how the numbers didn’t move?”
  - **Viz we can break** — change a dimension or an op and see it break or behave oddly; “break it and see” as part of the experience.
  - **Funny** — copy and viz that make us laugh: unexpected captions, silly labels, absurd-but-true analogies, or viz that react in a way that’s both correct and ridiculous. The goal is “I actually want to read this” and “I just laughed at a gradient diagram.”

### 3. Claude skills (at the end)

- Once we have the teaching MCP and (optionally) cooler pages, we **build skills for Claude** that use these tools to do cool stuff.
- Skills = reusable workflows for Claude: “when the user asks X, use teaching MCP resources / prompts (and maybe rs-tensor MCP tools) to do Y.” Example ideas: “explain a concept using my project context,” “suggest a playground page for concept X,” “walk me through chapter N with my actual chapter text + viz,” “run a tiny tensor example via rs-tensor and explain what happened.”
- Content stays scoped to React + rs-tensor tools; skills just tell Claude *how* to combine them (fetch curriculum, inject context, call rs-tensor tools for demos, etc.). See **[teaching-mcp-architecture.md](./teaching-mcp-architecture.md)** Phase 6 and **[claude-skills-ideas.md](./claude-skills-ideas.md)** for concrete skill ideas.

---

## Why this order

1. **Teaching MCP** → Lock in understanding: one place to ask “what did I build and how did I explain it?” (Rust + React narrative).
2. **Cooler pages** → Designed from that understanding: grounded in our real system, feel like *our* environment to learn and play.
3. **Claude skills** → Reusable workflows so Claude can do cool things with the teaching MCP and rs-tensor tools (explain from our context, suggest pages, walk through chapters, run demos).

---

## Ideas to revisit

- Where should the teaching MCP live? Same repo, different binary? Different process that reads both `rs-tensor/` and `site/`?
- How does it “read” the React pages? Static extraction (e.g. chapter content, component descriptions)? Or runtime one day?
- First “cooler” page: pick one concept (e.g. strides, or one autograd step) and make a single, focused, playable page.
- Claude + Cursor both connected → we can use Claude with rs-tensor MCP for doing/running, and Cursor for building the teaching MCP and the new pages.

---

## Next steps (so we can start building)

- **[teaching-mcp-how-to-build.md](./teaching-mcp-how-to-build.md)** — Where the MCP lives, how it reads the React site (static extraction), what it exposes (resources, tools, prompts), and the first slice: `curriculum://chapters`, `teaching_explain(concept)`, one prompt.
- **[generating-better-pages.md](./generating-better-pages.md)** — Pipeline from MCP/knowledge to new pages: sources (chapter narrative, viz list, Rust mapping), workflow (pick concept → ask MCP → draft page → ship), and first page to try (e.g. “Shape and strides in 60 seconds” with one playground + runnable MCP example).

Order: build the teaching MCP MVP first, then use it to design and implement the first cooler page; finally add Claude skills that use both MCPs to do cool stuff.

---

*Last updated: 2025-03-14*
