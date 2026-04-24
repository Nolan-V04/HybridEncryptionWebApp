const crypto = require("crypto");
const { decryptFile, encryptFile, generateKeyPair } = require("../services/cryptoService");
const { sanitizeFilename } = require("../utils/filename");
const { saveFileMetadata, saveLog } = require("../services/metadataService");
const { generateKeyFingerprint } = require("../services/keyManagementService");

const MAX_KEY_LENGTH = 16000;
const MAX_PAYLOAD_SIZE = 100 * 1024 * 1024;

function parseTextField(input) {
  if (!input) {
    return "";
  }

  return Buffer.isBuffer(input) ? input.toString("utf8") : String(input);
}

function setDownloadHeaders(res, filename, contentType) {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
}

async function generateKeysHandler(req, res) {
  try {
    const keys = generateKeyPair();
    await saveLog({ action: "encrypt", status: "success", message: "Generated RSA key pair" });

    return res.status(200).json({
      public_key: keys.publicKey,
      private_key: keys.privateKey,
      public_filename: "public_key.pem",
      private_filename: "private_key.pem",
    });
  } catch (error) {
    await saveLog({ action: "encrypt", status: "failure", message: "Failed to generate key pair" });
    return res.status(500).json({ message: "Failed to generate RSA key pair" });
  }
}

async function encryptHandler(req, res) {
  const sourceName = sanitizeFilename(req.file?.originalname, "encrypted_file");
  const startTime = Date.now();

  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "File is required" });
    }

    const publicKey = parseTextField(req.body?.publicKey);
    if (!publicKey || publicKey.length > MAX_KEY_LENGTH) {
      return res.status(400).json({ message: "Valid RSA public key is required" });
    }

    const keyFingerprint = generateKeyFingerprint(publicKey);

    const payload = encryptFile(req.file.buffer, publicKey, {
      originalName: sourceName,
      mimeType: req.file.mimetype || "application/octet-stream",
    });

    const hybridFilename = `${sourceName}.hybrid`;
    const payloadBuffer = Buffer.from(JSON.stringify(payload), "utf8");
    const duration = Date.now() - startTime;

    await saveFileMetadata({ filename: sourceName, size: req.file.size });
    await saveLog({
      action: "encrypt",
      status: "success",
      message: `Encrypted ${sourceName}`,
      filename: sourceName,
      fileSize: req.file.size,
      keyFingerprint,
      duration,
    });

    setDownloadHeaders(res, hybridFilename, "application/octet-stream");
    return res.status(200).send(payloadBuffer);
  } catch (error) {
    const duration = Date.now() - startTime;
    await saveLog({
      action: "encrypt",
      status: "failure",
      message: `Encryption failed for ${sourceName}`,
      filename: sourceName,
      duration,
      errorDetails: error.message,
    });
    return res.status(400).json({ message: "Encryption failed. Check key and file data." });
  }
}

async function decryptHandler(req, res) {
  const hybridName = sanitizeFilename(req.file?.originalname, "encrypted_payload.hybrid");
  const startTime = Date.now();

  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "Hybrid payload file is required" });
    }

    if (req.file.size > MAX_PAYLOAD_SIZE) {
      return res.status(400).json({ message: "Payload file is too large" });
    }

    const privateKey = parseTextField(req.body?.privateKey);
    if (!privateKey || privateKey.length > MAX_KEY_LENGTH) {
      return res.status(400).json({ message: "Valid RSA private key is required" });
    }

    let payload;
    try {
      payload = JSON.parse(req.file.buffer.toString("utf8"));
    } catch (error) {
      return res.status(400).json({ message: "Invalid .hybrid payload format" });
    }

    const { fileBuffer, fileName, mimeType } = decryptFile(payload, privateKey);
    const outputName = sanitizeFilename(fileName, hybridName.replace(/\.hybrid$/i, "") || "decrypted_file");
    const duration = Date.now() - startTime;

    await saveFileMetadata({ filename: outputName, size: fileBuffer.length });
    await saveLog({
      action: "decrypt",
      status: "success",
      message: `Decrypted ${outputName}`,
      filename: outputName,
      fileSize: fileBuffer.length,
      duration,
    });

    setDownloadHeaders(res, outputName, mimeType || "application/octet-stream");
    return res.status(200).send(fileBuffer);
  } catch (error) {
    const duration = Date.now() - startTime;
    await saveLog({
      action: "decrypt",
      status: "failure",
      message: `Decryption failed for ${hybridName}`,
      filename: hybridName,
      duration,
      errorDetails: error.message,
    });

    const isAuthError = error instanceof Error && /auth|integrity|decrypt/i.test(error.message);
    const message = isAuthError
      ? "Decryption failed. Payload integrity check failed or wrong private key."
      : "Decryption failed. Invalid payload or private key.";

    return res.status(400).json({ message });
  }
}

module.exports = {
  generateKeysHandler,
  encryptHandler,
  decryptHandler,
};
