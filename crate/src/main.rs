// this.me/crate/src/main.rs
// by suiGn
use owo_colors::OwoColorize;
use std::io::{self, Write};
use sha3::{Digest, Keccak256};
fn main() {
    // Header / logo
    println!(
        "{}",
        "
▄ ▄▄▄▄  ▗▞▀▚▖
  █ █ █ ▐▛▀▀▘
  █   █ ▝▚▄▄▖
             "
            .bright_green()
            .bold()
    );

    // Additional header block
    println!(
        "{}",
        "
   ┓   ┏┓
┓┏┏┣┓┏┓┏┛
┗┻┛┛┗┗┛•
        "
        .bright_white()
        .bold()
    );
// Input fields
    let mut username = String::new();
    let mut email = String::new();
    let mut secret = String::new();

    print!("› username: ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut username).unwrap();

    print!("› email: ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut email).unwrap();

    print!("› secret: ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut secret).unwrap();

    let username = username.trim();
    let email = email.trim();
    let secret = secret.trim();

    // ME hash: H(username || email || secret)
    let mut hasher = Keccak256::new();
    hasher.update(username.as_bytes());
    hasher.update(email.as_bytes());
    hasher.update(secret.as_bytes());
    let result = hasher.finalize();

    println!();
    println!("ME = 0x{}", hex::encode(result));
}
