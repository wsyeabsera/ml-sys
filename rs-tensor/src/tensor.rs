//! # Tensor module
//!
//! A simple tensor type for learning Rust: a multi-dimensional array of `f32`s
//! with a flat `data` buffer, a `shape`, and `strides` for interpreting layout.
//!
//! For a walkthrough of the concepts (ownership, iterators, strides, etc.),
//! see the learning book in `docs/` (start with `docs/README.md`).

#[derive(Debug, Clone)]
pub struct Tensor {
    /// Flattened element storage (row-major). All elements in one `Vec`.
    pub data: Vec<f32>,
    /// Dimensions, e.g. `[3]` for length 3, `[2, 3]` for a 2×3 tensor.
    pub shape: Vec<usize>,
    /// How far to jump in `data` per step in each dimension.
    /// For a row-major [2, 3] tensor, strides are [3, 1]:
    /// advance 1 in dim 0 (row) → skip 3 elements,
    /// advance 1 in dim 1 (col) → skip 1 element.
    pub strides: Vec<usize>,
}

impl Tensor {
    /// Compute row-major strides from a shape.
    ///
    /// Starts from the right with stride 1, then each stride to the left
    /// is the product of all sizes to its right.
    /// e.g. shape [2, 3, 4] → strides [12, 4, 1].
    pub fn compute_strides(shape: &[usize]) -> Vec<usize> {
        let mut strides = vec![1; shape.len()];
        for i in (0..shape.len().saturating_sub(1)).rev() {
            strides[i] = strides[i + 1] * shape[i + 1];
        }
        strides
    }

    /// Build a tensor from a flat data buffer and shape.
    /// Strides are computed automatically (row-major).
    pub fn new(data: Vec<f32>, shape: Vec<usize>) -> Self {
        let strides = Self::compute_strides(&shape);
        Self {
            data,
            shape,
            strides,
        }
    }

    /// Get a single element from a 2D tensor by (row, col).
    ///
    /// Returns `None` if the indices are out of bounds or the tensor
    /// isn't 2D. Uses strides: `index = row * strides[0] + col * strides[1]`.
    pub fn get_2d(&self, row: usize, col: usize) -> Option<f32> {
        if self.shape.len() != 2 {
            return None;
        }
        if row >= self.shape[0] || col >= self.shape[1] {
            return None;
        }
        let index = row * self.strides[0] + col * self.strides[1];
        Some(self.data[index])
    }

    /// Get a single element by N-dimensional indices.
    ///
    /// The number of indices must match the number of dimensions.
    /// Each index must be within bounds for its dimension.
    /// Computes the flat index as: `sum(indices[i] * strides[i])`.
    pub fn get(&self, indices: &[usize]) -> Option<f32> {
        if indices.len() != self.shape.len() {
            return None;
        }
        for (idx, dim) in indices.iter().zip(self.shape.iter()) {
            if idx >= dim {
                return None;
            }
        }
        let flat: usize = indices
            .iter()
            .zip(self.strides.iter())
            .map(|(i, s)| i * s)
            .sum();
        Some(self.data[flat])
    }

    /// Reshape: return a new tensor with a different shape but the same data.
    ///
    /// The product of the new shape must equal the number of elements.
    /// If this tensor has non-contiguous strides (e.g. after transpose),
    /// the data is first copied into contiguous order.
    pub fn reshape(&self, new_shape: Vec<usize>) -> Option<Tensor> {
        let new_size: usize = new_shape.iter().product();
        if new_size != self.data.len() {
            return None;
        }
        // If strides are non-contiguous, collect data in logical order first
        let data = if self.is_contiguous() {
            self.data.clone()
        } else {
            self.to_contiguous_data()
        };
        Some(Tensor::new(data, new_shape))
    }

