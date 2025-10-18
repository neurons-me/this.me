# this-me
-  `Me` represents an encrypted identity file.
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

| **Subcomando**                               | **Descripción**                                              | **Ejemplo**                                                  |
| -------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ✅ Create                                     | Crea una nueva identidad .me                                 | me create --username abella --password secret                |
| 📂 List                                       | Muestra todas las identidades                                | me list                                                      |
| 🔄ChangePassword                              | Cambia la contraseña de una identidad                        | me changepassword --username abella --old-password secret --new-password newpass |
| 📖 Display                                    | Muestra una identidad guardada                               | me display --username abella --password secret               |
| Be, Do, Have, At, Relate, React, Communicate | Son verbos declarativos del modelo semántico de this.me (atributos del yo) | me have --username abella --password secret --value "synthesizer" |
| Get                                          | Recupera un valor guardado, con filtros (context, key, tiempo, etc.) | me get --username abella --password secret --verb have       |
| Host                                         | Muestra información del host (hostname, IP, LAN, etc.)       | me host                                                      |

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
