use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Action {
    pub key: String,
    pub value: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Verbs {
    pub be: Vec<Action>,
    pub have: Vec<Action>,
    pub at: Vec<Action>,
    pub relate: Vec<Action>,
    pub react: Vec<Action>,
    pub say: Vec<Action>,
}

impl Verbs {
    pub fn new() -> Self {
        Self::default()
    }

    fn now_timestamp() -> String {
        Utc::now().to_rfc3339()
    }

    pub fn be(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        let action = Action {
            key: key.to_string(),
            value: value.to_string(),
            timestamp: Self::now_timestamp(),
        };
        self.be.push(action);
        Ok(())
    }

    pub fn have(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        let action = Action {
            key: key.to_string(),
            value: value.to_string(),
            timestamp: Self::now_timestamp(),
        };
        self.have.push(action);
        Ok(())
    }

    pub fn at(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        let action = Action {
            key: key.to_string(),
            value: value.to_string(),
            timestamp: Self::now_timestamp(),
        };
        self.at.push(action);
        Ok(())
    }

    pub fn relate(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        let action = Action {
            key: key.to_string(),
            value: value.to_string(),
            timestamp: Self::now_timestamp(),
        };
        self.relate.push(action);
        Ok(())
    }

    pub fn react(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        let action = Action {
            key: key.to_string(),
            value: value.to_string(),
            timestamp: Self::now_timestamp(),
        };
        self.react.push(action);
        Ok(())
    }

    pub fn say(&mut self, key: &str, value: &str) -> std::io::Result<()> {
        let action = Action {
            key: key.to_string(),
            value: value.to_string(),
            timestamp: Self::now_timestamp(),
        };
        self.say.push(action);
        Ok(())
    }
}