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
    /// Initialize and save a new .me identity (uses `Me::new` + `.save`)
    Create {
        username: String,
        hash: String,
    },
    /// List all .me identities
    List,
    /// Delete a .me identity
    Delete {
        username: String,
        hash: String,
    },
    /// Change the hash (password) of a .me identity
    ChangeHash {
        username: String,
        old_hash: String,
        new_hash: String,
    },
    /// Load and display an existing .me identity
    Display {
        username: String,
        hash: String,
    },
    /// Add a `be` attribute to the identity
    Be {
        username: String,
        hash: String,
        key: String,
        value: String,
    },
    /// Add a `have` attribute to the identity
    Have {
        username: String,
        hash: String,
        key: String,
        value: String,
    },
    /// Add an `at` attribute to the identity
    At {
        username: String,
        hash: String,
        key: String,
        value: String,
    },
    /// Add a `relate` attribute to the identity
    Relate {
        username: String,
        hash: String,
        key: String,
        value: String,
    },
    /// Add a `react` attribute to the identity
    React {
        username: String,
        hash: String,
        key: String,
        value: String,
    },
    /// Add a `say` attribute to the identity
    Say {
        username: String,
        hash: String,
        key: String,
        value: String,
    },
}