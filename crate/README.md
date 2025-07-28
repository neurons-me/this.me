# this-me
`this-me` is a lightweight identity expression that allows you to create, manage, and securely store minimal user identity files locally. It is part of the **neurons.me ecosystem** and is designed for applications where user-controlled identity and privacy are fundamental. 

- The `Me` struct represents a crypto identity.
- Verbs (e.g. `have`, `be`, `say`, etc.) are applied as methods on a loaded `Me`.

# 📦 Installation
To install `this-me`, you need to have Rust installed. Then run:

```bash
cargo install this-me
```

---

# 🚀 .me CLI Usage

Each command is executed via the CLI binary me. Identity loading is done automatically and implicitly by each command.

#### **✅** **Create Identity**

```
me create <alias> <password>
```

Initializes a new identity file under:

```
~/.this/me/<alias>/
```

using the given password (hash) to encrypt it.

#### **🔄** **Change Identity Password (Hash)**

```
me change-hash <alias> <old-password> <new-password>
```

Changes the password (hash) protecting the identity.

*(Currently in progress: implemented but still uses* *todo!()* *internally).*

#### **📖** **Display Identity**

```
me display <alias> <password>
```

Decrypts and displays the identity file contents in pretty JSON.

#### 📂 **List Identities**

```
me list
```

Lists all identities stored under ~/.this/me.

------

# 📚 .me Using as a Library
```rust
use this_me::Me;

let mut me = Me::load("suigeneris", "1234")?;
me.be("musician", "true")?;
me.save()?;
```

# 📂 .me Locations
Identity files are stored in:
```
~/.this/me/<username>.me
```
This path is hidden and local to your machine.

----

## ⚠️ Username & Password Rules

- Usernames must be 5–21 characters long and only include letters, numbers, `.` or `_`.
- Passwords must be at least 4 characters long.

---

Built with ❤️ as part of the [Neuroverse](https://neurons.me) initiative.