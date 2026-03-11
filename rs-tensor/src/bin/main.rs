use rs_tensor::tensor::Tensor;

fn main() {
    println!("Hello, world!");

    let t1 = Tensor::new(vec![1.0, 2.0, 3.0], vec![3]);
    let t2 = Tensor::new(vec![4.0, 5.0, 6.0], vec![3]);
    let t3 = t1.add(&t2);

    println!("t3: {:?}", t3);
}
