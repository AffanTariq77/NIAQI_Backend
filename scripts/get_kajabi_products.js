// Simple script to exchange client credentials for an access token then list products
// Usage: node scripts/get_kajabi_products.js

const fs = require("fs");
const path = require("path");
const https = require("https");

// Load env from project root NIAQI/.env
const envPath = path.resolve(__dirname, "../..", "NIAQI", ".env");
if (!fs.existsSync(envPath)) {
  console.error("Could not find .env at", envPath);
  process.exit(1);
}
const env = fs.readFileSync(envPath, "utf8");
env.split(/\r?\n/).forEach((line) => {
  const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
});

const clientId = process.env.EXPO_PUBLIC_KAJABI_CLIENT_ID;
const clientSecret = process.env.EXPO_PUBLIC_KAJABI_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("Missing KAJABI client id/secret in env");
  process.exit(1);
}

function postTokenGrant() {
  const data = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();

  const opts = {
    hostname: "api.kajabi.com",
    path: "/v1/oauth/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(data),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let body = "";
      console.log("Token request status", res.statusCode);
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        console.log("Token response body:", body);
        try {
          const json = JSON.parse(body || "{}");
          if (res.statusCode >= 200 && res.statusCode < 300)
            return resolve(json);
          return reject({ status: res.statusCode, body: json });
        } catch (err) {
          return reject(err);
        }
      });
    });
    req.on("error", (err) => {
      console.error("Token request error", err);
      reject(err);
    });
    req.write(data);
    req.end();
  });
}

function getProducts(accessToken) {
  const opts = {
    hostname: "api.kajabi.com",
    path: "/v1/products",
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let body = "";
      console.log("Products request status", res.statusCode);
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        console.log("Products response body:", body);
        try {
          const json = JSON.parse(body || "{}");
          if (res.statusCode >= 200 && res.statusCode < 300)
            return resolve(json);
          return reject({ status: res.statusCode, body: json });
        } catch (err) {
          return reject(err);
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

(async () => {
  try {
    console.log("Requesting token...");
    const tokenRes = await postTokenGrant();
    const accessToken = tokenRes.access_token;
    if (!accessToken) {
      console.error("No access_token in token response", tokenRes);
      process.exit(2);
    }
    console.log("Got access token, fetching products...");
    const products = await getProducts(accessToken);
    console.log("Products response:");
    console.log(JSON.stringify(products, null, 2));
  } catch (err) {
    console.error("Error:", err);
    process.exit(3);
  }
})();
