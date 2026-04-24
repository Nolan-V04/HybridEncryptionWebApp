const {
  saveKeyPair,
  getKey,
  listKeys,
  deleteKey,
  deactivateKey,
  getPrivateKeyIfPasswordCorrect,
  updateKeyMetadata,
  generateKeyFingerprint,
} = require("../services/keyManagementService");
const { saveLog } = require("../services/metadataService");

/**
 * POST /api/keymanager/save
 * Save a new key pair
 */
async function saveKeyPairHandler(req, res) {
  try {
    const { publicKey, privateKey, keyName, description, tags, password } = req.body;
    
    if (!publicKey || !keyName) {
      return res.status(400).json({ message: "publicKey and keyName are required" });
    }
    
    if (privateKey && !password) {
      return res.status(400).json({ message: "password is required when storing private key" });
    }
    
    const saved = await saveKeyPair(publicKey, privateKey || null, keyName, description || "", tags || [], password || null);
    
    await saveLog({
      action: "encrypt",
      status: "success",
      message: `Saved key pair: ${keyName}`,
    });
    
    return res.status(201).json({
      message: "Key pair saved successfully",
      key: saved,
    });
  } catch (error) {
    const message = error.message || "Failed to save key pair";
    await saveLog({
      action: "encrypt",
      status: "failure",
      message: `Key save failed: ${message}`,
      errorDetails: message,
    });
    
    return res.status(400).json({ message });
  }
}

/**
 * GET /api/keymanager/keys
 * List all stored keys
 */
async function listKeysHandler(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filterActive = req.query.inactive === "true" ? false : true;
    
    const result = await listKeys(page, limit, filterActive);
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to list keys" });
  }
}

/**
 * GET /api/keymanager/keys/:keyId
 * Get a specific key by ID
 */
async function getKeyHandler(req, res) {
  try {
    const { keyId } = req.params;
    const key = await getKey(keyId);
    
    if (!key) {
      return res.status(404).json({ message: "Key not found" });
    }
    
    // Don't return encrypted private key
    const response = {
      _id: key._id,
      keyName: key.keyName,
      keyType: key.keyType,
      publicKey: key.publicKey,
      fingerprint: key.fingerprint,
      description: key.description,
      tags: key.tags,
      isActive: key.isActive,
      created_at: key.created_at,
      hasPrivateKey: !!key.privateKeyEncrypted,
    };
    
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get key" });
  }
}

/**
 * DELETE /api/keymanager/keys/:keyId
 * Delete a stored key
 */
async function deleteKeyHandler(req, res) {
  try {
    const { keyId } = req.params;
    const deleted = await deleteKey(keyId);
    
    if (!deleted) {
      return res.status(404).json({ message: "Key not found" });
    }
    
    await saveLog({
      action: "encrypt",
      status: "success",
      message: `Deleted stored key`,
    });
    
    return res.status(200).json({ message: "Key deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete key" });
  }
}

/**
 * PATCH /api/keymanager/keys/:keyId/deactivate
 * Soft delete - mark key as inactive
 */
async function deactivateKeyHandler(req, res) {
  try {
    const { keyId } = req.params;
    await deactivateKey(keyId);
    
    return res.status(200).json({ message: "Key deactivated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to deactivate key" });
  }
}

/**
 * PATCH /api/keymanager/keys/:keyId
 * Update key metadata
 */
async function updateKeyHandler(req, res) {
  try {
    const { keyId } = req.params;
    const { keyName, description, tags } = req.body;
    
    const updated = await updateKeyMetadata(keyId, { keyName, description, tags });
    
    if (!updated) {
      return res.status(404).json({ message: "Key not found" });
    }
    
    return res.status(200).json({
      message: "Key updated successfully",
      key: {
        _id: updated._id,
        keyName: updated.keyName,
        description: updated.description,
        tags: updated.tags,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update key" });
  }
}

/**
 * POST /api/keymanager/keys/:keyId/private
 * Retrieve encrypted private key (requires password)
 */
async function getPrivateKeyHandler(req, res) {
  try {
    const { keyId } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: "password is required" });
    }
    
    const privateKey = await getPrivateKeyIfPasswordCorrect(keyId, password);
    
    // Download as file
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="private_key.pem"`);
    res.send(privateKey);
  } catch (error) {
    const message = error.message || "Failed to retrieve private key";
    return res.status(400).json({ message });
  }
}

module.exports = {
  saveKeyPairHandler,
  listKeysHandler,
  getKeyHandler,
  deleteKeyHandler,
  deactivateKeyHandler,
  updateKeyHandler,
  getPrivateKeyHandler,
};
