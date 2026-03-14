# How to build the teaching MCP

Concrete design so we can start implementing. Same repo, still centered on the Rust project; this MCP adds “read the React curriculum” and “answer teaching questions” that tie Rust + React together. For **architecture and a step-by-step build plan** (phases 1–5), see **[teaching-mcp-architecture.md](./teaching-mcp-architecture.md)**.

---

## Content scope (strict)

**Only two sources:** (1) **React site** — chapters and viz from `site/`. (2) **rs-tensor tools** — the tools the rs-tensor MCP exposes and the Rust code that implements them (paths under `rs-tensor/`). No `notes/`, no other docs, no external knowledge. Concept map (if any) references only React chapter numbers and rs-tensor tool names / paths.

---

## Principle: unique value only

**Don’t build tools that “say” things the LLM already knows.** Generic explanations (“what is a gradient?”, “explain matmul”) can be replaced with a normal LLM call. The teaching MCP should expose **only what’s unique to this repo**: our chapter text, our viz list, our concept → chapter/file/viz mapping. The LLM then uses that content to explain — the MCP’s job is to **retrieve and inject project-specific content**, not to generate explanations.

---

## Where it lives

- **Option A:** New binary in the same rs-tensor crate, e.g. `src/bin/teaching-mcp.rs`, built with `cargo build --bin teaching-mcp`. Shares the crate’s types and docs; needs a way to read files from `../site` (or a configurable path).
- **Option B:** Separate small crate under `ml-sys/` (e.g. `teaching-mcp/`) that only does file I/O and MCP; no tensor logic. Reads both `rs-tensor/` and `site/` from repo root.
- **Recommendation:** Start with **Option A** so we reuse `rmcp`, existing patterns, and doc/source paths. If it gets heavy or we want to run it without the full rs-tensor build, we can split to Option B.

---

## How it knows about the React site (v1)

Two levels of reading:

1. **Chapter titles** (automatic)
   - Scan `site/src/pages/ChapterN.tsx` filenames + extract title from `<motion.h1>`.
   - This is the only TSX parsing we do — just one regex for the title. No prose extraction from JSX.

2. **Chapter content** (markdown files, written by us)
   - Each chapter has a companion markdown file in `site/content/chapter-NN.md`.
   - These are the **source of truth** for what each chapter covers — written in our words, not scraped from JSX.
   - The MCP reads these at startup and serves them via `curriculum://chapter/{n}`.
   - If a chapter doesn’t have a markdown file yet, the MCP returns a stub.
   - **Why not parse TSX?** We tried it. TSX is a rendering format, not a content format. Parsing it means building a web scraper for our own code — fragile, tedious, and not the point. Markdown files are easy to write, read, and diff.

3. **Viz / components** (Phase 3, from TSX imports — lightweight)
   - From `site/src/pages/*.tsx`, collect which components are imported (e.g. `GradientFlow`, `ComputationGraph3D`). This is just scanning import lines, not parsing the full TSX tree.
   - Store as a small index: chapter → list of viz component names.

---

## What the teaching MCP exposes (project-specific only)

Everything here is **data the LLM doesn’t have** — our actual chapter text, our file paths, our viz list. No “explain X” tools; the client asks the LLM, and the LLM uses these resources to answer in context.

- **Resources** (read-only project content)
  - `curriculum://chapters` — list of chapter numbers and titles (from our React pages).
  - `curriculum://chapter/{n}` — **the actual extracted text we wrote** for chapter N (our narrative, not a generic summary).
  - `curriculum://viz` — which viz components exist in the repo and which chapters use them.
  - `curriculum://concepts` (optional) — hand-maintained mapping: concept → our chapter, our Rust file, our viz. So the LLM can say “in your project, autograd is in Chapter 5, implemented in `tensor_value.rs`, and you have GradientFlow for it.”

- **Tools** (only if they return project-specific data, not prose)
  - Skip “explain” tools. If we add tools, they should **retrieve**: e.g. “get chapter N text”, “list Rust files for concept X”, “which viz is used on this page”. Return structured facts (paths, names, raw text), not explanations. The LLM does the explaining using that data.

- **Prompts** (value = injected project content)
  - A prompt is only worth having if it **injects** our content: chapter text (from React), rs-tensor tool names and Rust paths, viz names (from site). No roadmap or notes from outside. So: one prompt like `teaching_context_for_concept` that returns a **message** whose content is the concatenated material from **React + rs-tensor tools only**. The client sends that as context; the LLM then answers. No prompt that’s just “explain autograd” with no project data.

---

## Tech choices (v1)

- **Language:** Rust, reusing `rmcp` and the same transport (stdio). Easiest given we already have rs-tensor MCP in Rust.
- **Chapter content:** Markdown files in `site/content/`, not TSX parsing. We only parse TSX for titles (one regex).
- **Paths:** Assume repo layout: teaching MCP runs with cwd or env pointing at repo root, so `site/src/pages` and `rs-tensor/docs` are fixed relative paths (or from `CARGO_MANIFEST_DIR` and then `../site`).

---

## First slice (MVP)

Only expose **project-specific content**; let the LLM do any “teaching” in the client.

1. **Resources only (no “explain” tools):**
   - `curriculum://chapters` — list chapter numbers and titles by scanning `site/src/pages/Chapter*.tsx`.
   - `curriculum://chapter/{n}` — content from `site/content/chapter-NN.md` (so the LLM can quote or summarize *our* narrative).
2. **Optional prompt:** `teaching_context_for_concept(concept)` — returns a single prompt message that **injects** our material: e.g. for “autograd”, the message body is “Chapter 5 text: … ; Rust: `rs-tensor/src/tensor_value.rs` ; Viz: GradientFlow, SimpleGraph.” The client passes that as context and asks “help me understand this”; the LLM explains using *our* words and structure. The MCP does not generate the explanation.
3. **No tool that “explains” a concept** — that’s just an LLM call. We only add tools later if they **return** something unique (e.g. “list concepts and their chapter/file/viz” as JSON). From there we can add more resources (viz list, concept index) and “generate page” support (see generating-better-pages.md).

---

## Config

- `.mcp.json` (or Cursor MCP config) will have a second entry that spawns the teaching MCP binary, e.g. `cargo run --bin teaching-mcp` from repo root (or from `rs-tensor` with `SITE_PATH=../site`). We’ll add this when we implement the binary.
