# ml-sys

Machine learning systems and tooling.

## Projects

- **rs-tensor** — Rust tensor/linear algebra library (see [rs-tensor/](rs-tensor/)).

## Setup

- **Rust (rs-tensor):** `cd rs-tensor && cargo build`
- **Site (React):** `cd site && npm install && npm run dev`
- **Deploy (Docker / Coolify):** see [deploy/COOLIFY.md](deploy/COOLIFY.md) and root `Dockerfile`

## Docs (rs-tensor)

We build docs as we go; the project follows a learning arc (tensor → autograd → inference → curiosity).

- **Roadmap**: [rs-tensor/docs/ml-rust-project.md](rs-tensor/docs/ml-rust-project.md) — phases, checklists, readings, notes.
- **Learning book**: [rs-tensor/docs/README.md](rs-tensor/docs/README.md) — table of contents; chapters 1–3 cover Phase 1 (tensor from scratch). New chapters added as we move into Phase 2+.
- **MCP handbook** (tools, agents): [rs-tensor/docs/mcp/README.md](rs-tensor/docs/mcp/README.md) — written so **another PC needs only the MCP `url`** (no clone). Example endpoint (tunnel hostname may change): `https://openings-trivia-thereafter-reed.trycloudflare.com/mcp` — copy from [`.mcp.json`](.mcp.json).
- **API docs**: from the `rs-tensor` directory run `cargo doc --open` to generate docs from code comments.
