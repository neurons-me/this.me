//this.me/cargo/src/main.rs
use this_me::Me; 
mod setup;

fn main() {
    setup::validate_setup(true); // Ensure ~/.this/me directory exists
    println!(".me >> init.");
}