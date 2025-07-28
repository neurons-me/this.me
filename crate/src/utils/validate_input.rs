use std::io;

pub fn validate_alias(alias: &str) -> io::Result<()> {
    println!("🔍 Validating alias: '{}' (chars: {}, bytes: {})", alias, alias.chars().count(), alias.len());

    let alias_len = alias.len();
    if alias_len < 5 || alias_len > 21 {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "❌ Alias must be 5-21 characters long."));
    }

    if alias.starts_with('.') || alias.starts_with('_') {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "❌ Alias cannot start with '.' or '_'"));
    }

    if alias.ends_with('.') || alias.ends_with('_') {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "❌ Alias cannot end with '.' or '_'"));
    }

    if alias.contains("..") || alias.contains("__") || alias.contains("._") || alias.contains("_.") {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "❌ Alias cannot contain consecutive '.' or '_'"));
    }

    if !alias.chars().all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_') {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "❌ Alias must only contain letters, numbers, '.' or '_'"));
    }

    let period_count = alias.matches('.').count();
    if period_count > 2 {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "❌ Alias cannot have more than 2 periods."));
    }

    Ok(())
}
pub fn validate_hash(hash: &str) -> io::Result<()> {
    if hash.len() < 4 {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "❌ Hash (password) must be at least 4 characters long."));
    }
    Ok(())
}