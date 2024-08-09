//this.me/src/me.js
import crypto from 'crypto';
import os from 'os';

// Define the .me class
class Me {
  constructor(username = 'monad') {
    this.username = this.validateUsername(username);
    this.identity = {
      username: this.username,
      hash: this.sha256(),
      host: this.getHostInfo()
    };
  }

  // Method to validate the username
  validateUsername(username) {
    const regex = /^[a-zA-Z0-9]+$/; // Only letters and numbers
    if (regex.test(username)) {
      return username;
    } else {
      throw new Error('Incorrect username. Only letters and numbers are allowed.');
    }
  }

  // Method to generate a cryptographic hash of the username
  sha256() {
    return crypto.createHash('sha256').update(this.username).digest('hex');
  }

  // Method to get host information
  getHostInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      networkInterfaces: os.networkInterfaces()
    };
  }

  // Method to add key-value pairs to the identity object
  be(attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      this.identity[key] = value;
    }
  }

  // Method to get the identity object
  identify() {
    return this.be;
  }
}

export default Me;