//this.me/src/me.js
import crypto from 'crypto';
import os from 'os';

// Define the .me class
class Me {
  // Static property to keep track of all users globally
  static registry = {};

  constructor(username = 'monad') {
    if (Me.registry[username]) {
      throw new Error(`Username ${username} already exists in the registry.`);
    }
    this.username = this.validateMe(username);
    this.identity = {
      username: this.username,
      hash: this.sha256(),
      host: this.getHostInfo()
    };
    Me.registry[username] = this; // Add to global registry
  }

  validateMe(username) {
    const regex = /^[a-zA-Z0-9]{1,21}$/;
    if (regex.test(username)) {
      return username;
    } else {
      throw new Error('Incorrect username. Only letters and numbers are allowed, and it must be between 1 and 21 characters.');
    }
  }

  sha256() {
    return crypto.createHash('sha256').update(this.username).digest('hex');
  }

  getHostInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      networkInterfaces: os.networkInterfaces()
    };
  }

  be(attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      this.identity[key] = value;
    }
  }

  // Static method to retrieve all users
  static getAllUsers() {
    return Me.registry;
  }
}
