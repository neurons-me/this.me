<img src="https://res.cloudinary.com/dkwnxf6gm/image/upload/v1761149332/this.me-removebg-preview_2_j1eoiy.png" alt="57b0b83e8518fecf9b3e2d06457421c7da70e0663f7490fab98f9ecbdbe5db6e-removebg-preview" style="zoom:34%;" />

# .ME  
You can use **.me** both in **browser** and **Node** environments. 
#### **1. NODEJS**
Using **npm**:

```bash
npm install this.me
```

#### **2.BROWSER (build):**

```html
<script src="this.me.umd.js"></script>
<script>
  // Global instance automatically attached to `window.me`
  console.log(me); // Ready to use after initialization
</script>
```

---

#### **Initialization**
You need to initialize the `.me` instance before using it:

```js
import me from "this.me";
await me.init({
  monadEndpoint: "http://localhost:7777" // optional, defaults to 7777
});
```

Once initialized, the `me` instance will maintain its state (status, loaded identities, etc.) globally.

---

#### **Checking Daemon Status**
You can verify if the local daemon is running:

```js
const status = await me.status();
console.log("Daemon active:", status.active);
```

The floating components or any GUI indicators (green/red) can rely directly on `me.status()`.

---

#### **Listing Identities**
```js
const list = await me.listUs();
console.log(list);
```

```bash
[
  { alias: "suign", path: "/Users/abellae/.this/me/suign" }
]
```



---

#### **Loading an Identity**
```js
await me.load("abellae", "mySecretHash");
console.log(me.active); // true if identity is successfully loaded
```

After loading, you can use all available methods (`be`, `have`, `do`, etc.).

---

# **Example in the Browser Console**
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
- Works in both browser and node.
- Provides methods for status, identity management, and attribute handling.

------

### How .me **Works (Simplified)**
The **Me** class creates and manages a **local, encrypted identity file** based on a username and a secret hash.
#### **Creating a new identity**
When you run:

```js
Me.create('abellae', 'mySecretHash');
```

> 🔒 The hash is **never saved** — it’s just used as a secret key.

------

#### Loading an existing identity
When you run:

```js
Me.load('abellae', 'mySecretHash');
```

It:
- Reads the **encrypted .me** file.
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
- The **.me** file is secure, portable, and self-owned.

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
* Endorsements are public and verifiable using the **public key.**
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
  <img src="https://docs.neurons.me/neurons.me.webp" alt="neurons.me logo" width="89" height="89">
