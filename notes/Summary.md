# this.me — Identity System

## ✨ Summary
`this.me` is a decentralized identity system designed to allow users to manage their own identities locally, with optional validation by external authorities such as Cleaker. It combines privacy, user control, and secure interoperability.


## 🔐 Identity Model Comparison
| **Model**            | **Where your identity lives** | **Local signing** | **Real freedom**        |
|----------------------|-------------------------------|-------------------|--------------------------|
| Web2 (Facebook, etc) | On their servers              | ❌                | ❌                       |
| Web3 (wallets)       | In extensions or apps         | ✅                | 🟡 (fragmented)          |
| `this.me`            | In your OS `.this/me/`        | ✅✅              | ✅✅✅                   |

---

## 🔍 Core Principles
1. **Freedom to Declare**
   Anyone can generate a `.me` identity locally without external approval.
2. **Trusted Endorsements**
   Authorities (e.g., Cleaker) can endorse `.me` identities without controlling them.
3. **Local Ownership**
   All sensitive data (including private keys) stays on the user's machine.

---
## 📁 File Structure
* `~/.this/me/username.me.json` — Encrypted identity file
* `.me` includes:

  * `username`
  * `publicKey`, `privateKey` (encrypted)
  * `attributes`, `relationships`, `reactions`, `properties`, `relationships`
  * `endorsements`

---

## 🔎 Identity Lifecycle

### 1. Create Identity
```bash
me create jabellae
# Prompts for hash (e.g. 4242)
# Generates encrypted .me file
```

### 2. Register/Endorse with Authority
```bash
me endorse --with cleaker
# Signs and shares publicKey with Cleaker
```

### 3. Verify Identity
```bash
me verify --with cleaker
# Validates signature and authority endorsement
```

### 4. Migrate Across Devices
```bash
me restore --from-seed
# Or use encrypted backup file + hash
```

### 5. Rotate Keys
```bash
me rotate
# Generates new key pair, requires re-endorsement
```

---

## 🔐 Cryptographic Model
* Identity is unlocked using a user-defined `hash` (password).
* This hash decrypts the local `.me` file.
* The identity includes:

  * A **key pair** (public/private) for signing and verification.
  * Optional **endorsements** signed by Cleaker or other authorities.

---

## 🛡️ Security Model
* No private key ever leaves the local `.me` file.
* Endorsements are public and verifiable using the public key.
* If compromised, user can rotate keys and notify authorities.

---

## 🌐 Multi-Device Support
* `.me` can be restored using a seed phrase or backup.
* New devices can be authorized using signatures from old devices.

---

## ⚖️ Responsibilities

* **this.me**
  * Local file management, encryption, signing.
  * CLI + API for usage.

* **Cleaker / Authorities**

  * Store trusted records of `username` + `publicKey`
  * Provide validation/endorsement services.

---

## 🌍 Future Use Cases
* Digital signature of documents
* Smart contract interaction
* Federated profiles with trust anchors
* Group identity and shared contexts (`me && you && them in context/friends`)

---

## 📖 Glossary
* `hash`: A password-like string used to unlock `.me`
* `endorsement`: Signature from a recognized authority on the identity
* `publicKey/privateKey`: Cryptographic key pair for identity signing
* `Cleaker`: Example identity authority ledger

---

**Author:** suiGn / neurons.me
**License:** MIT
**Project:** [this.me](https://www.npmjs.com/package/this.me)
