// this.me/crate/src/main.rs
// by suiGn

// ---- Only compile the CLI when the "sqlite" feature is enabled ----
#[cfg(feature = "sqlite")]
extern crate this_me;

#[cfg(feature = "sqlite")]
mod cli;

#[cfg(feature = "sqlite")]
use clap::Parser;

#[cfg(feature = "sqlite")]
use cli::{Cli, Commands};

#[cfg(feature = "sqlite")]
use this_me::me::{Me, MeError};

#[cfg(feature = "sqlite")]
use serde_json::{from_str, to_string_pretty, Value};

#[cfg(feature = "sqlite")]
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
                Ok(mut me) => match me.change_password(&old_password, &new_password) {
                    Ok(_) => println!("🔐 Password for '{}' changed successfully.", username),
                    Err(e) => eprintln!("❌ Failed to change password for '{}': {}", username, e),
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Display { username, password } => {
            match Me::load(&username, &password).and_then(|me| me.display()) {
                Ok(output) => {
                    match from_str::<Value>(&output)
                        .and_then(|val| to_string_pretty(&val).map_err(|e| e.into()))
                    {
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
        Commands::Be { username, password, value, context, key } => {
            match Me::load(&username, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.be(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ be('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply be('{}', '{}'): {}", key_str, value, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Communicate { username, password, value, context, key } => {
            match Me::load(&username, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.communicate(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ communicate('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply communicate('{}', '{}'): {}", key_str, value, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Do { username, password, value, context, key } => {
            match Me::load(&username, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.do_(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ do('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply do('{}', '{}'): {}", key_str, value, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Have { username, password, value, context, key } => {
            match Me::load(&username, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.have(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ have('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply have('{}', '{}'): {}", key_str, value, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::At { username, password, value, context, key } => {
            match Me::load(&username, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.at(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ at('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply at('{}', '{}'): {}", key_str, value, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Relate { username, password, value, context, key } => {
            match Me::load(&username, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.relate(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ relate('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply relate('{}', '{}'): {}", key_str, value, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::React { username, password, value, context, key } => {
            match Me::load(&username, &password) {
                Ok(mut me) => {
                    let ctx = context.clone().unwrap_or_else(|| me.context_id.clone());
                    let key_str = key.as_deref().unwrap_or("_");
                    match me.react(&ctx, key_str, &value) {
                        Ok(_) => println!("✅ react('{}', '{}') applied successfully.", key_str, value),
                        Err(e) => eprintln!("❌ Failed to apply react('{}', '{}'): {}", key_str, value, e),
                    }
                }
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Commands::Get { username, password, verb, context, key, value, limit, offset, since, until } => {
            match Me::load(&username, &password) {
                Ok(me) => {
                    match me.get(
                        &verb,
                        context.as_deref(),
                        key.as_deref(),
                        value.as_deref(),
                        None,
                        limit,
                        offset,
                        since.as_deref(),
                        until.as_deref(),
                    ) {
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
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
    }
}

#[cfg(not(feature = "sqlite"))]
fn main() {
    eprintln!("This binary requires the 'sqlite' feature enabled.");
}