use rs_tensor::tensor::Tensor;

fn main() {
    // 1D add (existing)
    let t1 = Tensor::new(vec![1.0, 2.0, 3.0], vec![3]);
    let t2 = Tensor::new(vec![4.0, 5.0, 6.0], vec![3]);
    let t3 = t1.add(&t2);
    println!("add: {:?}", t3);

    // 2D indexing
    let m = Tensor::new(vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0], vec![2, 3]);
    println!("m[0,0] = {:?}", m.get_2d(0, 0)); // Some(1.0)
    println!("m[1,2] = {:?}", m.get_2d(1, 2)); // Some(6.0)
    println!("m[5,0] = {:?}", m.get_2d(5, 0)); // None (out of bounds)

    // Element-wise mul
    let a = Tensor::new(vec![1.0, 2.0, 3.0, 4.0], vec![2, 2]);
    let b = Tensor::new(vec![5.0, 6.0, 7.0, 8.0], vec![2, 2]);
    let c = a.mul(&b);
    println!("mul: {:?}", c);
}
