<img src="https://docs.neurons.me/media/all-this/webP/this.me.webp" alt="SVG Image" width="250" height="250">

# THIS.ME  
<strong>.me</strong> is your identity that lives on your machine, under your control. It holds attributes, relationships, and keys that define who you are—and crucially, <strong>how you relate to others</strong>.

## Getting Started:

You can use **this.me** both in the browser and in Node environments. The library automatically detects the environment and provides a single global instance of `me` once initialized.

#### **1. Installation**

If you are using npm:

```bash
npm install this.me
```

Or load it directly in the browser (after building):

```html
<script src="this.me.umd.js"></script>
<script>
  // Global instance automatically attached to `window.me`
  console.log(me); // Ready to use after initialization
</script>
```

---

#### **2. Initialization**

You need to initialize the `.me` instance before using it:

```js
import me from "this.me";

await me.init({
  monadEndpoint: "http://localhost:7777" // optional, defaults to 7777
});
```

Once initialized, the `me` instance will maintain its state (status, loaded identities, etc.) globally.

---

#### **3. Checking Daemon Status**

You can verify if the local daemon is running:

```js
const status = await me.status();
console.log("Daemon active:", status.active);
```

The floating components or any GUI indicators (green/red) can rely directly on `me.status()`.

---

#### **4. Listing Identities**

```js
const list = await me.listUs();
console.log(list);
/*
[
  { alias: "suign", path: "/Users/abellae/.this/me/suign" }
]
*/
```

---

#### **5. Loading an Identity**

```js
await me.load("abellae", "mySecretHash");
console.log(me.active); // true if identity is successfully loaded
```

After loading, you can use all available methods (`be`, `have`, `do`, etc.).

---

#### **6. Example in the Browser Console**

If you include the UMD bundle:

```html
<script src="this.me.umd.js"></script>
<script>
  (async () => {
    await me.init();
    console.log(await me.status());
    console.log(await me.listUs());
  })();
</script>
```

- `me` is a **singleton instance** that lives in memory once initialized.
- Works in both browser and Node.
- Provides methods for status, identity management, and attribute handling.

------

### How this.me **Works (Simplified)**

The **Me** class creates and manages a **local, encrypted identity file** based on a username and a secret hash.

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
### 🛡️ Security Model
* No private key ever leaves the local `.me` file.
* Endorsements are public and verifiable using the public key.
* If compromised, user can rotate keys and notify authorities.

---
## 🌐 Multi-Device Support
* `.me` can be restored using a seed phrase or backup.
* New devices can be authorized using signatures from old devices.

---
## 🌍 Use Cases
* Digital signature of documents
* Smart contract interaction
* Federated profiles with trust anchors
* Group identity and shared contexts (`me && you && them in context/friends`)

---
<img src="https://suign.github.io/assets/imgs/monads.png" alt="Cleak Me Please" width="244">Hello, I am **.me**

----

#### License & Policies
- **License**: MIT License.
- **Learn more** at **https://neurons.me**
  [Terms](https://neurons.me/terms-and-conditions) | [Privacy](https://neurons.me/privacy-policy)

  <img src="https://docs.neurons.me/neurons.me.webp" alt="neurons.me logo" width="123" height="123">
