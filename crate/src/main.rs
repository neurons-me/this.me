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
use serde_json::{to_string_pretty, Value};

#[cfg(feature = "sqlite")]
use owo_colors::OwoColorize;
#[cfg(feature = "sqlite")]
use std::io::IsTerminal;
#[cfg(feature = "sqlite")]
use std::sync::Arc;
#[cfg(feature = "sqlite")]
use std::path::PathBuf;
#[cfg(feature = "sqlite")]
use std::fs;
#[cfg(feature = "sqlite")]
use std::time::SystemTime;
#[cfg(feature = "sqlite")]
use serde::{Serialize, Deserialize};

#[cfg(feature = "sqlite")]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DigitalAsset {
    pub name: String,
    pub path: PathBuf,
    pub is_dir: bool,
    pub size: Option<u64>,
    pub modified: Option<SystemTime>,
}

#[cfg(feature = "sqlite")]
pub type AssetRef = Arc<DigitalAsset>;

#[cfg(feature = "sqlite")]
fn main() {
    let cli = Cli::parse();
    let colored_output = std::io::stdout().is_terminal();
    if colored_output {
        // Print a compact merged QR code and .me ASCII logo (logo embedded in QR)
        {
            // Use fast_qr::qr (or qrcodegen) for high error correction, small QR, logo overlay
            use owo_colors::OwoColorize;
            use std::io::{self, Write};
            let active_user = "suign";
            let qr_data = format!("me://{}#public_key_example", active_user);

            // Get terminal width to scale QR accordingly
            let term_width = match std::env::var("COLUMNS")
                .ok()
                .and_then(|v| v.parse::<usize>().ok())
            {
                Some(w) if w > 0 => w,
                _ => {
                    // Try to detect with term_size or fallback
                    #[cfg(unix)]
                    {
                        use libc::{ioctl, winsize, STDOUT_FILENO, TIOCGWINSZ};
                        unsafe {
                            let mut ws: winsize = std::mem::zeroed();
                            if ioctl(STDOUT_FILENO, TIOCGWINSZ, &mut ws) == 0 && ws.ws_col > 0 {
                                ws.ws_col as usize
                            } else {
                                80
                            }
                        }
                    }
                    #[cfg(not(unix))]
                    {
                        80
                    }
                }
            };

            // --- Generate QR code with high error correction (H), size <= 30x30 ---
            // Use qrcodegen (already in qrcode crate as qrcodegen::QrCode)
            use qrcode::QrCode;
            use qrcode::types::QrErrorCorrectionLevel;
            let qr = QrCode::with_error_correction_level(qr_data.as_bytes(), QrErrorCorrectionLevel::High).unwrap();
            let orig_size = qr.size();
            // Clamp QR to max 30x30
            let qr_size = if orig_size > 30 { 30 } else { orig_size };
            // If QR is too big, crop (rare for short data)
            // We'll only render a qr_size x qr_size region from the center
            let qr_offset = if orig_size > qr_size { (orig_size - qr_size) / 2 } else { 0 };

            // .me logo ASCII, bold, bright green (same as before)
            let me_art = [
                "▄ ▄▄▄▄  ▗▞▀▚▖",
                "  █ █ █ ▐▛▀▀▘",
                "  █   █ ▝▚▄▄▖",
            ];
            let me_h = me_art.len();
            let me_w = me_art[0].chars().count();

            // Determine scaling: each QR module is 2 chars wide, so actual width = qr_size*2 + quiet*2*2
            let quiet_zone = 2usize; // 2 modules is enough for terminal
            let max_qr_display_w = term_width.saturating_sub(2); // leave a little margin
            let qr_display_w = (qr_size + quiet_zone * 2) * 2;
            // If too wide, shrink QR (rare)
            let mut scale = 1usize;
            if qr_display_w > max_qr_display_w {
                // Try to shrink by reducing QR size
                let max_modules = (max_qr_display_w / 2).saturating_sub(quiet_zone * 2);
                if max_modules < qr_size {
                    scale = 1;
                }
            }
            // Overlay logo to be ~1/3 of QR width
            let overlay_w = (qr_size as f32 / 3.0).round() as usize;
            let logo_scale = if me_w > 0 { overlay_w.saturating_div(me_w).max(1) } else { 1 };
            let scaled_me_w = me_w * logo_scale;
            let scaled_me_h = me_h * logo_scale;
            let me_start_y = if qr_size > scaled_me_h { qr_size / 2 - scaled_me_h / 2 } else { 0 };
            let me_start_x = if qr_size > scaled_me_w { qr_size / 2 - scaled_me_w / 2 } else { 0 };

            // Print top quiet zone
            let margin_line = " ".repeat((qr_size + quiet_zone * 2) * 2);
            for _ in 0..quiet_zone {
                println!("{}", margin_line);
            }
            // Each QR line
            for y in 0..qr_size {
                let mut line = String::new();
                // Left quiet zone
                line.push_str(&" ".repeat(quiet_zone * 2));
                for x in 0..qr_size {
                    // Overlay .me ASCII art in the center, scaled
                    let in_overlay = y >= me_start_y && y < me_start_y + scaled_me_h
                        && x >= me_start_x && x < me_start_x + scaled_me_w;
                    if in_overlay {
                        let char_x = (x - me_start_x) / logo_scale;
                        let char_y = (y - me_start_y) / logo_scale;
                        let c = me_art[char_y].chars().nth(char_x).unwrap_or(' ');
                        if c != ' ' {
                            line.push_str(&c.to_string().bright_green().bold().to_string());
                            line.push(' '); // keep width even
                            continue;
                        } else {
                            // fall through to QR rendering
                        }
                    }
                    let is_dark = qr.get_module(x as i32 + qr_offset as i32, y as i32 + qr_offset as i32);
                    if is_dark {
                        line.push_str("██");
                    } else {
                        line.push_str("  ");
                    }
                }
                // Right quiet zone
                line.push_str(&" ".repeat(quiet_zone * 2));
                println!("{}", line);
            }
            // Bottom quiet zone
            for _ in 0..quiet_zone {
                println!("{}", margin_line);
            }
        }
    } else {
        println!(".me CLI.");
    }

    // If no subcommand/arguments, show styled multi-line header and list users
    if cli.command.is_none() {
        use owo_colors::OwoColorize;
        use std::fs;
        // Print ASCII logo block as before
        println!(
            "{}",
            "
   ┓   ┏┓
┓┏┏┣┓┏┓┏┛
┗┻┛┛┗┗┛•
         "
            .bright_white()
                .bold()
        );

        // Read ~/.this/me and list user directories in a pretty table
        let base_path = dirs::home_dir().map(|p| p.join(".this/me"));
        let mut users: Vec<String> = Vec::new();
        if let Some(path) = base_path {
            if let Ok(entries) = fs::read_dir(&path) {
                for entry in entries.flatten() {
                    let dir_path = entry.path();
                    if dir_path.is_dir() {
                        if let Some(name) = entry.file_name().to_str() {
                            users.push(name.to_string());
                        }
                    }
                }
            }
        }
        if users.is_empty() {
            if colored_output {
                println!("{}", "📭 No identities found.".bright_black());
                println!("{}", "To create one:".bright_black());
                println!("{}", "me create --username <name> --password <pw>".bright_black());
                println!("{}", "See --help for more.".bright_black());
            } else {
                println!("📭 No identities found.");
                println!("To create one:");
                println!("me create --username <name> --password <pw>");
                println!("See --help for more.");
            }
        } else {
            // Calculate column width for the single "user" column
            let username_col_width = users
                .iter()
                .map(|name| name.len())
                .max()
                .unwrap_or(8)
                .max("user".len());
            // Print table header (single column)
            let top = format!(
                "┌{:─<w1$}┐",
                "",
                w1 = username_col_width
            );
 
            let bottom = format!(
                "└{:─<w1$}┘",
                "",
                w1 = username_col_width
            );
            println!("{}", top);
            for name in &users {
                println!(
                    "│{:<w1$}│",
                    name.bright_cyan(),
                    w1 = username_col_width
                );
            }
            println!("{}", bottom);
            println!();
            println!(
                "{}",
                format!("{} user(s) found.", users.len()).bright_black()
            );
        }
        // Instructional message (always show after the users table or empty message)
        println!();
        println!("{}", "Manage your digital identity with .me".bright_white().bold());
        println!("{}", "me --username example --password example verb action.".bright_black());
        println!("{}", "Create a new .me, by running:".bright_white().bold());
        println!("{}", "me create --username <name> --password <pw>".bright_black());
        println!("{}", "For help or command reference, run:".bright_white());
        println!("{}", "me help".bright_black());
        return;
    }

    match cli.command {
        Some(Commands::Create {}) => {
            let username = cli.username.as_ref().expect("Missing username");
            let password = cli.password.as_ref().expect("Missing password");
            match Me::new(&username, &password) {
                Ok(_) => println!("✅ Identity '{}' created.", username),
                Err(MeError::Io(ref err)) if err.kind() == std::io::ErrorKind::AlreadyExists => {
                    eprintln!("⚠️ Identity '{}' already exists.", username);
                }
                Err(e) => eprintln!("❌ '{}': {}", username, e),
            }
        }
        Some(Commands::ChangePassword { old_password, new_password }) => {
            let username = cli.username.as_ref().expect("Missing username");
            let password = cli.password.as_ref().expect("Missing password");
            match Me::load(&username, &password) {
                Ok(mut me) => match me.change_password(&old_password, &new_password) {
                    Ok(_) => println!("🔐 Password for '{}' changed successfully.", username),
                    Err(e) => eprintln!("❌ Failed to change password for '{}': {}", username, e),
                },
                Err(e) => eprintln!("❌ Failed to load identity '{}': {}", username, e),
            }
        }
        Some(Commands::View { target }) => {
            if target.is_empty() {
                use std::env;
                let path = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
                println!(
                    "\n{}",
                    format!("👀 View: {}/", path.display()).bright_white().bold()
                );
                let mut assets: Vec<AssetRef> = Vec::new();
                match fs::read_dir(&path) {
                    Ok(entries) => {
                        for entry in entries.flatten() {
                            let meta = entry.metadata().ok();
                            let asset = Arc::new(DigitalAsset {
                                name: entry.file_name().to_string_lossy().to_string(),
                                path: entry.path(),
                                is_dir: meta.as_ref().map(|m| m.is_dir()).unwrap_or(false),
                                size: meta.as_ref().and_then(|m| if m.is_file() { Some(m.len()) } else { None }),
                                modified: meta.and_then(|m| m.modified().ok()),
                            });
                            assets.push(asset);
                        }
                        for asset in &assets {
                            println!("• {}", asset.name);
                        }
                        println!("({} assets found)", assets.len());
                    }
                    Err(err) => eprintln!("❌ Failed to read directory: {}", err),
                }
                println!();
                return;
            }
            let object = target.join(" ");
            match serde_json::from_str::<Value>(&object) {
                Ok(val) => {
                    println!("\n{}", "👀 View:".bright_white().bold());
                    println!("{}", to_string_pretty(&val).unwrap_or(object));
                    println!();
                }
                Err(_) => {
                    println!("\n{}", "👀 View:".bright_white().bold());
                    println!("{}", object);
                    println!();
                }
            }
        }
        Some(Commands::Link { path }) => {
            let joined = path.join("/");
            println!("🔗 Linking to: {}", joined);
            // Save or update current .me context
            if let Err(err) = std::fs::write("/tmp/.me_context", &joined) {
                eprintln!("❌ Failed to save context: {}", err);
            } else {
                println!("✅ Context updated to '{}'.", joined);
            }
        }
        Some(Commands::Users) => {
            use std::fs;
            use owo_colors::OwoColorize;
            let base_path = dirs::home_dir()
                .map(|p| p.join(".this/me"))
                .expect("❌ Could not determine home directory.");
            match fs::read_dir(&base_path) {
                Ok(entries) => {
                    let mut users: Vec<String> = Vec::new();
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_dir() {
                            if let Some(name) = entry.file_name().to_str() {
                                users.push(name.to_string());
                            }
                        }
                    }
                    if users.is_empty() {
                        println!("📭 No identities found.");
                        return;
                    }
                    // Calculate column width for the single "user" column
                    let username_col_width = users
                        .iter()
                        .map(|name| name.len())
                        .max()
                        .unwrap_or(8)
                        .max("user".len());
                    // Print table header (single column)
                    let top = format!(
                        "┌{:─<w1$}┐",
                        "",
                        w1 = username_col_width
                    );
                    let header = format!(
                        "│{:<w1$}│",
                        "user".bright_white().bold(),
                        w1 = username_col_width
                    );
                    let sep = format!(
                        "├{:─<w1$}┤",
                        "",
                        w1 = username_col_width
                    );
                    let bottom = format!(
                        "└{:─<w1$}┘",
                        "",
                        w1 = username_col_width
                    );
                    println!("👥 Found users:");
                    println!("{}", top);
                    println!("{}", header);
                    println!("{}", sep);
                    for name in &users {
                        println!(
                            "│{:<w1$}│",
                            name.bright_cyan(),
                            w1 = username_col_width
                        );
                    }
                    println!("{}", bottom);
                    println!();
                    println!(
                        "{}",
                        format!("{} user(s) found.", users.len()).bright_black()
                    );
                }
                Err(_) => println!("📭 No identities found."),
            }
        }
        Some(Commands::UsersMe) => {
            use std::fs;
            use owo_colors::OwoColorize;
            let base_path = dirs::home_dir()
                .map(|p| p.join(".this/me"))
                .expect("❌ Could not determine home directory.");
            match fs::read_dir(&base_path) {
                Ok(entries) => {
                    let mut users: Vec<String> = Vec::new();
                    for entry in entries.flatten() {
                        let dir_path = entry.path();
                        if dir_path.is_dir() {
                            if let Some(name) = entry.file_name().to_str() {
                                users.push(name.to_string());
                            }
                        }
                    }
                    if users.is_empty() {
                        println!("📭 No identities found.");
                        return;
                    }
                    // Calculate column width for the single "user" column
                    let username_col_width = users
                        .iter()
                        .map(|name| name.len())
                        .max()
                        .unwrap_or(8)
                        .max("user".len());
                    // Print table header (single column)
                    let top = format!(
                        "┌{:─<w1$}┐",
                        "",
                        w1 = username_col_width
                    );
                    let header = format!(
                        "│{:<w1$}│",
                        "user".bright_white().bold(),
                        w1 = username_col_width
                    );
                    let sep = format!(
                        "├{:─<w1$}┤",
                        "",
                        w1 = username_col_width
                    );
                    let bottom = format!(
                        "└{:─<w1$}┘",
                        "",
                        w1 = username_col_width
                    );
                    println!("👥 .me users:");
                    println!("{}", top);
                    println!("{}", header);
                    println!("{}", sep);
                    for name in &users {
                        println!(
                            "│{:<w1$}│",
                            name.bright_cyan(),
                            w1 = username_col_width
                        );
                    }
                    println!("{}", bottom);
                    println!();
                    println!(
                        "{}",
                        format!("{} user(s) found.", users.len()).bright_black()
                    );
                }
                Err(_) => println!("📭 No identities found."),
            }
        }
        Some(Commands::Be { value, context, key }) => {
            let username = cli.username.as_ref().expect("Missing username");
            let password = cli.password.as_ref().expect("Missing password");
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
        Some(Commands::Communicate { value, context, key }) => {
            let username = cli.username.as_ref().expect("Missing username");
            let password = cli.password.as_ref().expect("Missing password");
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
        Some(Commands::Do { value, context, key }) => {
            let username = cli.username.as_ref().expect("Missing username");
            let password = cli.password.as_ref().expect("Missing password");
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
        Some(Commands::Have { value, context, key }) => {
            let username = cli.username.as_ref().expect("Missing username");
            let password = cli.password.as_ref().expect("Missing password");
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
        Some(Commands::At { value, context, key }) => {
            let username = cli.username.as_ref().expect("Missing username");
            let password = cli.password.as_ref().expect("Missing password");
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
        Some(Commands::Relate { value, context, key }) => {
            let username = cli.username.as_ref().expect("Missing username");
            let password = cli.password.as_ref().expect("Missing password");
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
        Some(Commands::React { value, context, key }) => {
            let username = cli.username.as_ref().expect("Missing username");
            let password = cli.password.as_ref().expect("Missing password");
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
        Some(Commands::Get { verb, context, key, value, limit, offset, since, until }) => {
            let username = cli.username.as_ref().expect("Missing username");
            let password = cli.password.as_ref().expect("Missing password");
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
        Some(Commands::Host) => {
            if let Err(err) = this_me::host::print_host_summary() {
                eprintln!("❌ Failed to inspect host: {}", err);
            }
        }
        Some(Commands::HostIp) => {
            if let Err(err) = this_me::host::print_network_summary() {
                eprintln!("❌ Failed to inspect network interfaces: {}", err);
            }
        }
        Some(Commands::Who) => {
            use owo_colors::OwoColorize;
            use std::fs;
            let base_path = dirs::home_dir()
                .map(|p| p.join(".this/me"))
                .expect("❌ Could not determine home directory.");
            println!("{}", ".me who?".bright_green().bold());
            println!("{}", "👥 Found users:".bright_white().bold());
            match fs::read_dir(&base_path) {
                Ok(entries) => {
                    let mut found = false;
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
                    // Instructional print section
                    println!();
                    println!("{}", "To create a new .me identity, run:".bright_black());
                    println!("{}", "  this.me create --username <name> --password <pw>".bright_black());
                }
                Err(_) => println!("📭 No identities found."),
            }
        }
        None => {}
    }
}

#[cfg(not(feature = "sqlite"))]
fn main() {
    eprintln!("This binary requires the 'sqlite' feature enabled.");
}