    /// Transpose: swap two dimensions. Doesn't copy data — just swaps
    /// the shape and strides entries.
    ///
    /// For a 2D tensor this is the classic matrix transpose.
    /// For N-D, you pick which two axes to swap.
    pub fn transpose(&self, dim0: usize, dim1: usize) -> Option<Tensor> {
        if dim0 >= self.shape.len() || dim1 >= self.shape.len() {
            return None;
        }
        let mut new_shape = self.shape.clone();
        let mut new_strides = self.strides.clone();
        new_shape.swap(dim0, dim1);
        new_strides.swap(dim0, dim1);
        Some(Tensor {
            data: self.data.clone(),
            shape: new_shape,
            strides: new_strides,
        })
    }

    /// Check if the tensor's strides match contiguous row-major layout.
    pub fn is_contiguous(&self) -> bool {
        self.strides == Self::compute_strides(&self.shape)
    }

    /// Collect elements in logical (shape) order into a new Vec.
    /// Used when a non-contiguous tensor needs to be materialized
    /// (e.g. before reshape).
    fn to_contiguous_data(&self) -> Vec<f32> {
        let n: usize = self.shape.iter().product();
        let ndim = self.shape.len();
        let mut result = Vec::with_capacity(n);
        let mut indices = vec![0usize; ndim];

        for _ in 0..n {
            let flat: usize = indices
                .iter()
                .zip(self.strides.iter())
                .map(|(i, s)| i * s)
                .sum();
            result.push(self.data[flat]);

            // Increment indices (odometer-style, rightmost first)
            for d in (0..ndim).rev() {
                indices[d] += 1;
                if indices[d] < self.shape[d] {
                    break;
                }
                indices[d] = 0;
            }
        }
        result
    }

    /// Create a tensor filled with zeros.
    pub fn zeros(shape: Vec<usize>) -> Self {
        let size: usize = shape.iter().product();
        Tensor::new(vec![0.0; size], shape)
    }

    /// Create a tensor filled with ones.
    pub fn ones(shape: Vec<usize>) -> Self {
        let size: usize = shape.iter().product();
        Tensor::new(vec![1.0; size], shape)
    }

    /// Sum all elements into a scalar (1-element tensor with shape [1]).
    pub fn sum(&self) -> Tensor {
        let total: f32 = self.data.iter().sum();
        Tensor::new(vec![total], vec![1])
    }

    /// Scale every element by a scalar value.
    pub fn scale(&self, scalar: f32) -> Tensor {
        let data = self.data.iter().map(|x| x * scalar).collect();
        Tensor::new(data, self.shape.clone())
    }

    /// Matrix multiplication for 2D tensors: [M, K] x [K, N] → [M, N].
    ///
    /// Uses the naive triple-loop algorithm. Both tensors must be 2D
    /// and the inner dimensions must match.
    pub fn matmul(&self, other: &Tensor) -> Tensor {
        assert_eq!(self.shape.len(), 2, "matmul requires 2D tensors");
        assert_eq!(other.shape.len(), 2, "matmul requires 2D tensors");
        let (m, k1) = (self.shape[0], self.shape[1]);
        let (k2, n) = (other.shape[0], other.shape[1]);
        assert_eq!(k1, k2, "matmul inner dimensions must match: {} vs {}", k1, k2);

        // Ensure both tensors are contiguous for simple indexing
        let a_data = if self.is_contiguous() {
            &self.data
        } else {
            &self.to_contiguous_data()
        };
        let b_data = if other.is_contiguous() {
            &other.data
        } else {
            &other.to_contiguous_data()
        };

        let mut result = vec![0.0f32; m * n];
        for i in 0..m {
            for j in 0..n {
                let mut sum = 0.0f32;
                for p in 0..k1 {
                    sum += a_data[i * k1 + p] * b_data[p * n + j];
                }
                result[i * n + j] = sum;
            }
        }
        Tensor::new(result, vec![m, n])
    }

    /// Element-wise addition. Panics if shapes differ.
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

    /// Element-wise multiplication. Panics if shapes differ.
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
}
