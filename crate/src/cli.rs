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
    /// Initialize and save a new .me alias (uses `Me::new` + `.save`). An alias must be explicitly provided.
    Create {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
    },
    /// List all .me aliases
    List,
    /// Change the password of a .me alias
    ChangePassword {
        #[arg(long)]
        username: String,
        #[arg(long)]
        old_password: String,
        #[arg(long)]
        new_password: String,
    },
    /// Load and display an existing .me alias
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
        value: String,
        #[arg(long, name = "context")]
        context: Option<String>,
        #[arg(long)]
        key: Option<String>,
    },

    /// Set a 'do' attribute for a .me identity
    Do {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        value: String,
        #[arg(long, name = "context")]
        context: Option<String>,
        #[arg(long)]
        key: Option<String>,
    },

    /// Set a 'have' attribute for a .me identity
    Have {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        value: String,
        #[arg(long, name = "context")]
        context: Option<String>,
        #[arg(long)]
        key: Option<String>,
    },

    /// Set an 'at' attribute for a .me identity
    At {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        value: String,
        #[arg(long, name = "context")]
        context: Option<String>,
        #[arg(long)]
        key: Option<String>,
    },

    /// Set a 'relate' attribute for a .me identity
    Relate {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        value: String,
        #[arg(long, name = "context")]
        context: Option<String>,
        #[arg(long)]
        key: Option<String>,
    },

    /// Set a 'react' attribute for a .me identity
    React {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        value: String,
        #[arg(long, name = "context")]
        context: Option<String>,
        #[arg(long)]
        key: Option<String>,
    },

    /// Set a 'communicate' attribute for a .me identity
    Communicate {
        #[arg(long)]
        username: String,
        #[arg(long)]
        password: String,
        #[arg(long)]
        value: String,
        #[arg(long, name = "context")]
        context: Option<String>,
        #[arg(long)]
        key: Option<String>,
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
        value: Option<String>,
        #[arg(long, name = "context")]
        context: Option<String>,
        #[arg(long)]
        key: Option<String>,
        #[arg(long)]
        limit: Option<usize>,
        #[arg(long)]
        offset: Option<usize>,
        #[arg(long)]
        since: Option<String>,
        #[arg(long)]
        until: Option<String>,
    },
}