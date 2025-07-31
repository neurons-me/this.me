//this.me/crate/src/me.rs
//by suiGn
use crate::utils::validate_input::validate_username;
use crate::utils::validate_input::validate_password;
use rusqlite::Connection;
use crate::db::connect;
use serde::Serialize;
use crate::verbs::Verbs;
use ed25519_dalek::{SigningKey, SecretKey, VerifyingKey};
use rand::rngs::OsRng;
use rand::RngCore;
use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;
use crate::utils::crypto::encrypt_string;
use std::convert::TryFrom;  // Added this line
/// Represents a local encrypted identity used in dApps or Web3 environments.
#[derive(Serialize)]
pub struct Me {
    pub username: String,
    pub public_key: String,
    pub private_key: String, // stored encrypted
    pub verbs: Verbs,
    #[serde(skip)]
    pub conn: Connection,
}

impl Me {
    fn derive_key(username: &str, password: &str) -> Result<Vec<u8>, MeError> {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(username.as_bytes());
        hasher.update(password.as_bytes());
        let result = hasher.finalize();
        Ok(result[..].to_vec())
    }

    /// Changes the encryption hash of the private key.
    pub fn change_password(&mut self, _old_password: &str, new_password: &str) -> Result<(), MeError> {
        // Re-encrypt the private key using the new password, base64-encoded as in new()
        let key = Me::derive_key(&self.username, new_password)?;
        let encoded_key = base64::engine::general_purpose::STANDARD.encode(&key);
        let encrypted_binary = crate::utils::crypto::encrypt_string(&encoded_key, &self.private_key)
            .map_err(|_| MeError::Crypto("Encryption failed".into()))?;
        let new_encrypted = base64::engine::general_purpose::STANDARD.encode(&encrypted_binary);
        // Update the database with the new encrypted private key
        self.conn.execute(
            "UPDATE identity_keys SET private_key = ?1",
            [&new_encrypted],
        ).map_err(MeError::Database)?;
        Ok(())
    }

    /// Returns a pretty-printed JSON representation of the Me struct.
    pub fn display(&self) -> Result<String, MeError> {
        serde_json::to_string_pretty(self).map_err(|e| MeError::Serialization(e))
    }

    /// Loads an existing Me instance from the local database using username and password.
    pub fn load(username: &str, password: &str) -> Result<Self, MeError> {
        validate_username(username).map_err(|e| MeError::Validation(e.to_string()))?;
        validate_password(password).map_err(|e| MeError::Validation(e.to_string()))?;
        let home = dirs::home_dir().ok_or_else(|| MeError::Validation("No HOME dir".to_string()))?;
        let db_path = home.join(".this").join("me").join(username).join(format!("{}.db", username));
        if !db_path.exists() {
            return Err(MeError::Validation("Identity does not exist.".to_string()));
        }

        let (conn, _) = connect(username, false).map_err(MeError::Database)?;
        let (public_key, private_key_raw) = {
            let mut stmt = conn.prepare("SELECT public_key, private_key FROM identity_keys LIMIT 1")
                .map_err(MeError::Database)?;
            let mut rows = stmt.query([]).map_err(MeError::Database)?;
            if let Some(row) = rows.next().map_err(MeError::Database)? {
                let public_key: String = row.get(0).map_err(MeError::Database)?;
                let encrypted_private_key: String = row.get(1).map_err(MeError::Database)?;
                let encrypted_bytes = STANDARD.decode(&encrypted_private_key)
                    .map_err(|_| MeError::Crypto("Base64 decode failed".into()))?;
                let key = Me::derive_key(username, password)?;
                let encoded_key = base64::engine::general_purpose::STANDARD.encode(&key);
                let private_key_raw = crate::utils::crypto::decrypt_string(&encoded_key, &encrypted_bytes)
                    .map_err(|_| MeError::Crypto("Decryption failed".into()))?;
                (public_key, private_key_raw)
            } else {
                return Err(MeError::Validation("Identity keys not found.".to_string()));
            }
        };

        Ok(Me {
            username: username.to_string(),
            public_key,
            private_key: private_key_raw,
            verbs: Verbs::new(),
            conn,
        })
    }

    /// Initializes a new Me instance with the given username and password.
    pub fn new(username: &str, password: &str) -> Result<(Self, bool), MeError> {
        validate_username(username).map_err(|e| MeError::Validation(e.to_string()))?;
        validate_password(password).map_err(|e| MeError::Validation(e.to_string()))?;
        let home = dirs::home_dir().ok_or_else(|| MeError::Validation("No HOME dir".to_string()))?;
        let db_path = home.join(".this").join("me").join(username).join(format!("{}.db", username));
        if db_path.exists() {
            return Err(MeError::Validation("Identity already exists.".to_string()));
        }

        let (conn, _) = connect(username, true).map_err(MeError::Database)?;
        let mut csprng = OsRng {};
        let mut secret_bytes = [0u8; 32];
        csprng.fill_bytes(&mut secret_bytes);
        let secret = SecretKey::try_from(&secret_bytes[..])
            .map_err(|_| MeError::Crypto("Invalid secret key".into()))?;
        let signing_key = SigningKey::from(&secret);
        let verify_key = VerifyingKey::from(&signing_key);
        let public_key = STANDARD.encode(verify_key.to_bytes());
        let private_key_raw = STANDARD.encode(signing_key.to_bytes());
        let key = Me::derive_key(username, password)?;
        let encoded_key = base64::engine::general_purpose::STANDARD.encode(&key);
        let encrypted_binary = encrypt_string(&encoded_key, &private_key_raw)
            .map_err(|_| MeError::Crypto("Encryption failed".into()))?;
        let encrypted_private_key = STANDARD.encode(&encrypted_binary);
        conn.execute(
            "CREATE TABLE IF NOT EXISTS identity_keys (public_key TEXT NOT NULL, private_key TEXT NOT NULL)",
            [],
        ).map_err(MeError::Database)?;
        conn.execute(
            "INSERT INTO identity_keys (public_key, private_key) VALUES (?1, ?2)",
            (&public_key, &encrypted_private_key),
        ).map_err(MeError::Database)?;
        use chrono::Utc;
        let created_at = Utc::now().to_rfc3339();
        conn.execute(
            "CREATE TABLE IF NOT EXISTS me (
                public_key TEXT NOT NULL,
                private_key TEXT NOT NULL,
                created_at TEXT NOT NULL
            )", [],
        ).map_err(MeError::Database)?;
        conn.execute(
            "INSERT INTO me (public_key, private_key, created_at) VALUES (?1, ?2, ?3)",
            (&public_key, &encrypted_private_key, &created_at),
        ).map_err(MeError::Database)?;
        Ok((Me {
            username: username.to_string(),
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
    pub fn get(&self, verb: &str, key: Option<&str>, value: Option<&str>) -> Result<Vec<(String, String, String)>, MeError> {
        self.verbs
            .get(&self.conn, verb, key, value)
            .map(|actions| actions.into_iter().map(|a| (a.key, a.value, a.timestamp)).collect())
            .map_err(MeError::Io)
    }
}

pub use crate::utils::me_error::MeError;