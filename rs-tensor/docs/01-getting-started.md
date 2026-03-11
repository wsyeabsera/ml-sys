# Chapter 1 — Getting started

## What this book is

This book explains the **rs-tensor** project: a small tensor library written in Rust. The goal is to learn Rust concepts (ownership, references, iterators, traits) by building something concrete. Each chapter focuses on one idea and points to where it shows up in the code.

## How to run the project

From the project root (`rs-tensor`):

```bash
cargo build    # compile
cargo run      # compile and run
```

You should see something like:

```
Hello, world!
t3: Tensor { data: [5.0, 7.0, 9.0], shape: [3] }
```

## How to build the API docs

The API docs are generated from the `///` and `//!` comments in the source:

```bash
cargo doc --open
```

Use the API docs for “what does this function take and return?” Use this book for “why do we do it this way?”

## How to read this book

- **Chapters are short.** Each one covers one theme and points to the relevant code.
- **Jump around if you want.** Use the [table of contents](README.md#table-of-contents) to pick a topic.
- **Keep the code open.** The book references `src/main.rs` and `src/tensor.rs`; read those files as you go.

Next: [Chapter 2 — The big picture](02-the-big-picture.md)
