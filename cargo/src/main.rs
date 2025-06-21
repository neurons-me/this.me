// src/main.rs
extern crate this_me;
mod cli;
use this_me::utils::setup::validate_setup;
use this_me::me::Me;
use cli::Cli;
use cli::Commands;
use clap::Parser;
use serde_json::{from_str, to_string_pretty, Value};

fn main() {
    if let Err(e) = validate_setup(false) {
        eprintln!("❌ Error al inicializar el entorno: {}", e);
        if e.kind() == std::io::ErrorKind::PermissionDenied {
            eprintln!("🔐 Permisos insuficientes. Intenta usar permisos adecuados o verifica acceso a tu HOME.");
        }
        std::process::exit(1);
    }

    let cli = Cli::parse();

    match cli.command {
        Commands::Create { username, hash } => {
            match Me::new(&username, &hash) {
                Ok(me) => match me.save(&hash) {
                    Ok(_) => println!("✅ Identity '{}' created and saved.", username),
                    Err(e) => eprintln!("❌ Failed to save identity '{}': {}", username, e),
                },
                Err(ref e) if e.kind() == std::io::ErrorKind::AlreadyExists => {
                    eprintln!("⚠️ Identity '{}' already exists.", username);
                }
                Err(e) => eprintln!("❌ Failed to create identity '{}': {}", username, e),
            }
        }
        Commands::List => {
            match Me::list() {
                Ok(identities) => {
                    if identities.is_empty() {
                        println!("📭 No identities found.");
                    } else {
                        println!("📂 Found identities:");
                        for id in identities {
                            println!("• {}", id);
                        }
                    }
                }
                Err(e) => eprintln!("❌ Error listing identities: {}", e),
            }
        }
        Commands::Delete { username, hash } => {
            match Me::delete(&username, &hash) {
                Ok(_) => println!("🗑️ Identity '{}' deleted.", username),
                Err(e) => eprintln!("❌ Failed to delete identity '{}': {}", username, e),
            }
        }
        Commands::ChangeHash { username, old_hash, new_hash } => {
            match Me::new(&username, &old_hash) {
                Ok(me) => {
                    match me.change_hash(&old_hash, &new_hash) {
                        Ok(_) => println!("🔐 Password for '{}' changed successfully.", username),
                        Err(e) => eprintln!("❌ Failed to change password for '{}': {}", username, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Be { username, hash, key, value } => {
            match Me::load(&username, &hash) {
                Ok(mut me) => {
                    if let Err(e) = me.be(&key, &value).and_then(|_| me.save(&hash)) {
                        eprintln!("❌ Failed to apply 'be' on '{}': {}", username, e);
                    } else {
                        println!("✅ Added '{}: {}' to '{}'.", key, value, username);
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Have { username, hash, key, value } => {
            match Me::load(&username, &hash) {
                Ok(mut me) => {
                    if let Err(e) = me.have(&key, &value).and_then(|_| me.save(&hash)) {
                        eprintln!("❌ Failed to apply 'have' on '{}': {}", username, e);
                    } else {
                        println!("✅ Added '{}: {}' to '{}'.", key, value, username);
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::At { username, hash, key, value } => {
            match Me::load(&username, &hash) {
                Ok(mut me) => {
                    if let Err(e) = me.at(&key, &value).and_then(|_| me.save(&hash)) {
                        eprintln!("❌ Failed to apply 'at' on '{}': {}", username, e);
                    } else {
                        println!("✅ Added '{}: {}' to '{}'.", key, value, username);
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Relate { username, hash, key, value } => {
            match Me::load(&username, &hash) {
                Ok(mut me) => {
                    if let Err(e) = me.relate(&key, &value).and_then(|_| me.save(&hash)) {
                        eprintln!("❌ Failed to apply 'relate' on '{}': {}", username, e);
                    } else {
                        println!("✅ Added '{}: {}' to '{}'.", key, value, username);
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::React { username, hash, key, value } => {
            match Me::load(&username, &hash) {
                Ok(mut me) => {
                    if let Err(e) = me.react(&key, &value).and_then(|_| me.save(&hash)) {
                        eprintln!("❌ Failed to apply 'react' on '{}': {}", username, e);
                    } else {
                        println!("✅ Added '{}: {}' to '{}'.", key, value, username);
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Say { username, hash, key, value } => {
            match Me::load(&username, &hash) {
                Ok(mut me) => {
                    if let Err(e) = me.say(&key, &value).and_then(|_| me.save(&hash)) {
                        eprintln!("❌ Failed to apply 'say' on '{}': {}", username, e);
                    } else {
                        println!("✅ Added '{}: {}' to '{}'.", key, value, username);
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Display { username, hash } => {
            match Me::display(&username, &hash) {
                Ok(output) => {
                    match from_str::<Value>(&output).and_then(|val| to_string_pretty(&val).map_err(|e| e.into())) {
                        Ok(pretty_output) => println!("📖 Identity Details:\n{}", pretty_output),
                        Err(_) => println!("📖 Identity Details:\n{}", output),
                    }
                }
                Err(e) => eprintln!("❌ Failed to display identity '{}': {}", username, e),
            }
        }
    }
}