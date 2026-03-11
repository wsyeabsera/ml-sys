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
    /// Get a single element from a 2D tensor by (row, col).
    ///
    /// Returns `None` if the indices are out of bounds or the tensor
    /// isn't 2D. Uses the row-major formula: `index = row * num_cols + col`.
    pub fn get_2d(&self, row: usize, col: usize) -> Option<f32> {
        if self.shape.len() != 2 {
            return None;
        }
        let (num_rows, num_cols) = (self.shape[0], self.shape[1]);
        if row >= num_rows || col >= num_cols {
            return None;
        }
        Some(self.data[row * num_cols + col])
    }

    /// Element-wise multiplication: same pattern as `add` but with `*`.
    pub fn mul(&self, other: &Tensor) -> Tensor {
        assert_eq!(self.shape, other.shape, "shape mismatch for mul");
        let data = self
            .data
            .iter()
            .zip(other.data.iter())
            .map(|(a, b)| a * b)
            .collect();
        Tensor::new(data, self.shape.clone())
    }

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