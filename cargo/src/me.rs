use crate::utils::setup::validate_setup;
use crate::utils::validate_input::validate_username;
use crate::utils::validate_input::validate_hash;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::env;
use std::fs;

use aes_gcm::{Aes256Gcm, Key, Nonce}; // AES-GCM cipher
use aes_gcm::aead::{Aead, KeyInit};
use sha2::{Sha256, Digest};
use serde_json;  // added import
use serde::Serialize;
use crate::verbs::Verbs;

/// Represents a local encrypted identity used in dApps or Web3 environments.
#[derive(Serialize)]
pub struct Me {
    pub username: String,
    pub file_path: PathBuf,
    pub data: Option<String>,
    pub verbs: Verbs,
}

impl Me {
    /// Initializes a Me instance without validating the username.
    pub fn from_username_unchecked(username: &str) -> Self {
        let home_dir = env::var("HOME").unwrap_or_else(|_| ".".to_string());
        let file_path = PathBuf::from(format!("{}/.this/me/{}.me", home_dir, username));
        Me {
            username: username.to_string(),
            file_path,
            data: None,
            verbs: Verbs::new(),
        }
    }

    pub fn delete(username: &str, hash: &str) -> std::io::Result<()> {
        let me = Me::from_username_unchecked(username);
    
        if !me.file_path.exists() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("❌ Identity '{}' does not exist.", username),
            ));
        }
    
        let contents = fs::read(&me.file_path)?;
        let decrypted = me.decrypt(&contents, hash);
    
        match decrypted {
            Ok(_) => {
                fs::remove_file(&me.file_path)?;
                println!("🗑️ Identity '{}' deleted.", username);
                Ok(())
            }
            Err(_) => Err(std::io::Error::new(
                std::io::ErrorKind::PermissionDenied,
                "❌ Invalid password. Deletion aborted.",
            )),
        }
    }

    /// Initializes a new Me instance with the given username and hash.
    pub fn new(username: &str, hash: &str) -> std::io::Result<Self> {
        validate_username(username)?;
        validate_hash(hash)?;
        let home_dir = env::var("HOME").unwrap_or_else(|_| ".".to_string());
        let file_path = PathBuf::from(format!("{}/.this/me/{}.me", home_dir, username));
        if file_path.exists() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::AlreadyExists,
                format!("❌ Identity '{}' already exists.", username),
            ));
        }
        Ok(Me {
            username: username.to_string(),
            file_path,
            data: None,
            verbs: Verbs::new(),
        })
    }

    /// Encrypts the provided plaintext with the given hash.
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

    /// Decrypts the provided encrypted data using the given hash.
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

    /// Lists all existing identity files.
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

        /// Displays the decrypted contents of the identity file.
        pub fn display(username: &str, hash: &str) -> std::io::Result<String> {
            validate_username(username)?;
            validate_hash(hash)?;
            let home_dir = env::var("HOME").unwrap_or_else(|_| ".".to_string());
            let file_path = PathBuf::from(format!("{}/.this/me/{}.me", home_dir, username));
            if !file_path.exists() {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    format!("❌ Identity '{}' does not exist.", username),
                ));
            }
    
            let contents = fs::read(&file_path)?;
            let me_temp = Me::from_username_unchecked(username);
            let decrypted = me_temp.decrypt(&contents, hash)
                .map_err(|_| std::io::Error::new(std::io::ErrorKind::PermissionDenied, "❌ Invalid password."))?;
    
            Ok(decrypted)
        }


    /// Changes the encryption password (hash) of the identity file.
    pub fn change_hash(&self, old_hash: &str, new_hash: &str) -> std::io::Result<()> {
        validate_hash(new_hash)?;

        let contents = fs::read(&self.file_path)?;
        let decrypted = self.decrypt(&contents, old_hash)
            .map_err(|_| std::io::Error::new(std::io::ErrorKind::PermissionDenied, "❌ Old password incorrect."))?;

        let encrypted = self.encrypt(&decrypted, new_hash)?;
        let mut file = File::create(&self.file_path)?;
        file.write_all(&encrypted)?;
        println!("🔐 Password for '{}' successfully updated.", self.username);
        Ok(())
    }

    /// Saves the current identity by encrypting and writing to file.
    pub fn save(&self, hash: &str) -> std::io::Result<()> {
        validate_hash(hash)?;
        let data = serde_json::to_string(&self).map_err(|_| {
            std::io::Error::new(std::io::ErrorKind::Other, "❌ Failed to serialize identity")
        })?;
        let encrypted = self.encrypt(&data, hash)?;
        fs::create_dir_all(self.file_path.parent().unwrap())?;
        let mut file = File::create(&self.file_path)?;
        file.write_all(&encrypted)?;
        println!("✅ Identity '{}' saved.", self.username);
        Ok(())
    }

    pub fn have(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        self.verbs.have(key, value)
    }

    pub fn be(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        self.verbs.be(key, value)
    }

    pub fn at(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        self.verbs.at(key, value)
    }

    pub fn relate(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        self.verbs.relate(key, value)
    }

    pub fn react(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        self.verbs.react(key, value)
    }

    pub fn say(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        self.verbs.say(key, value)
    }

    /// Loads an existing identity by validating and preparing the instance.
    pub fn load(username: &str, hash: &str) -> std::io::Result<Self> {
        validate_username(username)?;
        validate_hash(hash)?;
        let home_dir = env::var("HOME").unwrap_or_else(|_| ".".to_string());
        let file_path = PathBuf::from(format!("{}/.this/me/{}.me", home_dir, username));
        if !file_path.exists() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("❌ Identity '{}' does not exist.", username),
            ));
        }
        Ok(Me {
            username: username.to_string(),
            file_path,
            data: None,
            verbs: Verbs::new(),
        })
    }
}