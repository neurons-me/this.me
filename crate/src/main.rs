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
        Commands::Create { username, password } => {
            match Me::new(&username, &password) {
                Ok(_) => println!("✅ Identity '{}' created.", username),
                Err(MeError::Io(ref err)) if err.kind() == std::io::ErrorKind::AlreadyExists => {
                    eprintln!("⚠️ Identity '{}' already exists.", username);
                }
                Err(e) => eprintln!("❌ Failed to create identity '{}': {}", username, e),
            }
        }
        Commands::ChangePassword { username, old_password, new_password } => {
            match Me::load(&username, &old_password) {
                Ok(mut me) => {
                    match me.change_password(&old_password, &new_password) {
                        Ok(_) => println!("🔐 Password for '{}' changed successfully.", username),
                        Err(e) => eprintln!("❌ Failed to change password for '{}': {}", username, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Display { username, password } => {
            match Me::load(&username, &password).and_then(|me| me.display()) {
                    Ok(output) => {
                    match from_str::<Value>(&output).and_then(|val| to_string_pretty(&val).map_err(|e| e.into())) {
                        Ok(pretty_output) => println!("📖 Identity Details:\n{}", pretty_output),
                        Err(_) => println!("📖 Identity Details:\n{}", output),
                    }
                }
                Err(e) => eprintln!("❌ Failed to display identity '{}': {}", username, e),
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
        Commands::Be { username, password, key, value } => {
            match Me::load(&username, &password) {
                Ok(mut me) => match me.be(&key, &value) {
                    Ok(_) => println!("✅ be('{}', '{}') applied successfully.", key, value),
                    Err(e) => eprintln!("❌ Failed to apply be('{}', '{}'): {}", key, value, e),
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Communication { username, password, key, value } => {
            match Me::load(&username, &password) {
                Ok(mut me) => match me.communication(&key, &value) {
                    Ok(_) => println!("✅ communication('{}', '{}') applied successfully.", key, value),
                    Err(e) => eprintln!("❌ Failed to apply communication('{}', '{}'): {}", key, value, e),
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Do { username, password, key, value } => {
            match Me::load(&username, &password) {
                Ok(mut me) => match me.do_(&key, &value) {
                    Ok(_) => println!("✅ do('{}', '{}') applied successfully.", key, value),
                    Err(e) => eprintln!("❌ Failed to apply do('{}', '{}'): {}", key, value, e),
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Have { username, password, key, value } => {
            match Me::load(&username, &password) {
                Ok(mut me) => match me.have(&key, &value) {
                    Ok(_) => println!("✅ have('{}', '{}') applied successfully.", key, value),
                    Err(e) => eprintln!("❌ Failed to apply have('{}', '{}'): {}", key, value, e),
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::At { username, password, key, value } => {
            match Me::load(&username, &password) {
                Ok(mut me) => match me.at(&key, &value) {
                    Ok(_) => println!("✅ at('{}', '{}') applied successfully.", key, value),
                    Err(e) => eprintln!("❌ Failed to apply at('{}', '{}'): {}", key, value, e),
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Relate { username, password, key, value } => {
            match Me::load(&username, &password) {
                Ok(mut me) => match me.relate(&key, &value) {
                    Ok(_) => println!("✅ relate('{}', '{}') applied successfully.", key, value),
                    Err(e) => eprintln!("❌ Failed to apply relate('{}', '{}'): {}", key, value, e),
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::React { username, password, key, value } => {
            match Me::load(&username, &password) {
                Ok(mut me) => match me.react(&key, &value) {
                    Ok(_) => println!("✅ react('{}', '{}') applied successfully.", key, value),
                    Err(e) => eprintln!("❌ Failed to apply react('{}', '{}'): {}", key, value, e),
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Get { username, password, verb, key } => {
            match Me::load(&username, &password) {
                Ok(me) => {
                    match me.get(&verb, key.as_deref(), None) {
                        Ok(results) => {
                            println!("📦 Retrieved {} entries for '{}':", verb, key.clone().unwrap_or("*".into()));
                            for (k, v, ts) in results {
                                println!("• {} => {} @ {}", k, v, ts);
                            }
                        }
                        Err(e) => eprintln!("❌ Failed to get '{}': {}", verb, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
    }
}