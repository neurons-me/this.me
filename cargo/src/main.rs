struct Me {
    name: String,
    age: u32,
}

fn main() {
    let me = Me {
        name: "suiGn".to_string(),
        age: 33,
    };

    println!("{:?}", me);
}