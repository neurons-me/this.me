const crypto = require('crypto');

function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Store the keys securely (e.g., in files or secure storage).

  return { publicKey, privateKey };
}

// Example usage:
const { publicKey, privateKey } = generateKeyPair();
console.log('Public Key:', publicKey);
console.log('Private Key:', privateKey);