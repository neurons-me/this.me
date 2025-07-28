// src/cli.rs
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "this-me", version, about = "Declarative identity manager for dApps")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Initialize and save a new .me alias (uses `Me::new` + `.save`)
    Create {
        alias: String,
        hash: String,
    },
    /// List all .me aliases
    List,
    /// Delete a .me alias
    ///Delete {
       /// alias: String,
        ///hash: String,
    ///},
    /// Change the hash (password) of a .me alias
    ChangeHash {
        alias: String,
        old_hash: String,
        new_hash: String,
    },
    /// Load and display an existing .me alias
    Display {
        alias: String,
        hash: String,
    },
}