const crypto = require("crypto");
const StoredKey = require("../models/StoredKey");

/**
 * Generate SHA256 fingerprint of a public key
 */
function generateKeyFingerprint(publicKey) {
  return crypto
    .createHash("sha256")
    .update(publicKey)
    .digest("hex");
}

/**
 * Encrypt private key with a password
 */
function encryptPrivateKey(privateKey, password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);
  
  // Return salt:iv:encrypted in base64
  return `${salt.toString("base64")}:${iv.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypt private key with a password
 */
function decryptPrivateKey(encryptedData, password) {
  const [saltB64, ivB64, encryptedB64] = encryptedData.split(":");
  const salt = Buffer.from(saltB64, "base64");
  const iv = Buffer.from(ivB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  
  return decipher.update(encrypted) + decipher.final("utf8");
}

/**
 * Save a new key pair
 */
async function saveKeyPair(publicKey, privateKey, keyName, description = "", tags = [], password = null) {
  const fingerprint = generateKeyFingerprint(publicKey);
  
  // Check if key already exists
  const existing = await StoredKey.findOne({ fingerprint });
  if (existing) {
    throw new Error("This public key already exists in storage");
  }
  
  const keyData = {
    keyName,
    publicKey,
    fingerprint,
    description,
    tags: tags || [],
    isActive: true,
  };
  
  if (privateKey && password) {
    keyData.privateKeyEncrypted = encryptPrivateKey(privateKey, password);
  }
  
  const storedKey = new StoredKey(keyData);
  await storedKey.save();
  
  return {
    _id: storedKey._id,
    keyName: storedKey.keyName,
    fingerprint: storedKey.fingerprint,
    created_at: storedKey.created_at,
  };
}

/**
 * Get a stored key by ID
 */
async function getKey(keyId) {
  return StoredKey.findById(keyId);
}

/**
 * List all stored keys with pagination
 */
async function listKeys(page = 1, limit = 20, filterActive = true) {
  const skip = (page - 1) * limit;
  
  const query = filterActive ? { isActive: true } : {};
  const total = await StoredKey.countDocuments(query);
  
  const keys = await StoredKey.find(query)
    .select("-privateKeyEncrypted")
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);
  
  return {
    keys: keys.map(k => ({
      _id: k._id,
      keyName: k.keyName,
      fingerprint: k.fingerprint,
      description: k.description,
      tags: k.tags,
      created_at: k.created_at,
      isActive: k.isActive,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Delete a stored key
 */
async function deleteKey(keyId) {
  const result = await StoredKey.findByIdAndDelete(keyId);
  return result ? true : false;
}

/**
 * Soft delete (mark as inactive)
 */
async function deactivateKey(keyId) {
  await StoredKey.findByIdAndUpdate(keyId, { isActive: false });
}

/**
 * Get public key by fingerprint
 */
async function getKeyByFingerprint(fingerprint) {
  return StoredKey.findOne({ fingerprint });
}

/**
 * Get encrypted private key and verify password
 */
async function getPrivateKeyIfPasswordCorrect(keyId, password) {
  const key = await StoredKey.findById(keyId);
  if (!key || !key.privateKeyEncrypted) {
    throw new Error("Key not found or private key not stored");
  }
  
  try {
    const decrypted = decryptPrivateKey(key.privateKeyEncrypted, password);
    return decrypted;
  } catch (error) {
    throw new Error("Incorrect password or corrupted key data");
  }
}

/**
 * Update key metadata
 */
async function updateKeyMetadata(keyId, updates) {
  const allowed = ["keyName", "description", "tags"];
  const filtered = {};
  
  for (const key of allowed) {
    if (key in updates) {
      filtered[key] = updates[key];
    }
  }
  
  return StoredKey.findByIdAndUpdate(keyId, filtered, { new: true });
}

module.exports = {
  generateKeyFingerprint,
  encryptPrivateKey,
  decryptPrivateKey,
  saveKeyPair,
  getKey,
  listKeys,
  deleteKey,
  deactivateKey,
  getKeyByFingerprint,
  getPrivateKeyIfPasswordCorrect,
  updateKeyMetadata,
};
