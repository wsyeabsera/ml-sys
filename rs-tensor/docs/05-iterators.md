# Chapter 5 — Iterators

## The idea

In the `add` method we need to pair up elements from two vectors, add them, and put the results in a new vector. Rust’s **iterator** methods make that pattern clean: we don’t write index loops or allocate by hand.

## The chain in `add`

In `src/tensor.rs`, the body of `add` does:

```rust
let data = self
    .data
    .iter()                      // 1
    .zip(other.data.iter())      // 2
    .map(|(a, b)| a + b)         // 3
    .collect();                  // 4
```

Step by step:

1. **`.iter()`** — Produces an iterator over **references** to each element of `self.data`. We don’t move or copy the elements; we just look at them.

2. **`.zip(other.data.iter())`** — Zips two iterators together. We get pairs: `(self.data[0], other.data[0])`, then `(self.data[1], other.data[1])`, and so on. The two slices must have the same length (we already ensured that by checking `shape`).

3. **`.map(|(a, b)| a + b)`** — For each pair, we add them. So we get a new iterator that yields the sums.

4. **`.collect()`** — Consumes the iterator and builds a collection. The compiler infers that we want a `Vec<f32>` from context (we pass it to `Tensor::new(data, ...)`), so we get a vector of the summed values.

So in one expression we get: “pair elements, add them, collect into a new `Vec<f32>`.” No manual loop, no temporary vec—just a clear pipeline.

## Types

- **`Vec<f32>`** — A growable array of 32-bit floats.
- **`.iter()`** — Borrows the vec and gives you an iterator of `&f32`.
- **`.zip(...)`** — Combines two iterators into one that yields pairs.
- **`.map(...)`** — Transforms each item (here, each pair into a single sum).
- **`.collect()`** — Builds a collection from the iterator; here we get `Vec<f32>`.

## Takeaway

Iterators let you express “do this to each element” and “combine two sequences” without writing index-based loops. The code is short and the compiler can optimize it well.

Next: [Chapter 6 — Errors and shape checking](06-errors-and-shape-checking.md)
