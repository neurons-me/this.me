use crate::utils::setup::validate_setup;
use crate::utils::validate_input::validate_username;
use crate::utils::validate_input::validate_hash;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use std::env;

use aes_gcm::{Aes256Gcm, Key, Nonce}; // AES-GCM cipher
use aes_gcm::aead::{Aead, KeyInit};
use sha2::{Sha256, Digest};
use serde_json;  // added import

/// Represents a local encrypted identity used in dApps or Web3 environments.
pub struct Me {
    pub username: String,
    pub file_path: PathBuf,
    pub data: Option<String>,
}

impl Me {
    pub fn new(username: &str) -> std::io::Result<Self> {
        match validate_username(username) {
            Ok(_) => {
                let home_dir = env::var("HOME").unwrap_or_else(|_| ".".to_string());
                let file_path = PathBuf::from(format!("{}/.this/me/{}.me", home_dir, username));
                Ok(Me {
                    username: username.to_string(),
                    file_path,
                    unlocked: false,
                    data: None,
                })
            }
            Err(e) => {
                eprintln!("❌ Error validating username: {}", e);
                Err(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    format!("❌ Error validating username: {}", e),
                ))
            }
        }
    }

    pub fn create(username: &str, hash: &str) -> std::io::Result<Self> {
        let me = Me::new(username)?;
        validate_setup(false)?;
        
        validate_hash(hash)?;
        if me.file_path.exists() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::AlreadyExists,
                format!("❌ Identity '{}' already exists.", username),
            ));
        }

        let data = format!(r#"{{"identity":{{"username":"{}"}}}}"#, username);
        let encrypted = me.encrypt(&data, hash)?;
        fs::create_dir_all(me.file_path.parent().unwrap())?;
        let mut file = File::create(&me.file_path)?;
        file.write_all(&encrypted)?;
        Ok(me)
    }


    pub fn encrypt(&self, plaintext: &str, hash: &str) -> std::io::Result<Vec<u8>> {
        validate_hash(hash)?;
        let key_hash = Sha256::digest(hash.as_bytes());
        let key = Key::<Aes256Gcm>::from_slice(&key_hash);
        let cipher = Aes256Gcm::new(key);
        let nonce_bytes: [u8; 12] = rand::random();
        let nonce = Nonce::from_slice(&nonce_bytes);
        let ciphertext = cipher.encrypt(nonce, plaintext.as_bytes())
            .map_err(|_| std::io::Error::new(std::io::ErrorKind::Other, "Encryption failed"))?;

        let mut result = nonce_bytes.to_vec();
        result.extend(ciphertext);
        Ok(result)
    }

    pub fn decrypt(&self, data: &[u8], hash: &str) -> Result<String, ()> {
        if validate_hash(hash).is_err() {
            return Err(());
        }
        if data.len() < 12 {
            return Err(());
        }

        let key_hash = Sha256::digest(hash.as_bytes());
        let key = Key::<Aes256Gcm>::from_slice(&key_hash);
        let cipher = Aes256Gcm::new(key);
        let (nonce_bytes, ciphertext) = data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        let decrypted = cipher.decrypt(nonce, ciphertext).map_err(|_| ())?;
        String::from_utf8(decrypted).map_err(|_| ())
    }

    pub fn list() -> std::io::Result<Vec<String>> {
        validate_setup(false)?;
        let home_dir = env::var("HOME").unwrap_or_else(|_| ".".to_string());
        let dir_path = PathBuf::from(format!("{}/.this/me", home_dir));

        if !dir_path.exists() {
            return Ok(vec![]);
        }

        let mut identities = vec![];
        for entry in fs::read_dir(dir_path)? {
            let entry = entry?;
            if let Some(name) = entry.file_name().to_str() {
                if name.ends_with(".me") {
                    identities.push(name.trim_end_matches(".me").to_string());
                }
            }
        }

        Ok(identities)
    }

    pub fn show(&self, password: &str) -> std::io::Result<()> {
        validate_setup(false)?;
        let contents = fs::read(&self.file_path)?;
        let json = self.decrypt(&contents, password).map_err(|_| {
            std::io::Error::new(std::io::ErrorKind::InvalidData, "❌ Failed to decrypt. Wrong password?")
        })?;

        match serde_json::from_str::<serde_json::Value>(&json) {
            Ok(parsed) => {
                println!("{}", serde_json::to_string_pretty(&parsed)?);
            }
            Err(_) => {
                println!("{}", json);
            }
        }

        Ok(())
    }
}