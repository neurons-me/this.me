// src/main.rs
extern crate this_me;
mod cli;
use std::fs::File;
use std::io::Read;
use this_me::utils::setup::validate_setup;
use this_me::me::Me;
use cli::Cli;
use cli::Commands;
use clap::Parser;

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
            match Me::create(&username, &hash) {
                Ok(_) => println!("✅ Identity '{}' created.", username),
                Err(ref e) if e.kind() == std::io::ErrorKind::AlreadyExists => {
                    eprintln!("⚠️ Identity '{}' already exists.", username);
                }
                Err(e) => eprintln!("❌ Failed to create identity: {}", e),
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
        Commands::Show { username, hash } => {
            match Me::new(&username) {
                Ok(me) => {
                    let file = File::open(&me.file_path);
                    if let Ok(mut file) = file {
                        let mut buffer = Vec::new();
                        if file.read_to_end(&mut buffer).is_ok() {
                            match me.decrypt(&buffer, &hash) {
                                Ok(content) => {
                                    println!("👁️ Identity '{}':", username);
                                    println!("{}", content);
                                }
                                Err(_) => eprintln!("❌ Failed to unlock identity '{}': incorrect hash or corrupted file.", username),
                            }
                        } else {
                            eprintln!("❌ Failed to read identity file '{}'.", username);
                        }
                    } else {
                        eprintln!("❌ Failed to open identity file '{}'.", username);
                    }
                }
                Err(e) => {
                    eprintln!("❌ Failed to load identity '{}': {}", username, e);
                }
            }
        }
    }
}