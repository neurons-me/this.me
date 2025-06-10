<img src="https://docs.neurons.me/media/all-this/webP/this.me.webp" alt="SVG Image" width="250" height="250">

# THIS.ME  
> **This.Me** is a data-structured identity designed to generate and manage identities, attributes, properties and more. It combines privacy, user control, and secure interoperability.

**.me** is a local, encrypted identity object designed to return ownership of identity back to the user. Its core philosophy is **user sovereignty**: your identity lives on your machine, under your control, not in someone else’s cloud. It holds attributes, relationships, and keys that define who you are—and crucially, **how you relate to others**.

Each **.me** instance can pair with other authorities or identities using its **cryptographic keys**, establishing **trust through signatures and endorsements** rather than centralized verification. Instead of logging in through third-party services, you can validate your identity or vouch for someone else’s using these key exchanges. This enables a decentralized trust model where relationships are verifiable, persistent, and portable—empowering systems to recognize who you are based on real, user-generated signals, not institutional permissions.

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

### **me create**

- **Description**: Creates a new .me identity.
- **Flow**: Prompts for username and hash (secret key), then saves an encrypted file at ~/.this/me/username.me.

------

### **me show [username]**

- **Description**: Shows the decrypted contents of an identity.
- **Flow**:
  - If [username] is not provided, it prompts for it.
  - Always prompts for the hash to unlock the identity.
  - If successful, prints the identity as JSON.

------

### **me list**

- **Description**: Lists all local .me identities.
- **Flow**: Reads the ~/.this/me directory and prints all .me files (usernames).

------

# **Me Class Constructor**

```
constructor(username)
```

Initializes:

- this.username: the username
- this.filePath: path to the encrypted file (/Users/youruser/.this/me/username.me)
- this.unlocked: whether the identity is unlocked in memory (RAM)
- this.data: decrypted content (attributes, keys, relationships)

> It doesn’t load anything yet—just defines the path and initial state.

------

### **save(hash)**

```
save(hash)
```

- Encrypts this.data using AES-256-CBC.
- Uses a random iv and a key derived from the hash (acting like a passphrase).
- Saves the file as: iv + encryptedBuffer.

> ⚠️ Throws an error if this.data is not set.

------

### **.unlock(hash)**

```javascript
unlock(hash)
```

- Loads the .me file from disk.
- Uses the first 16 bytes as the IV.
- Attempts to decrypt the rest using the key derived from the hash.
- If successful, stores the content in this.data and marks .unlocked = true.

> 🔒 If it fails, returns false (likely due to a wrong hash or a corrupted file).

------

### **.lock()**

```javascript
lock()
```

Clears this.data from memory and sets .unlocked = false.

------

### **.create(username, hash) (static)**

```javascript
static create(username, hash)
```

- If the file already exists, throws an error.
- Creates a new Me object with the structure:

```javascript
{
  identity: { username, publicKey, privateKey },
  attributes: {},
  relationships: [],
  reactions: [],
  endorsements: []
}
```

- Then calls .save(hash) to store the encrypted identity.

------

### **.load(username, hash) (static)**

```javascript
static load(username, hash)
```

- Creates a new Me instance.
- Calls .unlock(hash) to try decrypting it.
- If successful, returns the instance.
- If not, throws an error.

---

### **Social Methods**

#### **.addEndorsement(endorsement)**

Agrega una firma externa (ej: Alice confía en Bob) a la identidad desbloqueada.

#### **.be(key, value)**

The **be** method in the **Me** class accepts an object of **key-value pairs** and **adds these to the identity object**.
   ​•You can call **me.be()** multiple times with different attributes to dynamically update the identity object.

   ```javascript
// Create a new Me instance
let me = new Me("xyxyxy");
// Add attributes to the identity
me.be({ a: "XXX", b: "YYY" });
me.be({ c: "z" });
   ```

**A less abstract example:**

```js
// Add attributes to the identity
me.be({ name: "Alice", phone: "33550000" });
```

------

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
## 🌍 Use Cases
* Digital signature of documents
* Smart contract interaction
* Federated profiles with trust anchors
* Group identity and shared contexts (`me && you && them in context/friends`)

---
By default, **this.me** uses the **local file system (~/.this/me/)** to store and manage identity data.
No external service is required.

   ​<img src="https://suign.github.io/assets/imgs/monads.png" alt="Cleak Me Please" width="244">Hello, I am **.me**

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
  [Terms](https://docs.neurons.me/terms-and-conditions) | [Privacy](https://docs.neurons.me/privacy-policy)

  <img src="https://docs.neurons.me/neurons.me.webp" alt="neurons.me logo" width="123" height="123">
