///src/cli.rs
use clap::{Parser, Subcommand};
#[derive(Parser)]
#[command(name = ".me", version, about = "Generate and manage .me identities.")]
#[command(subcommand_required = false)]
#[command(arg_required_else_help = false)]
pub struct Cli {
    #[arg(long, global = true)]
    pub username: Option<String>,
    #[arg(long, global = true)]
    pub password: Option<String>,
    #[command(subcommand)]
    pub command: Option<Commands>,
}
#[derive(Subcommand)]
pub enum Commands {
/*ⒸⓄⓂⓂⒶⓃⒹⓈ*/
/// Display the default who? flow
    Who,
/// Initialize and save a new .me alias (uses `Me::new` + `.save`). An alias must be explicitly provided.
    Create {
    },
/// List all .me users
    Users,
/// List all available .me users (alias: users.me)
    UsersMe,
/// Display information about the current host (hostname, network interfaces, etc.)
    Host,
/// Display information about all network interfaces (LAN, IPs, etc.)
    HostIp,
/// Change the password of a .me alias
    ChangePassword {
        #[arg(long)]
        old_password: String,
        #[arg(long)]
        new_password: String,
    },
/// View any object or instance (JSON, ID, or literal)
    View {
        /// The object or instance to view
        target: Vec<String>,
    },
    /// Create or navigate a symbolic link between .me contexts or paths
    Link {
        /// The path or context to link to
        #[arg(long)]
        path: Vec<String>,
    },
/*
╦  ╦┌─┐┬─┐┌┐ ┌─┐
╚╗╔╝├┤ ├┬┘├┴┐└─┐
 ╚╝ └─┘┴└─└─┘└─┘*/
/// Set a 'be' attribute for a .me identity
    Be {
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
        value: String,
        #[arg(long, name = "context")]
        context: Option<String>,
        #[arg(long)]
        key: Option<String>,
    },
/// Set a 'have' attribute for a .me identity
    Have {
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
        value: String,
        #[arg(long, name = "context")]
        context: Option<String>,
        #[arg(long)]
        key: Option<String>,
    },
/// Set a 'relate' attribute for a .me identity
    Relate {
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
        value: String,
        #[arg(long, name = "context")]
        context: Option<String>,
        #[arg(long)]
        key: Option<String>,
    },
/// Set a 'communicate' attribute for a .me identity
    Communicate {
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
    }
}
