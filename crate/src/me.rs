//this.me/crate/src/me.rs
//by suiGn
use crate::utils::validate_input::validate_alias;
use crate::utils::validate_input::validate_hash;
use rusqlite::Connection;
use crate::db::connect;
use serde::Serialize;
use crate::verbs::Verbs;
use ed25519_dalek::{SigningKey, SecretKey, VerifyingKey};
use rand::rngs::OsRng;
use rand::RngCore;
use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;
use crate::utils::crypto::{encrypt_string, decrypt_string};
use std::convert::TryFrom;  // Added this line
/// Represents a local encrypted identity used in dApps or Web3 environments.
#[derive(Serialize)]
pub struct Me {
    pub alias: String,
    pub public_key: String,
    pub private_key: String, // stored encrypted
    pub verbs: Verbs,
    #[serde(skip)]
    pub conn: Connection,
}

impl Me {
    /// Returns a pretty-printed JSON representation of the Me struct.
    pub fn display(&self) -> Result<String, MeError> {
        serde_json::to_string_pretty(self).map_err(|e| MeError::Serialization(e))
    }

/// Initializes a new Me instance with the given alias and hash.
pub fn new(alias: &str, _hash: &str) -> Result<(Self, bool), MeError> {
    validate_alias(alias).map_err(|e| MeError::Validation(e.to_string()))?;
    validate_hash(_hash).map_err(|e| MeError::Validation(e.to_string()))?;
    let home = dirs::home_dir().ok_or_else(|| MeError::Validation("No HOME dir".to_string()))?;
    let db_path = home.join(".this").join("me").join(alias).join(format!("{}.db", alias));
    if db_path.exists() {
        return Err(MeError::Validation("Identity already exists.".to_string()));
    }

    let (conn, _) = connect(alias, true).map_err(MeError::Database)?;

    let mut csprng = OsRng {};
    let mut secret_bytes = [0u8; 32];
    csprng.fill_bytes(&mut secret_bytes);
    let secret = SecretKey::try_from(&secret_bytes[..])
        .map_err(|_| MeError::Crypto("Invalid secret key".into()))?;
    let signing_key = SigningKey::from(&secret);
    let verify_key = VerifyingKey::from(&signing_key);
    let public_key = STANDARD.encode(verify_key.to_bytes());
    let private_key_raw = STANDARD.encode(signing_key.to_bytes());
    let encrypted_private_key = encrypt_string(_hash, &private_key_raw).map_err(|_| MeError::Crypto("Encryption failed".into()))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS identity_keys (public_key TEXT NOT NULL, private_key BLOB NOT NULL)",
        [],
    ).map_err(MeError::Database)?;

    conn.execute(
        "INSERT INTO identity_keys (public_key, private_key) VALUES (?1, ?2)",
        (&public_key, &encrypted_private_key),
    ).map_err(MeError::Database)?;

    Ok((Me {
        alias: alias.to_string(),
        public_key,
        private_key: private_key_raw,
        verbs: Verbs::new(),
        conn,
    }, false))
}

    pub fn be(&mut self, key: &str, value: &str) -> Result<(), MeError> {
        Ok(self.verbs.be(&self.conn, key, value)?)}
    pub fn do_(&mut self, key: &str, value: &str) -> Result<(), MeError> {
        Ok(self.verbs.do_(&self.conn, key, value)?)}
    pub fn have(&mut self, key: &str, value: &str) -> Result<(), MeError> {
        Ok(self.verbs.have(&self.conn, key, value)?)}
    pub fn at(&mut self, key: &str, value: &str) -> Result<(), MeError> {
        Ok(self.verbs.at(&self.conn, key, value)?)}
    pub fn relate(&mut self, key: &str, value: &str) -> Result<(), MeError> {
        Ok(self.verbs.relate(&self.conn, key, value)?) }
    pub fn react(&mut self, key: &str, value: &str) -> Result<(), MeError> {
        Ok(self.verbs.react(&self.conn, key, value)?) }
    pub fn communication(&mut self, key: &str, value: &str) -> Result<(), MeError> {
        Ok(self.verbs.communication(&self.conn, key, value)?)
    }

    /// Loads an existing identity by validating and preparing the instance.
    pub fn load(alias: &str, _hash: &str) -> Result<Self, MeError> {
        validate_alias(alias).map_err(|e| MeError::Validation(e.to_string()))?;
        let home = dirs::home_dir().ok_or_else(|| MeError::Validation("No HOME dir".to_string()))?;
        let db_path = home.join(".this").join("me").join(alias).join(format!("{}.db", alias));
        let conn = rusqlite::Connection::open(db_path).map_err(MeError::Database)?;
        let (public_key, private_key_encrypted): (String, Vec<u8>) = {
            let mut stmt = conn.prepare("SELECT public_key, private_key FROM identity_keys LIMIT 1")
                .map_err(MeError::Database)?;

            stmt.query_row([], |row| {
                Ok((row.get(0)?, row.get(1)?))
            }).map_err(MeError::Database)?
        };

        let private_key = decrypt_string(_hash, &private_key_encrypted)
            .map_err(|_| MeError::Crypto("Decryption failed".into()))?;

        Ok(Me {
            alias: alias.to_string(),
            public_key,
            private_key,
            verbs: Verbs::new(),
            conn,
        })
    }
}

pub use crate::utils::me_error::MeError;