const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../app");

const app = createApp();

function parseHybridPayload(buffer) {
  return JSON.parse(buffer.toString("utf8"));
}

test("GET /api/health returns service status", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.ok(response.body.timestamp);
});

test("POST /api/keys/generate returns PEM key pair", async () => {
  const response = await request(app).post("/api/keys/generate");

  assert.equal(response.status, 200);
  assert.match(response.body.public_key, /BEGIN PUBLIC KEY/);
  assert.match(response.body.private_key, /BEGIN PRIVATE KEY/);
});

test("POST /api/encrypt fails when file is missing", async () => {
  const keys = await request(app).post("/api/keys/generate");

  const response = await request(app)
    .post("/api/encrypt")
    .field("publicKey", keys.body.public_key);

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "File is required");
});

test("POST /api/decrypt fails on invalid hybrid payload", async () => {
  const keys = await request(app).post("/api/keys/generate");

  const response = await request(app)
    .post("/api/decrypt")
    .field("privateKey", keys.body.private_key)
    .attach("file", Buffer.from("not-json-payload"), "bad.hybrid");

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Invalid .hybrid payload format");
});

test("full flow: encrypt then decrypt returns original content", async () => {
  const keysResponse = await request(app).post("/api/keys/generate");
  const sourceContent = Buffer.from("Functional test: hybrid encryption flow", "utf8");

  const encryptResponse = await request(app)
    .post("/api/encrypt")
    .field("publicKey", keysResponse.body.public_key)
    .attach("file", sourceContent, "sample.txt");

  assert.equal(encryptResponse.status, 200);
  const payload = parseHybridPayload(encryptResponse.body);
  assert.ok(payload.encrypted_key);
  assert.ok(payload.iv);
  assert.ok(payload.ciphertext);
  assert.ok(payload.tag);

  const decryptResponse = await request(app)
    .post("/api/decrypt")
    .field("privateKey", keysResponse.body.private_key)
    .attach("file", Buffer.from(JSON.stringify(payload), "utf8"), "sample.txt.hybrid");

  assert.equal(decryptResponse.status, 200);
  assert.equal(decryptResponse.text, sourceContent.toString("utf8"));
});

test("POST /api/decrypt fails when private key is missing", async () => {
  const payload = {
    encrypted_key: "ZmFrZQ==",
    iv: "ZmFrZQ==",
    ciphertext: "ZmFrZQ==",
    tag: "ZmFrZQ==",
  };

  const response = await request(app)
    .post("/api/decrypt")
    .attach("file", Buffer.from(JSON.stringify(payload), "utf8"), "sample.hybrid");

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Valid RSA private key is required");
});
