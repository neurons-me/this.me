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
        Commands::Create { alias, password } => {
            match Me::new(&alias, &password) {
                Ok(_) => println!("✅ Identity '{}' created.", alias),
                Err(MeError::Io(ref err)) if err.kind() == std::io::ErrorKind::AlreadyExists => {
                    eprintln!("⚠️ Identity '{}' already exists.", alias);
                }
                Err(e) => eprintln!("❌ Failed to create identity '{}': {}", alias, e),
            }
        }
        Commands::ChangePassword { alias, old_password, new_password } => {
            match Me::load(&alias, &old_password) {
                Ok(mut me) => {
                    match me.change_password(&old_password, &new_password) {
                        Ok(_) => println!("🔐 Password for '{}' changed successfully.", alias),
                        Err(e) => eprintln!("❌ Failed to change password for '{}': {}", alias, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", alias, e),
            }
        }
        Commands::Display { alias, password } => {
            match Me::load(&alias, &password).and_then(|me| me.display()) {
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
        Commands::Be { alias, password, value, context, key } => {
            match Me::load(&alias, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.be(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ be('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply be('{}', '{}'): {}", key_str, value, e),
                    }
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", alias, e),
            }
        }
        Commands::Communicate { alias, password, value, context, key } => {
            match Me::load(&alias, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.communicate(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ communicate('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply communicate('{}', '{}'): {}", key_str, value, e),
                    }
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", alias, e),
            }
        }
        Commands::Do { alias, password, value, context, key } => {
            match Me::load(&alias, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.do_(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ do('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply do('{}', '{}'): {}", key_str, value, e),
                    }
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", alias, e),
            }
        }
        Commands::Have { alias, password, value, context, key } => {
            match Me::load(&alias, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.have(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ have('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply have('{}', '{}'): {}", key_str, value, e),
                    }
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", alias, e),
            }
        }
        Commands::At { alias, password, value, context, key } => {
            match Me::load(&alias, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.at(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ at('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply at('{}', '{}'): {}", key_str, value, e),
                    }
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", alias, e),
            }
        }
        Commands::Relate { alias, password, value, context, key } => {
            match Me::load(&alias, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.relate(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ relate('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply relate('{}', '{}'): {}", key_str, value, e),
                    }
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", alias, e),
            }
        }
        Commands::React { alias, password, value, context, key } => {
            match Me::load(&alias, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.react(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ react('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply react('{}', '{}'): {}", key_str, value, e),
                    }
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", alias, e),
            }
        }
        Commands::Get { alias, password, verb, context, key, value, limit, offset, since, until } => {
            match Me::load(&alias, &password) {
                Ok(me) => {
                    match me.get(&verb, context.as_deref(), key.as_deref(), value.as_deref(), None, limit, offset, since.as_deref(), until.as_deref()) {
                        Ok(results) => {
                            println!("📦 Retrieved {} entries:", verb);
                            if verb == "all" {
                                println!("ℹ️  Note: '--limit' applies *per verb*.");
                            }
                            for (vrb, f, v, ts) in &results {
                                println!("• {}('{}', '{}') @ {}", vrb, f, v, ts);
                            }
                            if let (Some(start), Some(end)) = (results.last(), results.first()) {
                                println!("⏳ Showing {} results from {} to {}", results.len(), start.3, end.3);
                            }
                        }
                        Err(e) => eprintln!("❌ Failed to get '{}': {}", verb, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", alias, e),
            }
        }
    }
}