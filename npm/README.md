<img src="https://docs.neurons.me/media/all-this/webP/this.me.webp" alt="SVG Image" width="250" height="250">

# THIS.ME  
> **This.Me** is a data-structured identity designed to generate and manage identities, attributes, properties and more. It combines privacy, user control, and secure interoperability.

<strong>.me</strong> is your identity that lives on your machine, under your control. It holds attributes, relationships, and keys that define who you are—and crucially, <strong>how you relate to others</strong>.

 Each <strong>.me</strong> instance can pair with other authorities or identities using its <strong>cryptographic keys</strong>, establishing <strong>trust through signatures and endorsements</strong>. 

Instead of logging in through third-party services, you can validate your identity or vouch for someone else’s using these key exchanges. This enables a decentralized trust model where relationships are verifiable, persistent, and portable.

# Getting Started:
1. ##### **Install `this.me`:**
   Open your terminal and run the following command to install the `this.me` package:
   ```js
   npm i -g this.me
   ```

2. **Run this command on your terminal:**

   ```bash
   me
   ```

The **Me** class represents a **persistent identity**, stored as an encrypted file (username.me) in ~/.this/me. This file contains:
- An identifier (username)
- Keys (private/public — currently placeholders)
- User-defined attributes
- Relationships and other social elements (reactions, attributies, properties, endorsements...)

It can be **created**, **read** (if you have the correct hash), **modified in memory**, and then **saved again** in encrypted form.

# Command Line Options:

**Run this commands on your terminal:**

```bash
me create
```

- **Description**: Creates a new .me identity.
- **Flow**: Prompts for username and hash (secret key), then saves an encrypted file at ~/.this/me/username.me.

------

```bash
me show [username]
```

- **Description**: Shows the decrypted contents of an identity.
- **Flow**:
  - If [username] is not provided, it prompts for it.
  - Always prompts for the hash to unlock the identity.
  - If successful, prints the identity as JSON.

------

```bash
me list
```

- **Description**: Lists all local .me identities.
- **Flow**: Reads the ~/.this/me directory and prints all .me files (usernames).

------

# How this.me **Works (Simplified)**

The Me class creates and manages a **local, encrypted identity file** based on a username and a secret hash.

#### **Creating a new identity**

When you run:

```js
Me.create('abellae', 'mySecretHash');
```

It does the following:

- Builds a .me file path: ~/.this/me/abellae.me.
- Creates some **identity data** (username, keys, attributes, etc.).
- Uses the hash to **encrypt** that data with AES-256-CBC:
  - It generates a random iv (initialization vector).
  - Derives a key from the hash (sha256(hash)).
  - Stores the encrypted result as iv + encryptedData.

> 🔒 The hash is **never saved** — it’s just used as a secret key.

------

#### Loading an existing identity

When you run:

```js
Me.load('abellae', 'mySecretHash');
```

It:

- Reads the encrypted .me file.
- Extracts the first 16 bytes as iv.
- Recomputes the key from the given hash.
- Tries to decrypt the file.
- If it works, it unlocks the identity and loads the data into memory.

------

#### **Using the unlocked identity**

Once unlocked, you can:

- Set attributes: me.be('developer', true)
- Add endorsements: me.addEndorsement(...)
- View attributes: me.getAttributes()
- Save updates with: me.save('mySecretHash')

------

#### Locking the identity

You can clear the identity from memory with:

```js
me.lock();
```

This keeps the encrypted file on disk but removes all data from RAM.

------

### **Summary**

- Your identity is encrypted on your own machine.
- Only the correct hash can unlock it.
- No third parties are involved.
- The .me file is secure, portable, and self-owned.

Let me know if you’d like a diagram or visual flow to go with this explanation!

---

### 🔍 Core Principles

1. **Freedom to Declare**
   Anyone can generate a `.me` identity locally without external approval.
2. **Trusted Endorsements**
   Authorities (e.g., Cleaker) can endorse `.me` identities without controlling them.
3. **Local Ownership**
   All sensitive data (including private keys) stays on the user's machine.

---
### 📁 File Structure
* `~/.this/me/username.me.json` — Encrypted identity file
* `.me` includes:

  * `username`
  * `publicKey`, `privateKey` (encrypted)
  * `attributes`, `relationships`, `reactions`, `properties`, `relationships`
  * `endorsements`

---
### 🔐 Cryptographic Model
* Identity is unlocked using a user-defined `hash` (password).
* This hash decrypts the local `.me` file.
* The identity includes:

  * A **key pair** (public/private) for signing and verification.
  * Optional **endorsements** signed by Cleaker or other authorities.

---
### 🛡️ Security Model
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
## 🌍 Use Cases
* Digital signature of documents
* Smart contract interaction
* Federated profiles with trust anchors
* Group identity and shared contexts (`me && you && them in context/friends`)

---
By default, **this.me** uses the **local file system (~/.this/me/)** to store and manage identity data.
No external service is required.

<img src="https://suign.github.io/assets/imgs/monads.png" alt="Cleak Me Please" width="244">Hello, I am **.me**

### ❯ add.me 
----

# What is All.This?
###### Modular Data Structures:
**Each module** in **[all.this](https://neurons.me/all-this)** represents a specific **datastructure**. These **classes** encapsulate the functionalities and **data specific to their domain.**

**[this.me](https://docs.neurons.me/this.me/index.html)  - [this.audio](https://docs.neurons.me/this.audio/index.html) - [this.text](https://docs.neurons.me/this.text/index.html) - [this.wallet](https://docs.neurons.me/this.wallet/index.html) - [this.img](https://docs.neurons.me/this.img/index.html) - [this.pixel](https://docs.neurons.me/this.pixel/index.html) - [be.this](https://docs.neurons.me/be.this/index.html) - [this.DOM](https://docs.neurons.me/this.DOM/index.html) - [this.env](https://docs.neurons.me/this.env/index.html) - [this.GUI](https://docs.neurons.me/this.GUI/index.html) - [this.be](https://docs.neurons.me/this.be/index.html) - [this.video](https://docs.neurons.me/this.video/index.html) - [this.dictionaries](https://docs.neurons.me/this.dictionaries/index.html)** 

#### Contribution
If you are interested in collaborating or wish to share your insights, please feel free to reach out or contribute to the project.

#### License & Policies
- **License**: MIT License.
- **Learn more** at **https://neurons.me**
  [Terms](https://neurons.me/terms-and-conditions) | [Privacy](https://neurons.me/privacy-policy)

  <img src="https://docs.neurons.me/neurons.me.webp" alt="neurons.me logo" width="123" height="123">
