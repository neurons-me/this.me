// Crate root — this-me/crate/src/lib.rs
// ---- Common utilities and legacy (SQLite) API ----
pub mod utils;
pub mod manager;
// Legacy local-first API (SQLite-backed) that you already have working.
// Kept intact for backwards compatibility with the existing CLI.
#[cfg(feature = "sqlite")]
pub mod me;
#[cfg(feature = "sqlite")]
mod verbs;
#[cfg(feature = "sqlite")]
pub use me::Me;
#[cfg(feature = "sqlite")]
pub use manager::list_us;
// ---- Storage-agnostic core API (async) ----
// This layer defines the MeStore trait and the generic Me<S: MeStore>
// that works over any backend (e.g., PostgreSQL for Cleaker).
pub mod core;
// ---- Database backends ----
// PostgreSQL/SQLite backend modules are conditionally compiled inside `db/mod.rs`.
// Cleaker will depend on these types from the `pg` feature.
pub mod db;
// (Optional) If later SQLite adapter for the core API,
// expose it here as `pub mod sqlite;`
// For now, your legacy `me.rs` + `verbs.rs` cover local SQLite usage.