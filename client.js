const { publicIpv4 } = require("public-ip");
require("dotenv").config();

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CLIENT_PRIVATE_KEY = fs.readFileSync(
  process.env.PRIV_KEY || path.join(__dirname, "keys/client1.priv.pem"),
  "utf8",
);

publicIpv4().then((ip) => {
  const payload = {
    timestamp: Date.now(),
    ip,
  };

  const payloadString = JSON.stringify(payload);
  const signer = crypto.createSign("SHA256");

  signer.update(payloadString);
  signer.end();

  const signature = signer.sign(CLIENT_PRIVATE_KEY, "base64");

  // Request body
  const body = {
    clientId: process.env.CLIENT,
    payload: payloadString,
    signature: signature,
  };

  console.log(`Sending ${payloadString} with priv key ${process.env.PRIV_KEY}`);

  // Send request
  fetch(`${process.env.SERVER_URL}/set-ip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((r) => r.json())
    .then(console.log)
    .catch(console.error);
});
