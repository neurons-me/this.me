cargo install this-me
# this-me

`this-me` is a lightweight identity system built in Rust that allows you to create, manage, and securely store minimal user identity files locally. It is part of the Neuroverse ecosystem and is designed for applications where user-controlled identity and privacy are fundamental.

## ✨ Features
- Create a local identity file with a username and a password-derived encryption key
- Decrypt and view stored identity data
- Change the password (hash) for an identity
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
Each command is executed via the CLI binary `me`. Here are the available commands:

### Create Identity
```bash
me create <username> <password>
```
Creates a new identity file under `.this/me/<username>.me` using the given password to encrypt it.

### Show Identity
```bash
me show <username> <password>
```
Decrypts and displays the identity file contents.

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