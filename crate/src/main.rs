// this.me/crate/src/main.rs
// by suiGn
extern crate this_me;
mod cli;
use this_me::me::{Me, MeError};
use cli::Cli;
use cli::Commands;
use clap::Parser;
use serde_json::{from_str, to_string_pretty, Value};

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Create { alias, hash } => {
            match Me::new(&alias, &hash) {
                Ok(_) => println!("✅ Identity '{}' created.", alias),
                Err(MeError::Io(ref err)) if err.kind() == std::io::ErrorKind::AlreadyExists => {
                    eprintln!("⚠️ Identity '{}' already exists.", alias);
                }
                Err(e) => eprintln!("❌ Failed to create identity '{}': {}", alias, e),
            }
        }
        Commands::ChangeHash { alias, old_hash, new_hash: _ } => {
            match Me::new(&alias, &old_hash) {
                Ok(_me) => {
                    // match me.change_hash(&old_hash, &new_hash) {
                    //     Ok(_) => println!("🔐 Password for '{}' changed successfully.", alias),
                    //     Err(e) => eprintln!("❌ Failed to change password for '{}': {}", alias, e),
                    // }
                    todo!()
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", alias, e),
            }
        }
        Commands::Display { alias, hash } => {
            match Me::load(&alias, &hash).and_then(|me| me.display()) {
                Ok(output) => {
                    match from_str::<Value>(&output).and_then(|val| to_string_pretty(&val).map_err(|e| e.into())) {
                        Ok(pretty_output) => println!("📖 Identity Details:\n{}", pretty_output),
                        Err(_) => println!("📖 Identity Details:\n{}", output),
                    }
                }
                Err(e) => eprintln!("❌ Failed to display identity '{}': {}", alias, e),
            }
        }
        Commands::List => {
            use std::fs;

            let base_path = dirs::home_dir()
                .map(|p| p.join(".this/me"))
                .expect("❌ Could not determine home directory.");

            match fs::read_dir(&base_path) {
                Ok(entries) => {
                    let mut found = false;
                    println!("📂 Found identities:");
                    for entry in entries.flatten() {
                        if entry.path().is_dir() {
                            if let Some(name) = entry.file_name().to_str() {
                                println!("• {}", name);
                                found = true;
                            }
                        }
                    }
                    if !found {
                        println!("📭 No identities found.");
                    }
                }
                Err(_) => println!("📭 No identities found."),
            }
        }
    }
}