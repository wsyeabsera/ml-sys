# Chapter 4 — Debug and printing

## The idea

In Rust, `println!` can format values in different ways. The `{}` placeholder uses the **Display** trait (human-friendly). The `{:?}` placeholder uses the **Debug** trait (developer-friendly, often “struct name + fields”).

If a type doesn’t implement **Debug**, you can’t use `{:?}` with it. The compiler will tell you.

## How we get Debug for free

We don’t implement `Debug` by hand. We ask the compiler to generate it:

```rust
#[derive(Debug)]
pub struct Tensor {
    pub data: Vec<f32>,
    pub shape: Vec<usize>,
}
```

**`#[derive(Debug)]`** means: “Generate an implementation of the `Debug` trait for this struct.” The generated implementation prints the struct name and each field. That’s enough for debugging and for `println!("{:?}", tensor)`.

## Where we use it

In `src/main.rs`:

```rust
println!("t3: {:?}", t3);
```

That line requires `Tensor` to implement `Debug`. Without `#[derive(Debug)]` on `Tensor`, you get a compile error. With it, you get output like:

```
t3: Tensor { data: [5.0, 7.0, 9.0], shape: [3] }
```

## Takeaway

- **`{:?}`** in `println!` (or in format strings) needs the type to implement **Debug**.
- **`#[derive(Debug)]`** on a struct lets the compiler implement Debug for you.

Next: [Chapter 5 — Iterators](05-iterators.md)
