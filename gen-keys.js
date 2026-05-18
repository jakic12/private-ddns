const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const clientId = process.argv[2];

if (!clientId) {
  console.error("Usage: node generate-keys.js <clientId>");
  process.exit(1);
}

const keysDir = path.join(__dirname, "keys");

// Create keys directory if missing
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir);
}

// Generate RSA keypair
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 4096,

  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },

  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

// Save files
const privateKeyPath = path.join(keysDir, `${clientId}.priv.pem`);
const publicKeyPath = path.join(keysDir, `${clientId}.pub.pem`);

fs.writeFileSync(privateKeyPath, privateKey);
fs.writeFileSync(publicKeyPath, publicKey);

console.log("Keys generated:");
console.log(privateKeyPath);
console.log(publicKeyPath);

console.log(
  `Please copy the private key (${clientId}.priv.pem) to the server keys folder and set env PRIV_KEY=keys/${clientId}.pub.pem for client`,
);
