# this-me

`this-me` is a lightweight, local-first identity system designed for decentralized and privacy-conscious applications. It allows users to create, manage, and securely store encrypted identity files. Part of the **neurons.me** ecosystem, `this-me` treats identity as a living structure, expressed semantically through verbs.

- The `Me` struct represents an encrypted identity file.
- Verbs (e.g. `be`, `do`, `have`, `communicate`, `at`, `react`, `relate` ) are invoked as methods on a loaded `Me`.

---

# 📦 Installation
If published to crates.io:

```bash
cargo install this-me
```

If installing locally from source:

```bash
cargo install --path .
```

---

# 🚀 .me CLI Usage
Each command is executed via the CLI binary `me`. Identity loading is automatic and based on the provided username and password.

### ✅ Create Identity
```bash
me create --username <username> --password <password>
```

### 🔄 Change Identity Password
```bash
me change-password --username <username> --old-password <old_password> --new-password <new_password>
```

Updates the password protecting the identity.

### 📖 Display Identity
```bash
me display --username <username> --password <password>
```

Decrypts and displays the identity contents in pretty JSON.

### 📂 List Identities
```bash
me list
```

Lists all existing identities stored under `~/.this/me`.

## Verbs
```bash
# be
me be --username exampleUser --password 123456 --key "identity" --value "creator"
# do
me do --username exampleUser --password 123456 --key "task" --value "build"
# have
me have --username exampleUser --password 123456 --key "tools" --value "rust"
# at
me at --username exampleUser --password 123456 --key "location" --value "Cancun"
# relate
me relate --username exampleUser --password 123456 --key "project" --value "cleaker"
# react
me react --username exampleUser --password 123456 --key "neurons.me" --value "🚀"
```

---

# Get
```bashç
me get --username exampleUser --password 123456 --verb be
me get --username exampleUser --password 123456 --verb do
me get --username exampleUser --password 123456 --verb all
me get --username exampleUser --password 123456 --verb have --key tools
```

Retrieves stored verb entries for a given user. You can filter by:
- `--verb`: specify the verb table (`be`, `do`, `have`, etc.) or use `all` to search across all.
- `--key` and `--value` (optional): refine the search for specific attributes.
Results are printed with timestamped entries.

----

If you are running from the project and not the binary run:
```bash
cargo run -- instead of me
```

**Example:**
```bash
# list (identidades registradas)
cargo run -- list
# create (crear nueva identidad)
cargo run -- create --username newUser --password secret123
```

----

## ⚠️ Username & Password Rules
- Usernames must be 5–21 characters long and only include letters, numbers, `.` or `_`.
- Passwords must be at least 4 characters long.

---

Built with ❤️ as part of the [Neuroverse](https://neurons.me) initiative.
