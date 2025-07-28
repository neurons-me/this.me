//this.me/crate/src/manager.rs
//by suiGn.
use std::fs;
use std::path::PathBuf;
use crate::utils::me_error::MeError;

#[derive(Debug)]
pub struct MeSummary {
    pub alias: String,
    pub path: PathBuf,
}

pub fn list_us() -> Result<Vec<MeSummary>, MeError> {
    let home = dirs::home_dir().ok_or_else(|| MeError::Validation("No HOME dir".to_string()))?;
    let base_path = home.join(".this").join("me");

    let mut list = vec![];

    if let Ok(entries) = fs::read_dir(base_path) {
        for entry in entries.flatten() {
            if entry.path().is_dir() {
                if let Some(alias) = entry.file_name().to_str() {
                    list.push(MeSummary {
                        alias: alias.to_string(),
                        path: entry.path(),
                    });
                }
            }
        }
    }

    Ok(list)
}