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
    /// Initialize and save a new .me username (uses `Me::new` + `.save`). A username must be explicitly provided.
    Create {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
    },
    /// List all .me usernames
    List,
    /// Change the password of a .me username
    ChangePassword {
        #[arg(long)]
        username: String,
        #[arg(long)]
        old_password: String,
        #[arg(long)]
        new_password: String,
    },
    /// Load and display an existing .me username
    Display {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
    },
    /// Set a 'be' attribute for a .me identity
    Be {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        key: String,
        #[arg(long)]
        value: String,
    },

    /// Set a 'do' attribute for a .me identity
    Do {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        key: String,
        #[arg(long)]
        value: String,
    },

    /// Set a 'have' attribute for a .me identity
    Have {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        key: String,
        #[arg(long)]
        value: String,
    },

    /// Set an 'at' attribute for a .me identity
    At {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        key: String,
        #[arg(long)]
        value: String,
    },

    /// Set a 'relate' attribute for a .me identity
    Relate {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        key: String,
        #[arg(long)]
        value: String,
    },

    /// Set a 'react' attribute for a .me identity
    React {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        key: String,
        #[arg(long)]
        value: String,
    },

/// Set a 'communication' attribute for a .me identity
    Communication {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        key: String,
        #[arg(long)]
        value: String,
    },

/// Retrieve a value from .me using the `get` method
    Get {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        verb: String,
        #[arg(long)]
        key: Option<String>,
    },
}