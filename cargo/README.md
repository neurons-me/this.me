# this-me
`this-me` is a lightweight identity expression built in Rust that allows you to create, manage, and securely store minimal user identity files locally. It is part of the Neurons.me ecosystem and is designed for applications where user-controlled identity and privacy are fundamental. 

## 🧱 Architecture
- The `Me` struct represents an identity.
- Identity files are loaded using `Me::load(username, hash)`.
- Verbs (e.g. `have`, `be`, `say`, etc.) are applied as methods on a loaded `Me`.
- After modifying the identity with verbs, `me.save()` must be called to persist changes.

## ✨ Features
- Create a local identity file with a username and a hash password-derived encryption key
- Decrypt and view stored identity data
- Change the hash (password) for an identity
- Delete the identity file securely

## 📦 Installation
To install `this-me`, you need to have Rust installed. Then run:

```bash
cargo install this-me
```

Or, if you're working in the repository:
```bash
cargo build --release
```

## 🚀 Usage
Each command is executed via the CLI binary `me`. Identity loading is done automatically and implicitly by each command.

### Create Identity
```bash
me create <username> <password>
```
Initializes a new identity file under `.this/me/<username>.me` using the given password to encrypt it.

### Display Identity
```bash
me display <username> <password>
```
Decrypts and displays the identity file contents.

### Verbs (Modify Identity)
```bash
me be <username> <password> <key> <value>
me have <username> <password> <key> <value>
me say <username> <password> <key> <value>
```
These commands modify the identity in memory after loading it, and then save the changes automatically.

### Delete Identity
```bash
me delete <username> <password>
```
Deletes the identity file, only if the provided password is correct.

### Change Password (Hash)
```bash
me change-hash <username> <old_password> <new_password>
```
Changes the encryption hash for the identity file.

## 📚 Using as a Library
```rust
use this_me::Me;

let mut me = Me::load("suigeneris", "1234")?;
me.be("musician", "true")?;
me.save()?;
```

## 📂 Identity File Location
Identity files are stored in:
```
~/.this/me/<username>.me
```
This path is hidden and local to your machine.

## ⚠️ Username & Password Rules
- Usernames must be 5–21 characters long and only include letters, numbers, `.` or `_`.
- Passwords must be at least 4 characters long.

## 🧠 Project Goals
`this-me` aims to decentralize identity management. Instead of relying on external servers or cloud providers, identities are stored and encrypted locally by the user. This forms the basis of a self-sovereign identity approach, aligned with the broader goals of the Neuroverse ecosystem — building tech that empowers individuals to control their own digital footprint.

## 🛠 Development
To run tests or debug:

```bash
cargo test
cargo run --bin me -- <command> ...
```

---

Built with ❤️ as part of the [Neuroverse](https://neurons.me) initiative.