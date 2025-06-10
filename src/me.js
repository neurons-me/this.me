// src/me.js
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const ROOT_DIR = path.join(os.homedir(), '.this', 'me');

class Me {
  constructor(username) {
    this.username = username;
    this.filePath = path.join(ROOT_DIR, `${username}.me`); // encrypted .me file path
    this.unlocked = false; // will become true after decrypting with correct hash
    this.data = null; // holds decrypted data (identity, keys, attributes, etc.)
  }

  /**
   * Encrypt and write the current `this.data` to disk.
   */
  save(hash) {
    if (!this.data) throw new Error('No data to save');
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(hash).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      iv,
      cipher.update(JSON.stringify(this.data)),
      cipher.final()
    ]);
    fs.writeFileSync(this.filePath, encrypted);
  }

  /**
   * Unlock the .me file by decrypting it using the provided hash.
   */
  unlock(hash) {
    const fileBuffer = fs.readFileSync(this.filePath);
    const iv = fileBuffer.slice(0, 16);
    const encryptedData = fileBuffer.slice(16);
    const key = crypto.createHash('sha256').update(hash).digest();
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
      ]);
      this.data = JSON.parse(decrypted.toString('utf-8'));
      this.unlocked = true;
      return true;
    } catch (err) {
      return false; // incorrect hash or corrupted file
    }
  }

  /**
   * Locks the session by wiping in-memory data.
   */
  lock() {
    this.data = null;
    this.unlocked = false;
  }

 /**
   * Create a new identity file for the given username.
   * Called only if it doesn't already exist.
   */
 static create(username, hash) {
  const me = new Me(username);
  if (fs.existsSync(me.filePath)) {
    throw new Error('Identity already exists');
  }

  // Generate keys or initial structure
  me.data = {
    identity: {
      username,
      publicKey: 'publicKeyPlaceholder', // later generate real keypair
      privateKey: 'privateKeyPlaceholder'
    },
    attributes: {},
    relationships: [],
    reactions: [],
    endorsements: []
  };

  me.save(hash);
  return me;
}

  /**
   * Create a new identity file for the given username.
   * Called only if it doesn't already exist.
   */
  static create(username, hash) {
    const me = new Me(username);
    if (fs.existsSync(me.filePath)) {
      throw new Error('Identity already exists');
    }

    // Generate keys or initial structure
    me.data = {
      identity: {
        username,
        publicKey: 'publicKeyPlaceholder', // later generate real keypair
        privateKey: 'privateKeyPlaceholder'
      },
      attributes: {},
      relationships: [],
      reactions: [],
      endorsements: []
    };

    me.save(hash);
    return me;
  }

  /**
   * Load and decrypt an existing identity.
   */
  static load(username, hash) {
    const me = new Me(username);
    const success = me.unlock(hash);
    if (!success) throw new Error('Invalid hash or corrupted file');
    return me;
  }
  /**
   * Add an endorsement (external signature asserting trust in this identity).
   */
  addEndorsement(endorsement) {
    if (!this.unlocked) throw new Error('Identity is locked');
    this.data.endorsements.push(endorsement);
  }

  /**
   * Example: add an attribute to this.me (like `.be("artist")`).
   */
  be(key, value) {
    if (!this.unlocked) throw new Error('Identity is locked');
    this.data.attributes[key] = value;
  }

  getAttributes() {
    if (!this.unlocked) throw new Error('Identity is locked');
    return this.data.attributes;
  }
}

export default Me;
