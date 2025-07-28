// src/utils/me_error.rs
use thiserror::Error;
use rusqlite;
use std::io;
use serde_json;

#[derive(Debug, Error)]
pub enum MeError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("IO error: {0}")]
    Io(#[from] io::Error),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Crypto error: {0}")]
    Crypto(String),
}