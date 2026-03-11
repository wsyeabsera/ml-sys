//! # Tensor module
//!
//! A simple tensor type for learning Rust: a multi-dimensional array of `f32`s
//! with a flat `data` buffer and a `shape` that describes the dimensions.
//!
//! For a walkthrough of the concepts (ownership, iterators, `Debug`, etc.),
//! see the learning book in `docs/` (start with `docs/README.md`).

// Lets us use `println!("{:?}", tensor)` — the compiler generates a Debug impl.
#[derive(Debug)]
pub struct Tensor {
    /// Flattened element storage (row-major). All elements in one `Vec`.
    pub data: Vec<f32>,
    /// Dimensions, e.g. `[3]` for length 3, `[2, 3]` for a 2×3 tensor.
    pub shape: Vec<usize>,
}

impl Tensor {
    /// Build a tensor from a flat data buffer and shape.
    ///
    /// The length of `data` should equal the product of the shape dimensions
    /// (e.g. shape `[2, 3]` → 6 elements). We don't validate that yet.
    pub fn new(data: Vec<f32>, shape: Vec<usize>) -> Self {
        Self { data, shape }
    }

    /// Element-wise addition: returns a new tensor whose elements are
    /// `self[i] + other[i]`. Panics if shapes differ.
    ///
    /// We take `&self` and `other: &Tensor` so we don't take ownership;
    /// we only read both tensors and return a new one. The chain
    /// `.iter().zip(...).map(...).collect()` pairs elements, adds them,
    /// and collects into a new `Vec<f32>`.
    pub fn add(&self, other: &Tensor) -> Tensor {
        assert_eq!(self.shape, other.shape, "shape mismatch for add");
        let data = self
            .data
            .iter()
            .zip(other.data.iter())
            .map(|(a, b)| a + b)
            .collect();
        Tensor::new(data, self.shape.clone())
    }
}