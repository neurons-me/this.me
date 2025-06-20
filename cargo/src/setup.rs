// src/setup.rs
use std::fs;
use std::path::PathBuf;
use std::env;

pub fn validate_setup(verbose: bool) {
    let home = env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let root = PathBuf::from(format!("{}/.this", home));
    let me_path = root.join("me");

    let mut updated = false;

    if !root.exists() {
        fs::create_dir_all(&root).unwrap();
        if verbose { println!("✅ Created ~/.this root directory"); }
        updated = true;
    }

    if !me_path.exists() {
        fs::create_dir_all(&me_path).unwrap();
        if verbose { println!("✅ Created ~/.this/me directory"); }
        updated = true;
    }

    if !updated && verbose {
        println!(".me >> init.");
    }
}