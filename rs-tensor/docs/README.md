# Learning Rust with rs-tensor

A short book that walks through this codebase and explains **what we built and why**, from a junior developer’s perspective. Read it alongside the code and the generated API docs.

---

## How to build the API docs

From the `rs-tensor` directory:

```bash
cargo doc --open
```

That generates the API docs from the `///` comments in the code and opens them in your browser.

---

## Table of contents

1. **[Getting started](01-getting-started.md)** — How to run the project and how to use this book.
2. **[The big picture](02-the-big-picture.md)** — What a tensor is, and how we represent it (data + shape).
3. **[Ownership and references](03-ownership-and-references.md)** — Structs, `&self`, `&Tensor`, and why we borrow instead of move.
4. **[Debug and printing](04-debug-and-printing.md)** — `#[derive(Debug)]` and `println!("{:?}", ...)`.
5. **[Iterators](05-iterators.md)** — `Vec`, `.iter()`, `.zip()`, `.map()`, and `.collect()` in the `add` method.
6. **[Errors and shape checking](06-errors-and-shape-checking.md)** — `assert_eq!`, panic, and why we `.clone()` shape.
7. **[Codebase and next steps](07-codebase-and-next-steps.md)** — File layout and ideas for what to build next.

---

*As you add code, add new chapters or update existing ones so the book stays in sync with the project.*
