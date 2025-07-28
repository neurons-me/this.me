//this.me/src/migrate_schema.rs
// by suiGn 
use rusqlite::{Connection, Result as SqlResult};
pub fn migrate_schema(conn: &Connection) -> SqlResult<()> {
    // Table for identity metadata
    conn.execute(
        "CREATE TABLE IF NOT EXISTS me (
            alias TEXT PRIMARY KEY,
            public_key TEXT NOT NULL,
            private_key TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;
    // Table for "be" verb
    conn.execute(
        "CREATE TABLE IF NOT EXISTS be (
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            is_private INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    // Table for "have" verb
    conn.execute(
        "CREATE TABLE IF NOT EXISTS have (
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            is_private INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    // Table for "at" verb
    conn.execute(
        "CREATE TABLE IF NOT EXISTS at (
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            is_private INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    // Table for "relate" verb
    conn.execute(
        "CREATE TABLE IF NOT EXISTS relate (
            target TEXT NOT NULL,
            key TEXT,
            value TEXT,
            timestamp TEXT NOT NULL,
            is_private INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    // Table for "react" verb
    conn.execute(
        "CREATE TABLE IF NOT EXISTS react (
            target TEXT NOT NULL,
            emoji TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            is_private INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;


    // Table for "do" verb
    conn.execute(
        "CREATE TABLE IF NOT EXISTS do_ (
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            is_private INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    // Table for "communication" verb
    conn.execute(
        "CREATE TABLE IF NOT EXISTS communication (
            target TEXT NOT NULL,
            message TEXT NOT NULL,
            lang TEXT DEFAULT 'en',
            timestamp TEXT NOT NULL,
            is_private INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    Ok(())
}