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
    /// Create a new .me identity
    Create {
        username: String,
        hash: String,
    },
    /// List all .me identities
    List,
    /// Show the contents of a .me identity
    Show {
        username: String,
        hash: String,
    },
}