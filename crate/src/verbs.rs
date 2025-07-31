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
            "INSERT INTO be (key, value, timestamp) VALUES (?1, ?2, ?3)",
            params![key, value, timestamp],
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
            "INSERT INTO do_ (key, value, timestamp) VALUES (?1, ?2, ?3)",
            params![key, value, timestamp],
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
            "INSERT INTO have (key, value, timestamp) VALUES (?1, ?2, ?3)",
            params![key, value, timestamp],
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
            "INSERT INTO at (key, value, timestamp) VALUES (?1, ?2, ?3)",
            params![key, value, timestamp],
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
            "INSERT INTO relate (target, key, value, timestamp) VALUES (?1, ?2, ?3, ?4)",
            params![key, "", value, timestamp],
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
            "INSERT INTO react (target, emoji, timestamp) VALUES (?1, ?2, ?3)",
            params![key, value, timestamp],
        ).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        Ok(())
    }
/*Communication */
    pub fn communication(&self, conn: &Connection, key: &str, value: &str) -> std::io::Result<()> {
        let timestamp = Self::now_timestamp();
        conn.execute(
            "INSERT INTO communication (target, message, timestamp) VALUES (?1, ?2, ?3)",
            params![key, value, timestamp],
        ).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        Ok(())
    }
    /// Retrieves a list of actions recorded under a specific verb,
    /// optionally filtered by key and value. This allows for retrospective 
    /// inspection of the current identity's stored behaviors or attributes.
    /// Results are returned in reverse chronological order.
    pub fn get(&self, conn: &Connection, verb: &str, key: Option<&str>, value: Option<&str>) -> std::io::Result<Vec<Action>> {
        let verbs_list = ["be", "do_", "have", "at", "relate", "react", "communication"];
        let mut results = Vec::new();

        let target_verbs: Vec<&str> = if verb == "all" {
            verbs_list.to_vec()
        } else {
            vec![verb]
        };

        for v in target_verbs {
            let table = match v {
                "do" => "do_",
                "react" | "communication" => v,
                _ => v,
            };

            let mut query = match table {
                "react" => String::from("SELECT target AS key, emoji AS value, timestamp FROM react"),
                "communication" => String::from("SELECT target AS key, message AS value, timestamp FROM communication"),
                _ => format!("SELECT key, value, timestamp FROM {}", table),
            };

            // Remove args and arg_refs declarations, and use owned Strings for key/value to avoid borrowing conflicts.
            let mut key_owned = None;
            let mut value_owned = None;

            if key.is_some() || value.is_some() {
                query.push_str(" WHERE 1=1");
                if let Some(k) = key {
                    key_owned = Some(k.to_string());
                    query.push_str(" AND key = ?");
                }
                if let Some(vv) = value {
                    value_owned = Some(vv.to_string());
                    query.push_str(" AND value = ?");
                }
            }

            let arg_refs: Vec<&dyn rusqlite::ToSql> = [
                key_owned.as_ref().map(|s| s as &dyn rusqlite::ToSql),
                value_owned.as_ref().map(|s| s as &dyn rusqlite::ToSql),
            ]
            .iter()
            .filter_map(|&x| x)
            .collect();

            query.push_str(" ORDER BY timestamp DESC");

            let mut stmt = match conn.prepare(&query) {
                Ok(s) => s,
                Err(e) => return Err(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())),
            };

            let rows = stmt
                .query_map(rusqlite::params_from_iter(arg_refs.iter()), |row| {
                    Ok(Action {
                        key: row.get(0)?,
                        value: row.get(1)?,
                        timestamp: row.get(2)?,
                    })
                })
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;

            for row in rows {
                if let Ok(action) = row {
                    results.push(action);
                }
            }
        }

        results.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        Ok(results)
    }
}