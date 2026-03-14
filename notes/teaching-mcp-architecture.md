# Teaching MCP — Architecture & step-by-step build plan

How the teaching MCP is structured and how to build it in phases so each step is shippable and the next step builds on it. Goal: a **powerful** MCP that gives the LLM rich, project-specific context (our chapters, our viz, our Rust mapping) without duplicating what the LLM already knows.

---

## Content scope (strict)

**The teaching MCP only exposes content from two places. Nothing else.**

1. **React site** — `site/` only. Chapters (pages), viz (components), and the text we put in the React app. No other front-end or docs.
2. **rs-tensor tools** — The tools the rs-tensor MCP actually exposes (tensor ops, autograd, gguf, project, etc.) and the Rust code that implements them (paths inside `rs-tensor/`). No generic “Rust docs” or arbitrary files.

**Out of scope:** The `notes/` folder, any other markdown or planning docs, external knowledge, or files outside `site/` and `rs-tensor/`. The concept map (if we add one) must reference only: chapter numbers (from the React site) and tool names / Rust paths that belong to rs-tensor. No config or index that pulls from `notes/` or elsewhere.

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Client (Claude / Cursor)                                                │
│  - Calls resources to get project content                                │
│  - Optionally uses prompt that injects that content                      │
│  - Asks LLM to explain / teach using that context                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Teaching MCP (stdio, same repo as rs-tensor)                            │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  Resources      │  │  Prompts (opt)   │  │  Tools (opt, later)     │ │
│  │  curriculum://  │  │  Inject our      │  │  Only if they return    │ │
│  │  chapters       │  │  content for     │  │  project-specific data  │ │
│  │  chapter/{n}    │  │  a concept       │  │  (no “explain” tools)   │ │
│  │  viz            │  │                 │  │                         │ │
│  │  concepts       │  └─────────────────┘  └─────────────────────────┘ │
│  └────────┬────────┘                                                      │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Curriculum index (in memory, built at startup or on first use)        ││
│  │  - chapters: Vec<ChapterSummary>   (number, title, path)             ││
│  │  - chapter_content: Map<u8, String> (from site/content/*.md files)   ││
│  │  - viz: Vec<VizSummary>            (name, path, chapters_used_in)    ││
│  │  - concepts: Map<String, ConceptRef> (concept → chapter, rust, viz)   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Loaders / extractors                                                ││
│  │  - Site loader: titles from Chapter*.tsx, content from content/*.md    ││
│  │  - Viz scanner: scan imports in pages + site/src/components/viz/*    ││
│  │  - Concept map: only React chapter nums + rs-tensor tools/paths (no notes) ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Filesystem (only these; no notes/ or other docs)                        │
│  - site/src/pages/ChapterN.tsx        (titles only)                      │
│  - site/content/chapter-NN.md         (chapter narrative, written by us) │
│  - site/src/components/viz/*.tsx, three/*.tsx                            │
│  - rs-tensor: tool implementations (mcp/tools/*.rs, tensor.rs, etc.)    │
│  - Optional: rs-tensor/teaching-concepts.toml (concept → chapter + tools)  │
│    (only references React chapter numbers + rs-tensor tool/path names)     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Data flow:** FS → loaders → curriculum index (in memory) → resources (and optionally prompts/tools). Client reads resources (and maybe calls a prompt), gets our content, passes it to the LLM. The MCP never “explains”; it only serves **our** text, **our** structure, **our** paths.

---

## Core components

| Component | Responsibility | Output |
|-----------|----------------|--------|
| **Site loader** | Find `site/src/pages/Chapter*.tsx` for chapter number + title (one regex). Load `site/content/chapter-NN.md` for chapter prose. No TSX text extraction. | `Vec<ChapterSummary>`, `Map<chapter_num, String>` from markdown files. |
| **Viz scanner** | Scan page files for component imports; optionally list `components/viz/*` and `components/three/*` with paths. | `Vec<VizSummary>` (name, path, which chapters use it). |
| **Concept map** | Optional. Only references: chapter num (from React), rs-tensor tool names / Rust paths, viz names (from site). No notes or external docs. E.g. config in `rs-tensor/teaching-concepts.toml`. | `Map<String, ConceptRef>`. |
| **Curriculum index** | Holds the above in memory. Built at startup (or lazily on first resource read). Exposes no direct API; resources/prompts read from it. | Single source of truth for “what we have.” |
| **Resource handlers** | Implement MCP `list_resources` / `read_resource` for `curriculum://` URIs. | MCP protocol responses. |
| **Prompt handler (optional)** | One prompt: “context for concept X” → message body = concatenated chapter excerpt + Rust path + viz list from concept map. | Prompt message for client to send to LLM. |

**No “explain” tools.** Optional tools later only if they **return** data (e.g. “list concepts” as JSON). The “power” comes from **how much project-specific content** we expose so the LLM can reason over it.

---

## Step-by-step build plan

Each phase ships something usable and sets up the next. Paths assume teaching MCP runs from repo root or with `SITE_PATH` / `RS_TENSOR_PATH` set.

---

### Phase 1 — Skeleton + chapters list

**Goal:** MCP runs and exposes a single resource: list of chapters (number + title).

1. Add `src/bin/teaching-mcp.rs` (or new crate under `teaching-mcp/`). Wire stdio transport and empty `ServerHandler` that supports resources only.
2. Implement **site loader** (minimal): resolve path to `site/src/pages/` (env or relative to manifest). Read `Chapter1.tsx` … `Chapter10.tsx`; parse **only** chapter number and title (e.g. regex on `Chapter(\d+)` and first `<motion.h1>` or similar). No full text extraction yet.
3. Build **curriculum index** at startup: `chapters: Vec<{ number, title }>`.
4. Implement **resources**: `list_resources` returns one entry `curriculum://chapters`; `read_resource("curriculum://chapters")` returns JSON or markdown listing chapter numbers and titles.
5. Add MCP config entry so Cursor/Claude can spawn the binary. Verify: client can read `curriculum://chapters` and see the 10 chapters.

**Deliverable:** One resource, chapters list. No chapter body yet.

---

### Phase 2 — Chapter content via markdown files

**Goal:** Client can read the **actual text** we wrote for each chapter (so the LLM can quote or summarize our narrative).

**Decision:** We do NOT parse TSX. Extracting prose from React components is fragile, tedious, and not the point of this project. Instead, each chapter has a companion **markdown file** that contains the chapter's narrative content in clean, readable form.

1. Create a content directory: `site/content/` with files like `chapter-01.md`, `chapter-02.md`, etc. These are the **source of truth** for what each chapter says — written by us, not scraped from JSX.
2. **Content loader**: at startup, scan `site/content/chapter-*.md`. Match each file to its chapter number. Store in curriculum index as `chapter_content: Map<chapter_num, String>`.
3. Resources `curriculum://chapter/1` … `curriculum://chapter/10` serve the markdown content directly. If a markdown file doesn't exist yet for a chapter, return a stub (“content not yet written”).
4. The markdown files can be written incrementally — we don't need all 10 before shipping Phase 2.

**Why markdown files, not TSX parsing:**
- TSX is a rendering format, not a content format. Parsing it means building a web scraper for our own code.
- Markdown files are easy to write, easy to read, easy to diff, and the MCP serves them as-is.
- If the React page and the markdown drift, that's fine — the markdown is the “what we want the LLM to know” version, not a 1:1 mirror of the page.

**Deliverable:** Resources for “chapters list” and “full text of chapter N” from markdown files. LLM can now use *our* words.

---

### Phase 3 — Viz index

**Goal:** Expose which viz components exist and where they’re used (so we can say “you have GradientFlow in Chapter 5”).

1. **Viz scanner**: (a) Scan `site/src/pages/*.tsx` for imports of components from `../components/` and collect component names. (b) Optionally list files in `site/src/components/viz/` and `site/src/components/three/` with names and paths. Build `viz: Vec<VizSummary>` and “which chapter uses which viz” (from the page filename).
2. Add resource `curriculum://viz`: `read_resource` returns list of viz names, paths, and which chapters use them (e.g. JSON or markdown).
3. Optionally add `curriculum://viz/{name}` later if we want to serve a single viz’s metadata.

**Deliverable:** One resource for “all viz and where they’re used.” Richer context for the LLM.

---

### Phase 4 — Concept map + “context for concept” prompt

**Goal:** Tie concepts (e.g. “autograd”, “strides”, “attention”) to *our* chapter, *our* Rust file, *our* viz. Then expose that as injected context so the LLM can answer “how does X work in my project?” using our material.

1. **Concept map**: Add a small config **only inside rs-tensor** (e.g. `rs-tensor/teaching-concepts.toml`): concept key → `chapter` (number from React), `tools[]` (rs-tensor MCP tool names, e.g. `autograd_neuron`, `autograd_expr`), `rust_paths[]` (paths under rs-tensor only, e.g. `src/tensor_value.rs`), `viz[]` (component names from site). **Do not** reference `notes/` or any file outside site/ and rs-tensor. Load at startup into `concepts: Map<String, ConceptRef>`.
2. **Resource** `curriculum://concepts`: list concept names and short description (e.g. “autograd → ch5, tools: autograd_neuron, … ; Viz: GradientFlow”).
3. **Prompt** `teaching_context_for_concept`: takes `concept` as argument; looks up concept in map; builds one prompt message whose body = “Chapter N text: <from React only> ; rs-tensor tools: <tool names> ; Rust paths: <under rs-tensor only> ; Viz: <from site only>.” Client uses this as system or user context and then asks “help me understand this.” The MCP does not generate explanation—only the injected content. All of it is scoped to React + rs-tensor tools.

**Deliverable:** Concept map in config, one resource for concepts list, one prompt that injects full project context for a concept. This is where the MCP becomes **powerful**: one prompt call gives the LLM everything we have for that concept.

---

### Phase 5 — Optional tools and polish

**Goal:** Only if we need programmatic access to project-specific data (e.g. for Cursor to build a page from a concept without reading resources by hand).

1. **Tool** `teaching_get_context(concept: string)`: returns JSON with `chapter_number`, `chapter_text` (or path), `rust_paths`, `viz`. Same data as the prompt injects, but as structured data. Useful for automation or “generate page” flows.
2. **Tool** `teaching_list_concepts`: returns list of concept ids and one-line description. Optional.
3. Polish: error messages, path config (env vars for site/rs-tensor roots), maybe lazy loading of chapter text if startup gets slow.

**Deliverable:** Optional tools that return only project-specific data. No “explain” tools.

---

### Phase 6 — Claude skills

**Goal:** Build skills for Claude that use the teaching MCP (and optionally rs-tensor MCP) to do cool stuff. Skills = reusable workflows: “when the user asks X, use these tools/resources to do Y.” Content scope stays React + rs-tensor tools only.

1. **Skill format** — Claude skills are typically described in a SKILL.md (or similar): when to trigger, what tools to use (teaching MCP resources/prompts, rs-tensor MCP tools), and what to do with the result (e.g. explain, suggest a page, walk through a chapter).
2. **Example skills (ideas):**
   - **Explain concept from my project** — Trigger: “explain autograd in my project” / “how does X work in what I built?” Use teaching MCP: fetch `teaching_context_for_concept` (or read `curriculum://chapter/{n}` + `curriculum://concepts`). Inject that context; Claude explains using our narrative and tool/viz references. Optionally call rs-tensor tools to run a tiny example and describe what happened.
   - **Walk me through a chapter** — Trigger: “walk me through chapter 5” / “what’s in chapter N?” Read `curriculum://chapter/{n}` and optionally `curriculum://viz` for that chapter. Claude narrates using our text and points to the viz we have.
   - **Suggest a playground page** — Trigger: “suggest a new playground page for concept X.” Use teaching MCP `teaching_get_context(concept)` (or resources) to get chapter + tools + viz. Claude (or Cursor) suggests page structure, copy, and which viz/snippet to use. No content from notes/ — only React + rs-tensor.
   - **Run a tiny demo and explain** — Trigger: “run a small tensor example and explain it.” Use rs-tensor MCP tools (e.g. `tensor_create`, `tensor_matmul`, `tensor_inspect`). Claude runs them, then uses teaching MCP chapter text (if relevant) to explain in our words.
3. **Where skills live** — In the repo or in Claude’s skill directory (e.g. custom skills that reference this project’s MCPs). Document in `notes/claude-skills-ideas.md` (or a `skills/` folder) what each skill does and when to use it.

**Deliverable:** One or more Claude skills that combine teaching MCP + rs-tensor MCP for learning workflows. No new MCP surface — just “how Claude should use what we built.”

---

## What makes it “powerful”

- **Phase 1–2:** LLM can see “what chapters exist” and “what we wrote” — so it can answer “what’s in chapter 5?” and quote our narrative.
- **Phase 3:** LLM knows which viz we have and where they appear — so it can say “you have a GradientFlow in chapter 5 for autograd.”
- **Phase 4:** One concept → one place. Config + prompt give the LLM **our** chapter text + **our** Rust paths + **our** viz in one shot. That’s the “powerful” moment: the client asks “explain autograd in my project” and the LLM gets all the project-specific context in one prompt.
- **Phase 5:** Automation (e.g. “generate a page for concept X”) can call a tool to get the same context as JSON and then generate copy/structure without re-parsing the site.
- **Phase 6:** Claude skills turn the two MCPs into reusable “do cool stuff” workflows: explain from our context, walk through chapters, suggest pages, run demos — all scoped to React + rs-tensor tools.

---

## Dependencies between phases

```
Phase 1 (skeleton + chapters list)
    ↓
Phase 2 (chapter content)  — reuses loader, adds text extraction
    ↓
Phase 3 (viz index)       — independent of 2, can run in parallel with 2
    ↓
Phase 4 (concept map + prompt) — needs 1, 2, 3 and concept config
    ↓
Phase 5 (optional tools)  — thin wrapper over index + concept map
    ↓
Phase 6 (Claude skills)   — use teaching + rs-tensor MCPs in workflows
```

---

## Where this lives in the repo

- **Option A (recommended for Phases 1–4):** `rs-tensor/src/bin/teaching-mcp.rs` + `rs-tensor/src/teaching/` (or `rs-tensor/src/mcp_teaching/`) for loaders, index, and curriculum resource handlers. Build with `cargo build --bin teaching-mcp`. Site path from env `SITE_PATH` or `../site` relative to rs-tensor.
- **Option B:** Separate crate `teaching-mcp/` at repo root; depends on no tensor code, only std + rmcp + serde; reads both `site/` and `rs-tensor/` from repo root. Useful if we want to run the teaching MCP without building the full rs-tensor library.

Start with Option A; split to B only if needed.
