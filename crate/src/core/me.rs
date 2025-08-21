//this.me/crate/src/core/me.rs
use std::sync::Arc;
use base64::Engine as _;
use base64::engine::general_purpose::STANDARD;
use sha2::{Sha256, Digest};
use chrono::Utc;
use super::store::MeStore;
use super::model::{Entry, GetFilter};

pub struct Me<S: MeStore> {
    pub username: String,
    pub public_key: String,
    pub context_id: String,
    pub store: Arc<S>,
}

impl<S: MeStore> Me<S> {
    pub fn with_store(username: String, public_key: String, private_key_raw: String, store: Arc<S>) -> Self {
        // context_id derivado del private_key (como tenías)
        let mut hasher = Sha256::new();
        hasher.update(&private_key_raw);
        let context_id = STANDARD.encode(hasher.finalize());

        Self { username, public_key, context_id, store }
    }

    pub async fn create_identity(store: Arc<S>, username: &str, encrypted_private_key: &str, public_key: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        store.create_identity(username, public_key, encrypted_private_key).await
    }

    pub async fn load(store: Arc<S>, username: &str, password: &str) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        // 1) store.load_keys -> (public_key, encrypted_private_key)
        let (public_key, encrypted_private_key) = store.load_keys(username).await?;
        // 2) derivar clave y desencriptar (igual que en tu código actual)
        let key = Self::derive_key(username, password)?;
        let encoded_key = STANDARD.encode(&key);
        let private_key_raw = crate::utils::crypto::decrypt_string(&encoded_key, &STANDARD.decode(encrypted_private_key)?)?;
        Ok(Self::with_store(username.to_string(), public_key, private_key_raw, store))
    }

    fn derive_key(username: &str, password: &str) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
        let mut hasher = Sha256::new();
        hasher.update(username.as_bytes());
        hasher.update(password.as_bytes());
        Ok(hasher.finalize().to_vec())
    }

    // ----- Verbos -----
    pub async fn be(&self, context_id: &str, key: &str, value: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.insert("be", context_id, key, value).await
    }
    pub async fn have(&self, context_id: &str, key: &str, value: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.insert("have", context_id, key, value).await
    }
    pub async fn do_(&self, context_id: &str, key: &str, value: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.insert("do_", context_id, key, value).await
    }
    pub async fn at(&self, context_id: &str, key: &str, value: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.insert("at", context_id, key, value).await
    }
    pub async fn relate(&self, context_id: &str, key: &str, value: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.insert("relate", context_id, key, value).await
    }
    pub async fn react(&self, context_id: &str, key: &str, value: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.insert("react", context_id, key, value).await
    }
    pub async fn communicate(&self, context_id: &str, key: &str, value: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.insert("communicate", context_id, key, value).await
    }

    async fn insert(&self, verb: &str, context_id: &str, key: &str, value: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let ts = Utc::now().to_rfc3339();
        self.store.insert(verb, context_id, key, value, &ts).await
    }

    pub async fn get(&self, filter: &GetFilter) -> Result<Vec<Entry>, Box<dyn std::error::Error + Send + Sync>> {
        self.store.get(filter).await
    }
}