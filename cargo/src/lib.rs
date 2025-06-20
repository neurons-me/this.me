//this.me/cargo/src/lib.rs
// The `Me` struct represents a user identity that is stored in an encrypted file.
// It manages creating, unlocking, encrypting, and decrypting the identity data.
// The identity data is tied to a username and stored securely on disk using AES-256-CBC encryption.
mod setup;
use setup::validate_setup;

use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::env;
use aes_gcm::{Aes256Gcm, Key, Nonce}; // AES-GCM cipher
use aes_gcm::aead::{Aead, KeyInit};
use sha2::{Sha256, Digest};


pub struct Me {
    pub username: String,    // Username associated with this identity
    pub file_path: PathBuf,  // Path to the encrypted identity file
    pub unlocked: bool,      // Indicates if the identity data has been successfully decrypted
    pub data: Option<String>, // Decrypted identity data as a JSON string (could be replaced with structured data)
}

impl Me {
    /// Creates a new `Me` instance for a given username.
    ///
    /// This does not create any files or data, just initializes the struct with the expected file path.
    ///
    /// # Arguments
    ///
    /// * `username` - The username for which to create the identity instance.
    pub fn new(username: &str) -> Self {
        validate_setup(false); // Ensure ~/.this/me exists
        let home_dir = env::var("HOME").unwrap_or_else(|_| ".".to_string());
        let file_path = PathBuf::from(format!("{}/.this/me/{}.me", home_dir, username));
        Me {
            username: username.to_string(),
            file_path,
            unlocked: false,
            data: None,
        }
    }

    /// Creates a new encrypted identity file for the given username and password hash.
    ///
    /// This will panic if the identity file already exists.
    ///
    /// # Arguments
    ///
    /// * `username` - The username for the new identity.
    /// * `hash` - The password hash used for encryption.
    ///
    /// # Returns
    ///
    /// A `Me` instance representing the newly created identity.
    pub fn create(username: &str, hash: &str) -> std::io::Result<Self> {
        validate_setup(false); // Ensure ~/.this/me exists
        let me = Me::new(username);
        // Check if identity file already exists to prevent overwriting
        if me.file_path.exists() {
            panic!("Identity already exists");
        }

        // Prepare initial identity data as a JSON string
        let data = format!(r#"{{"identity":{{"username":"{}"}}}}"#, username);
        // Encrypt the data using the provided hash
        let encrypted = me.encrypt(&data, hash)?;
        // Ensure the parent directory exists
        fs::create_dir_all(me.file_path.parent().unwrap())?;
        // Create and write the encrypted data to the identity file
        let mut file = File::create(&me.file_path)?;
        file.write_all(&encrypted)?;
        Ok(me)
    }

    /// Attempts to unlock (decrypt) the identity data using the provided password hash.
    ///
    /// # Arguments
    ///
    /// * `hash` - The password hash used for decryption.
    ///
    /// # Returns
    ///
    /// Ok(true) if decryption was successful and the identity is unlocked,
    /// Ok(false) if decryption failed (e.g., wrong password),
    /// or an IO error if file operations fail.
    pub fn unlock(&mut self, hash: &str) -> std::io::Result<bool> {
        // Open the encrypted identity file
        let mut file = File::open(&self.file_path)?;
        let mut buffer = Vec::new();
        // Read the entire file contents into buffer
        file.read_to_end(&mut buffer)?;

        // Attempt to decrypt the data using the provided hash
        let decrypted = self.decrypt(&buffer, hash);
        match decrypted {
            Ok(content) => {
                // On success, store the decrypted data and mark as unlocked
                self.data = Some(content);
                self.unlocked = true;
                Ok(true)
            }
            Err(_) => Ok(false), // Decryption failed, likely due to wrong hash
        }
    }

    /// Encrypts plaintext data using AES-256-CBC with a key derived from the hash.
    ///
    /// The resulting encrypted data is prefixed with the random IV used for encryption.
    ///
    /// # Arguments
    ///
    /// * `plaintext` - The plaintext data to encrypt.
    /// * `hash` - The password hash used to derive the encryption key.
    ///
    /// # Returns
    ///
    /// A byte vector containing the IV followed by the ciphertext.
    fn encrypt(&self, plaintext: &str, hash: &str) -> std::io::Result<Vec<u8>> {
        let key_hash = Sha256::digest(hash.as_bytes());
        let key = Key::<Aes256Gcm>::from_slice(&key_hash);
        let cipher = Aes256Gcm::new(key);

        let nonce_bytes: [u8; 12] = rand::random(); // GCM uses 96-bit nonce
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher.encrypt(nonce, plaintext.as_bytes())
            .map_err(|_| std::io::Error::new(std::io::ErrorKind::Other, "Encryption failed"))?;

        let mut result = nonce_bytes.to_vec();
        result.extend(ciphertext);
        Ok(result)
    }

    /// Decrypts data encrypted by `encrypt` using the provided password hash.
    ///
    /// Expects the first 16 bytes of `data` to be the IV.
    ///
    /// # Arguments
    ///
    /// * `data` - The encrypted data with IV prefix.
    /// * `hash` - The password hash used to derive the decryption key.
    ///
    /// # Returns
    ///
    /// Ok with the decrypted plaintext string on success, or Err on failure.
    fn decrypt(&self, data: &[u8], hash: &str) -> Result<String, ()> {
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
}