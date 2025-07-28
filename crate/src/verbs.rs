//this.me/crate/src/verbs.rs
//by suiGn
/* be() - Ser algo
have() - Tener algo
at() - Estar en algún lugar
relate() - Relacionarse con algo
react() - Reaccionar a algo
say() - Decir algo */
use chrono::Utc;
use serde::{Deserialize, Serialize};
use rusqlite::{Connection, params};
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Action {
    pub key: String,
    pub value: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Verbs;

impl Verbs {
    pub fn new() -> Self {
        Verbs
    }

    fn now_timestamp() -> String {
        Utc::now().to_rfc3339()
    }
/*▗▄▄▖ ▗▄▄▄▖
  ▐▌ ▐▌▐▌   
  ▐▛▀▚▖▐▛▀▀▘
  ▐▙▄▞▘▐▙▄▄▖*/
    pub fn be(&self, conn: &Connection, key: &str, value: &str) -> std::io::Result<()> {
        let timestamp = Self::now_timestamp();
        conn.execute(
            "INSERT INTO verbs (verb, key, value, timestamp) VALUES (?1, ?2, ?3, ?4)",
            params!["be", key, value, timestamp],
        ).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        Ok(())
    }
/*▗▄▄▄   ▗▄▖ 
  ▐▌  █ ▐▌ ▐▌
  ▐▌  █ ▐▌ ▐▌
  ▐▙▄▄▀ ▝▚▄▞*/
    pub fn do_(&self, conn: &Connection, key: &str, value: &str) -> std::io::Result<()> {
        let timestamp = Self::now_timestamp();
        conn.execute(
            "INSERT INTO verbs (verb, key, value, timestamp) VALUES (?1, ?2, ?3, ?4)",
            params!["do", key, value, timestamp],
        ).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        Ok(())
    }
/*▗▖ ▗▖ ▗▄▖ ▗▖  ▗▖▗▄▄▄▖
  ▐▌ ▐▌▐▌ ▐▌▐▌  ▐▌▐▌   
  ▐▛▀▜▌▐▛▀▜▌▐▌  ▐▌▐▛▀▀▘
  ▐▌ ▐▌▐▌ ▐▌ ▝▚▞▘ ▐▙▄▄▖*/
    pub fn have(&self, conn: &Connection, key: &str, value: &str) -> std::io::Result<()> {
        let timestamp = Self::now_timestamp();
        conn.execute(
            "INSERT INTO verbs (verb, key, value, timestamp) VALUES (?1, ?2, ?3, ?4)",
            params!["have", key, value, timestamp],
        ).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        Ok(())
    }
/* ▗▄▖▗▄▄▄▖
  ▐▌ ▐▌ █  
  ▐▛▀▜▌ █  
  ▐▌ ▐▌ █ */
    pub fn at(&self, conn: &Connection, key: &str, value: &str) -> std::io::Result<()> {
        let timestamp = Self::now_timestamp();
        conn.execute(
            "INSERT INTO verbs (verb, key, value, timestamp) VALUES (?1, ?2, ?3, ?4)",
            params!["at", key, value, timestamp],
        ).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        Ok(())
    }
/*▗▄▄▖ ▗▄▄▄▖▗▖    ▗▄▖▗▄▄▄▖▗▄▄▄▖
  ▐▌ ▐▌▐▌   ▐▌   ▐▌ ▐▌ █  ▐▌   
  ▐▛▀▚▖▐▛▀▀▘▐▌   ▐▛▀▜▌ █  ▐▛▀▀▘
  ▐▌ ▐▌▐▙▄▄▖▐▙▄▄▖▐▌ ▐▌ █  ▐▙▄▄▖*/
    pub fn relate(&self, conn: &Connection, key: &str, value: &str) -> std::io::Result<()> {
        let timestamp = Self::now_timestamp();
        conn.execute(
            "INSERT INTO verbs (verb, key, value, timestamp) VALUES (?1, ?2, ?3, ?4)",
            params!["relate", key, value, timestamp],
        ).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        Ok(())
    }
/*▗▄▄▖ ▗▄▄▄▖ ▗▄▖  ▗▄▄▖▗▄▄▄▖
  ▐▌ ▐▌▐▌   ▐▌ ▐▌▐▌     █  
  ▐▛▀▚▖▐▛▀▀▘▐▛▀▜▌▐▌     █  
  ▐▌ ▐▌▐▙▄▄▖▐▌ ▐▌▝▚▄▄▖  █ */
    pub fn react(&self, conn: &Connection, key: &str, value: &str) -> std::io::Result<()> {
        let timestamp = Self::now_timestamp();
        conn.execute(
            "INSERT INTO verbs (verb, key, value, timestamp) VALUES (?1, ?2, ?3, ?4)",
            params!["react", key, value, timestamp],
        ).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        Ok(())
    }
/*Communication */
    pub fn communication(&self, conn: &Connection, key: &str, value: &str) -> std::io::Result<()> {
        let timestamp = Self::now_timestamp();
        conn.execute(
            "INSERT INTO verbs (verb, key, value, timestamp) VALUES (?1, ?2, ?3, ?4)",
            params!["communication", key, value, timestamp],
        ).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        Ok(())
    }
}