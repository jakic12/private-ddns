# Private DDNS

A minimal signed Dynamic DNS (DDNS) service.  
  
**This service does not actually handle the DNS part and only stores the ip in a text file.**
  
Clients periodically detect their public IP address, sign the payload using their private RSA key, and upload the signed request to the server. The server verifies the signature using the registered public key before accepting the update.

# Setup
## Server Setup
You can set it up using systemd `/usr/lib/systemd/system/private-ddns.service`
```
[Unit]
Description=Private ddns server
After=network.target

[Service]
Environment=PORT=5002
Type=simple
User=<USERNAME>
ExecStart=/usr/bin/node /srv/services/private-ddns/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
Make sure to replace <USERNAME> with you actual user name

# Client Setup

## Generate Client Keys

Generate a keypair for a client `MyCoolPC`:

```bash
npm install
node gen-keys.js MyCoolPC
```

Generated files:

```text
keys/MyCoolPC.priv.pem
keys/MyCoolPC.pub.pem
```
* Copy `MyCoolPC.pub.pem` to the server `/keys` folder

## Add a cron job to periodically send the ip

Create `.env`:

```env
CLIENT=MyCoolPC
SERVER_URL=http://your-server:3000
PRIV_KEY=keys/MyCoolPC.priv.pem
```
Add cron job
1. `crontab -e`
2. Add the following line:
```
0 * * * * cd /path/to/private-ddns && /usr/bin/node client.js >> cron.log 2>&1
```

# Stored Data

## Current IP

Latest IP:

```text
saved-ips/<clientId>/ip.txt
```

## Change History

Historical updates (if a client sends the same ip, it is not logged here, only on `server.js` standard output:

```text
saved-ips/<clientId>/changes.txt
```

Each line contains a JSON payload.

Example:

```json
{"timestamp":1710000000000,"ip":"1.2.3.4"}
```

## Client Flow

1. Client fetches its public IPv4 address
2. Client creates payload:

```json
{
  "timestamp": 1234567890,
  "ip": "1.2.3.4"
}
```

3. Payload is signed with the client's private RSA key
4. Client sends:

```json
{
  "clientId": "client1",
  "payload": "...",
  "signature": "..."
}
```

5. Server verifies the signature using the stored public key
6. If valid, the IP is stored

# Current Limitations

* No replay protection
* No timestamp validation
* No HTTPS enforcement
* No rate limiting
* IPv4 only
* Filesystem storage only
* Public keys are reloaded on every request
