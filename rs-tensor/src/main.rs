//! # rs-tensor
//!
//! A small tensor library for learning Rust. The API is documented in the
//! generated docs; for a **concept-level walkthrough** (ownership, iterators,
//! why we use `Debug`, etc.), see `docs/learning.md` in the project root.

mod tensor;

fn main() {
    println!("Hello, world!");

    // Create two 1D tensors of length 3 (shape [3]). We pass ownership of
    // the Vecs into Tensor::new; the tensors own their data.
    let t1 = tensor::Tensor::new(vec![1.0, 2.0, 3.0], vec![3]);
    let t2 = tensor::Tensor::new(vec![4.0, 5.0, 6.0], vec![3]);

    // add takes &t2 (a reference) so t2 is still valid after this line.
    // We get back a new Tensor; t3 owns its data.
    let t3 = t1.add(&t2);

    // {:?} requires Tensor to implement Debug; we get that from #[derive(Debug)].
    println!("t3: {:?}", t3);
}
