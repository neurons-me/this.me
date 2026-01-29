<img src="https://res.cloudinary.com/dkwnxf6gm/image/upload/v1761149332/this.me-removebg-preview_2_j1eoiy.png" alt=".me Logo" width="144" />

# .me  
##### **1. NPM:**
```bash
npm install this.me
```
---

## .me in 20 Seconds

###### **Declare**
```ts
me.profile.name("Abella");
me.profile.age(30);
```

###### **Read**
```ts
me("profile.name"); // → "Abella"
me("profile.age");  // → 30
```

##### **Use in expressions**
```ts
if (me("profile.age") > 18) {
  console.log("Adult");
}
```

---

## 🌳 Infinite Semantic Trees
**.me** supports infinite nesting:

```ts
me.system.audio.filters.lowpass.cutoff(1200);
me.system.audio.filters.lowpass.resonance(0.7);
me("system.audio.filters.lowpass");
// → { cutoff: 1200, resonance: 0.7 }
```

You can construct any conceptual universe:

```ts
me.synth.moog.grandmother.osc1.wave("triangle");
me.synth.moog.grandmother.osc2.wave("square");
me("synth.moog.grandmother.osc1.wave");
// → "triangle"
```

---

## 🔐 Secrets: Encrypted Universes
Secrets create private branches:

```ts
me.wallet.balance(500).secret("ABC");
me.wallet.transactions.list([1,2,3]).secret("ABC");
```

Everything under that secret becomes encrypted as a single blob.
To access it:

```ts
me.secret("ABC");
me("wallet");  
// → { balance: 500, transactions: { list:[1,2,3] } }
```

Secrets can nest infinitely

```ts
me.wallet.hidden.note("private").secret("ABC").secret("DEEP");
me.secret("ABC");
me.secret("DEEP");
me("wallet.hidden");
// → { note: "private" }
```

- **A secret belongs to a specific position in the identity tree.**
- Everything under that position becomes encrypted.
- If you declare another secret inside, it becomes a deeper encrypted universe.
- Accessing the deepest universe requires walking the chain of secrets.

## **🌳 A secret attaches to a position in the tree**
You do:

```
me.wallet.secret("ABC");
```

**.me** interprets this as:
> “The subtree starting at wallet is encrypted with ABC.”
Diagram:

```text
root
 └── wallet  (SECRET ABC)
       ├── balance
       └── transactions
```

Everything below wallet is encrypted **as one block**.

## 🌚 Declaring another secret inside creates a nested universe
You do:
```
me.wallet.private.secret("DEEP");
```

Now **.me** interprets:
> “Inside wallet/ (encrypted under ABC), private/ will be encrypted under DEEP.”
Visual:

```text
root
 └── wallet  (SECRET ABC)
       ├── balance
       ├── transactions
       └── private  (SECRET DEEP)
             └── ...nodes...
```

## 🔐 Accessing nested secrets requires walking the secret chain
To read the inner content:

```js
me.secret("ABC");   // unlock wallet universe
me.secret("DEEP");  // unlock nested private universe
```

Then:

```js
me("wallet.private")  // returns decrypted inner structure
```

## **🌌 You can nest as many secrets as you want**

```js
me.x.secret("A");
me.x.y.secret("B");
me.x.y.z.secret("C");
```

To access:

```js
me.secret("A");
me.secret("B");
me.secret("C");
me("x.y.z");   // fully decrypted
```

Visual:

```
x  (A)
 └── y  (B)
      └── z  (C)
```

Every deeper secret is a smaller encrypted universe inside a larger encrypted universe.
This is **fractal encryption**.
Let’s rewrite your example cleanly:

```js
me.cars.keys.secret("X");
```

> “Does this mean cars.keys is public, but everything *inside* keys (after calling secret) becomes encrypted?”
##### **✔ YES.**
- cars → public
- cars.keys → public *branch*

- **everything inside** **cars.keys.\***
  (anything you declare after calling secret)
  → encrypted under "X"

### **🧠 Answer to common questions:**
##### **✔ Yes — you can declare secrets at specific positions.**
##### **✔ Yes — everything under that branch becomes encrypted.**
##### **✔ Yes — you can put another secret deeper.**
##### **✔ Yes — to access you must follow the entire chain of secrets.**

---

### 🧬 Why ME Works

- Proxies → infinite language surface  
- Path strings → universal query interface  
- Values → semantic meaning, not strict types  
- Secrets → fractal encrypted universes  
- Export → deterministic declarative identity  
- Zero dependencies  
- Browser & Node compatible  

---

### 📦 Export Identity

```ts
console.log(me.export());
```

Produces a deterministic structure:

```json
{
  "identityRoot": "0xabc...",
  "publicKey": "...",
  "identityHash": "...",
  "declarations": [
    { "key": "profile.name", "value": "Abella", ... },
    { "key": "profile.age", "value": 30, ... }
  ]
}
```

---

### 🧠 Full Example

```ts
import { ME } from "this.me";

const me = new ME("my-secret");

// Declare identity
me.name.first("Abella");
me.name.last("Eggleton");
me.profile.role("Musician");
me.profile.age(30);

// Semantic universes
me.system.audio.filters.lowpass.cutoff(1200);
me.system.audio.filters.lowpass.resonance(0.7);

// Encrypted branch
me.wallet.balance(500).secret("XYZ");
me.wallet.transactions.list([1,2,3]).secret("XYZ");

// Read values
console.log(me("name.first")); // "Abella"
console.log(me("profile.age")); // 30

// Logic
if (me("profile.age") > 21) {
  console.log("Access granted");
}

// Export
console.log(JSON.stringify(me.export(), null, 2));
```

---


<a href="https://www.neurons.me" target="_blank">
<img src="https://res.cloudinary.com/dkwnxf6gm/image/upload/v1760893633/npm-neurons-me_9b3e3a.jpg" style="zoom:16%;" /></a>

##### License
MIT © 2025 by https://neurons.me
See the [LICENSE](./LICENSE) file for details.

</file>
