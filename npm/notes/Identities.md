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



----

