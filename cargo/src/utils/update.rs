use std::fs;
use std::io;
use serde_json::Value;
use crate::me::Me;

pub fn update_me<F>(me: &Me, hash: &str, mutator: F) -> io::Result<()>
where
    F: FnOnce(&mut Value),
{
    let contents = fs::read(&me.file_path)?;
    let decrypted = me.decrypt(&contents, hash)
        .map_err(|_| io::Error::new(io::ErrorKind::InvalidData, "❌ Decryption failed"))?;

    let mut json: Value = serde_json::from_str(&decrypted)?;
    mutator(&mut json); // Apply transformation

    let updated_str = serde_json::to_string(&json)?;
    let encrypted = me.encrypt(&updated_str, hash)?;
    fs::write(&me.file_path, encrypted)?;
    Ok(())
}
