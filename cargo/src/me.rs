use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::collections::HashMap;
use aes::Aes256;
use block_modes::{BlockMode, Cbc};
use block_modes::block_padding::Pkcs7;
use sha2::{Sha256, Digest};
use rand::RngCore;
use rand::rngs::OsRng;
use serde::{Serialize, Deserialize};
use base64::{encode, decode};

type Aes256Cbc = Cbc<Aes256, Pkcs7>;

const ROOT_DIR: &str = ".this/me";

#[derive(Serialize, Deserialize, Debug)]
pub struct Identity {
    pub username: String,
    pub public_key: String,
    pub private_key: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MeData {
    pub identity: Identity,
    pub attributes: HashMap<String, String>,
    pub relationships: Vec<String>,
    pub reactions: Vec<String>,
    pub endorsements: Vec<String>,
}

pub struct Me {
    pub username: String,
    pub file_path: PathBuf,
    pub unlocked: bool,
    pub data: Option<MeData>,
}

impl Me {
    pub fn new(username: &str) -> Self {
        let mut path = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/tmp"));
        path.push(ROOT_DIR);
        fs::create_dir_all(&path).ok();
        path.push(format!("{}.me", username));

        Me {
            username: username.to_string(),
            file_path: path,
            unlocked: false,
            data: None,
        }
    }

    fn derive_key(hash: &str) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(hash.as_bytes());
        let result = hasher.finalize();
        let mut key = [0u8; 32];
        key.copy_from_slice(&result);
        key
    }

    pub fn save(&self, hash: &str) -> Result<(), String> {
        if let Some(ref data) = self.data {
            let json = serde_json::to_vec(data).map_err(|e| e.to_string())?;
            let key = Self::derive_key(hash);
            let mut iv = [0u8; 16];
            OsRng.fill_bytes(&mut iv);
            let cipher = Aes256Cbc::new_from_slices(&key, &iv).map_err(|e| e.to_string())?;
            let ciphertext = cipher.encrypt_vec(&json);

            let mut file = File::create(&self.file_path).map_err(|e| e.to_string())?;
            file.write_all(&iv).map_err(|e| e.to_string())?;
            file.write_all(&ciphertext).map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err("No data to save.".to_string())
        }
    }

    pub fn unlock(&mut self, hash: &str) -> Result<(), String> {
        let mut file = File::open(&self.file_path).map_err(|e| e.to_string())?;
        let mut contents = Vec::new();
        file.read_to_end(&mut contents).map_err(|e| e.to_string())?;

        let (iv, ciphertext) = contents.split_at(16);
        let key = Self::derive_key(hash);
        let cipher = Aes256Cbc::new_from_slices(&key, iv).map_err(|e| e.to_string())?;
        let decrypted = cipher.decrypt_vec(ciphertext).map_err(|e| e.to_string())?;

        self.data = Some(serde_json::from_slice(&decrypted).map_err(|e| e.to_string())?);
        self.unlocked = true;
        Ok(())
    }

    pub fn lock(&mut self) {
        self.data = None;
        self.unlocked = false;
    }

    pub fn be(&mut self, key: &str, value: &str) -> Result<(), String> {
        if !self.unlocked {
            return Err("Identity is locked.".into());
        }

        if let Some(ref mut data) = self.data {
            data.attributes.insert(key.to_string(), value.to_string());
            Ok(())
        } else {
            Err("No data loaded.".into())
        }
    }

    pub fn get_attributes(&self) -> Option<&HashMap<String, String>> {
        self.data.as_ref().map(|d| &d.attributes)
    }

    pub fn add_endorsement(&mut self, endorsement: &str) -> Result<(), String> {
        if !self.unlocked {
            return Err("Identity is locked.".into());
        }

        if let Some(ref mut data) = self.data {
            data.endorsements.push(endorsement.to_string());
            Ok(())
        } else {
            Err("No data loaded.".into())
        }
    }

    pub fn create(username: &str, hash: &str) -> Result<Self, String> {
        let mut me = Me::new(username);
        if me.file_path.exists() {
            return Err("Identity already exists.".into());
        }

        me.data = Some(MeData {
            identity: Identity {
                username: username.to_string(),
                public_key: "publicKeyPlaceholder".into(),
                private_key: "privateKeyPlaceholder".into(),
            },
            attributes: HashMap::new(),
            relationships: vec![],
            reactions: vec![],
            endorsements: vec![],
        });

        me.save(hash)?;
        Ok(me)
    }

    pub fn load(username: &str, hash: &str) -> Result<Self, String> {
        let mut me = Me::new(username);
        me.unlock(hash)?;
        Ok(me)
    }
}