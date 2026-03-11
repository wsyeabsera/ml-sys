# Learning guide: rs-tensor

This doc explains **what we built and why**, from a junior developer’s perspective. Use it while reading the code and the generated API docs.

## How to build the docs

From the `rs-tensor` directory:

```bash
cargo doc --open
```

That builds the API docs and opens them in your browser. The **learning guide** (this file) lives in `docs/learning.md`; the **API docs** are generated from the `///` comments in the code.

---

## Big picture

We’re building a small **tensor** type: a multi-dimensional array of numbers (here, `f32`). It has:

- **Data:** a flat list of numbers stored in memory.
- **Shape:** the dimensions (e.g. `[3]` = length 3, `[2, 3]` = 2×3).

We keep data in one `Vec<f32>` and use `shape` to interpret it. That’s the same idea as in NumPy or PyTorch, but in Rust.

---

## Concepts we use (and where to see them)

### 1. Structs and ownership

- **`Tensor`** is a `struct` with two fields: `data` and `shape`.
- In Rust, each value has a single **owner**. When you pass a `Tensor` by value, ownership moves; when you pass `&Tensor`, you borrow (read-only) and don’t take ownership.
- In `add(&self, other: &Tensor)` we take **references** so we don’t move or copy the tensors; we only read them and return a new tensor.

### 2. `#[derive(Debug)]`

- `println!("{:?}", t)` needs the type to implement the **`Debug`** trait.
- `#[derive(Debug)]` tells the compiler to generate a `Debug` implementation for `Tensor` so we can print it without writing the code ourselves.

### 3. `Vec`, `iter()`, `zip`, `map`, `collect`

- **`Vec<f32>`** is a growable list of `f32`s.
- **`.iter()`** gives an iterator over references to the elements (no ownership change).
- **`.zip(other.data.iter())`** pairs each element of `self.data` with the corresponding element of `other.data`.
- **`.map(|(a, b)| a + b)`** produces a new iterator that adds each pair.
- **`.collect()`** turns that iterator into a new `Vec<f32>` (the compiler infers the type from context).

So the `add` method is: “pair up elements, add them, collect into a new vector.”

### 4. `assert_eq!` for shape checking

- We use **`assert_eq!(self.shape, other.shape, "...")`** to ensure both tensors have the same shape before adding.
- If the shapes differ, the program **panics** with that message. Later we might return a `Result` instead for better error handling.

### 5. Why `.clone()` on shape?

- We do **`self.shape.clone()`** when building the result tensor so the new tensor gets its own copy of the shape.
- Without it we’d be trying to use the same `Vec<usize>` in two places; in Rust that would require ownership or more references, so cloning the small shape vector keeps the API simple.

---

## File layout

| File            | Role                                                                 |
|-----------------|----------------------------------------------------------------------|
| `src/main.rs`   | Program entry point; creates tensors, calls `add`, prints the result |
| `src/tensor.rs` | `Tensor` struct and its methods (`new`, `add`)                       |
| `docs/learning.md` | This guide — concepts and “why” (for humans)                    |

The **API docs** (`cargo doc`) are generated from the `///` and `//!` comments in `src/`. Those comments are the “what does this function do” reference; this file is the “what’s going on and why” walkthrough.

---

## Next steps (ideas)

- Add more operations: subtract, scalar multiply, dot product.
- Add a 2D shape and indexing.
- Return `Result<T, E>` instead of panicking on shape mismatch.
- Add tests in `tests/` or inline with `#[cfg(test)]`.

As you add code, keep updating the `///` doc comments and this learning guide so the docs keep teaching what’s happening.
