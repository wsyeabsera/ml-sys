# Generating better pages from the teaching MCP

Once we have the teaching MCP (and thus a clear picture of “what we built” and “how we explained it”), we use that to **generate** or **design** new documentation pages that are more exciting and playable. **We keep all existing pages** — nothing gets deleted or replaced. New pages are additive (e.g. new routes like `/play/…`, new markdown, or new “cooler” variants). This note is the pipeline and first steps.

---

## What “generate” means here

We’re not auto-generating the whole site. We’re using the MCP + our own judgment to:

1. **Extract** — From the teaching MCP (and/or direct reads): which concepts exist, how they’re explained in the React chapters, which viz exist, which Rust code backs them.
2. **Decide** — Which concept gets a “cooler” page first (e.g. one concept, one playground).
3. **Produce** — New content: either new React page(s), or new markdown that we then turn into pages, or both. “Generate” = we (human + AI) write the page, informed by the MCP’s answers and the curriculum.

So the pipeline is: **MCP + curriculum as source of truth → we ask questions → we get answers → we design/write the new page.**

---

## Sources the teaching MCP can feed into pages

The MCP exposes **project-specific content** only from **React site + rs-tensor tools** (our chapter text, our viz list, rs-tensor tool names and Rust paths). It does not read or expose `notes/` or any other docs. We (or the LLM) use that content to design and write the new page. The MCP doesn’t “explain” — it hands us the raw material.

- **Chapter narrative** — What we already wrote (e.g. “gradient is the slope”, “backward pass replays the chain rule”). Good for intro copy and “why” sections.
- **Viz list** — Which components exist and what they’re for. We can reuse them, or design a new mini-viz for a single concept.
- **Rust mapping** — Which file/function implements what. For “runnable” snippets and “here’s what the code does” blocks.
- **Concept index** — (When we add it) concept → chapter, viz, Rust. Ensures the new page stays aligned with the rest of the project.

---

## Outputs: what “better pages” are

From the earlier note, we want pages that are:

- **Playful** — One concept, one playground (e.g. “strides”, “one backward step”).
- **Runnable** — Tiny Rust snippet + what it does + before/after (or link to MCP tool runs).
- **Progressive** — Small steps with aha moments (reshape → transpose → “see?”).
- **Breakable** — Change something and see the viz or numbers break.
- **Funny** — We want to *laugh* when we read or see the viz. So: witty copy, absurd-but-true analogies, silly labels or tooltips, viz that do something unexpected-but-correct (e.g. a tensor that “panics” with a dramatic message when you give it a bad shape). Tone = learning that doesn’t take itself too seriously; the bar is “I laughed” not “I learned” (we want both).

So when we “generate” a page we’re producing **new** content alongside the existing chapters:

- **New React route + component** (e.g. `/play/strides` or `/ch/2b-strides-playground`) with:
  - Short copy (from curriculum + MCP answers).
  - One or two interactive elements (existing viz reused, or a small new one).
  - Optional: “Run this in the MCP” or “See the code” that points at rs-tensor.
- **Or** new markdown in `rs-tensor/docs/` that the existing MCP already serves, and we add a React “doc viewer” page that renders it with the same layout as the rest of the site. Then “better pages” can start as better markdown, and we can add interactivity later.

---

## Workflow (how we actually do it)

1. **Pick one concept** — e.g. “strides” or “one autograd backward step”.
2. **Ask the teaching MCP** — “What’s the narrative for strides? Which chapter? Which Rust code? Which viz?” (using resources + tools + prompts).
3. **Draft the page** — We (human + Cursor/Claude) write:
   - 2–3 short paragraphs (from MCP + our words).
   - One interactive block (reuse StrideExplorer or a minimal new one).
   - One “try it” section: either a code snippet to run via rs-tensor MCP, or a link to the right chapter/viz.
4. **Ship the first “cooler” page** — Add route + component (or new doc + viewer). Existing chapters stay; we’re only adding. Iterate from feedback (“do I want to play with this?”).

---

## First page to try

- **Concept:** Strides (or “how shape and layout work”).
- **Why:** Already have StrideExplorer / stride-related viz; rs-tensor has shape/strides in `Tensor`; Chapter 2 (or nearby) likely introduces it. So we have curriculum + Rust + viz all available.
- **Page idea:** Single page: “Shape and strides in 60 seconds” — short copy from curriculum, one interactive stride explorer, one “run this in the MCP” example (e.g. create tensor, reshape, inspect strides). Optional: “break it” — try invalid shape and see the error. **Tone:** Add something that makes us laugh — e.g. a ridiculous analogy (“strides are like the library’s Dewey decimal system but for numbers that forgot to stay in order”), or a viz label that’s both correct and silly, or an error message that’s technically accurate but phrased like a dramatic movie line.

---

## Later: more automation

- **Templates** — A React page template for “one concept, one playground” so we only fill in concept name, copy, which viz, and which MCP snippet.
- **MCP tool that suggests a page outline** — e.g. `teaching_suggest_page(concept)` returns: suggested title, sections, which viz to use, which Rust to cite. We still write the page, but the outline is generated from the curriculum + index.
- **Generated markdown** — Script or MCP tool that, given a concept, outputs a markdown doc (narrative + code blocks + links to viz). We then render that in the site. Keeps the “single source of truth” in the teaching MCP’s view of the project.

For now we focus on: one concept, one cooler page, by hand, using the teaching MCP as the reference. Automation can build on that.

---

## Tone: make it funny

The bar is “I laughed” as well as “I learned.” When drafting copy or designing viz, we can aim for:

- **Unexpected analogies** — Technically correct but absurd (e.g. “strides are the Dewey decimal system for numbers that forgot to stay in order”).
- **Silly labels / tooltips** — In viz: hover text or labels that are accurate but ridiculous (e.g. “this number is having a bad day” on a wrong shape).
- **Dramatic or deadpan error states** — When something breaks, the message can be correct *and* funny (e.g. “Shape mismatch. These tensors are not on speaking terms.”).
- **Viz that react in a funny way** — Animations or states that are both correct and a bit absurd (e.g. a gradient arrow that “gives up” when it’s zero, or a tensor that “panics” with a theatrical message).

No need to force it every time — but when we can, we lean into personality so the experience feels like *our* weird learning playground, not a generic tutorial.
