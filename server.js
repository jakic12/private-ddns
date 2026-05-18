// server.js

const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

const KEYS_DIR = path.join(__dirname, "keys");
const SAVE_IPS_DIR = path.join(__dirname, "saved-ips");

const saveIp = (clientId, data) => {
  const clientDir = path.join(SAVE_IPS_DIR, clientId);

  // Ensure directories exist
  fs.mkdirSync(clientDir, { recursive: true });

  // Paths
  const ipFile = path.join(clientDir, "ip.txt");
  const changesFile = path.join(clientDir, "changes.txt");

  // Append change entry
  if (!fs.existsSync(ipFile) || fs.readFileSync(ipFile) != data.ip) {
    const logEntry = JSON.stringify(data) + "\n";
    fs.appendFileSync(changesFile, logEntry, "utf8");
  }

  // Save latest IP
  fs.writeFileSync(ipFile, data.ip, "utf8");
};

const loadApprovedKeys = () => {
  const approved = {};
  const files = fs.readdirSync(KEYS_DIR);

  for (const file of files) {
    if (file.endsWith(".pub.pem")) {
      const clientId = file.replace(".pub.pem", "");
      approved[clientId] = fs.readFileSync(path.join(KEYS_DIR, file), "utf8");
    }
  }

  return approved;
};

const verifySignature = (publicKey, payload, signature) => {
  const verifier = crypto.createVerify("SHA256");

  verifier.update(payload);
  verifier.end();

  return verifier.verify(publicKey, signature, "base64");
};

app.post("/set-ip", (req, res) => {
  try {
    const { clientId, payload, signature } = req.body;

    if (!clientId || !payload || !signature) {
      return res.status(400).json({
        error: "Missing fields",
      });
    }

    // Check approved key
    const approvedKeys = loadApprovedKeys();
    const publicKey = approvedKeys[clientId];

    if (!publicKey) {
      return res.status(403).json({
        error: "Client not approved",
      });
    }

    if (typeof payload != "string") {
      return res.status(403).json({
        error: "Payload should be a string (stringified json)",
      });
    }

    // Verify signature
    const valid = verifySignature(publicKey, payload, signature);

    if (!valid) {
      return res.status(401).json({
        error: "Invalid signature",
      });
    }

    const payloadJson = JSON.parse(payload);
    console.log("Trusted payload received:");
    console.log(payloadJson);

    saveIp(clientId, payloadJson);

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
