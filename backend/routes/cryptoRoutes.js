const express = require("express");
const multer = require("multer");
const {
  decryptHandler,
  encryptHandler,
  generateKeysHandler,
} = require("../controllers/cryptoController");
const {
  saveKeyPairHandler,
  listKeysHandler,
  getKeyHandler,
  deleteKeyHandler,
  deactivateKeyHandler,
  updateKeyHandler,
  getPrivateKeyHandler,
} = require("../controllers/keyManagementController");
const {
  getHistoryHandler,
  getStatsHandler,
  clearHistoryHandler,
  getTopFilesHandler,
} = require("../controllers/historyController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Crypto routes
router.post("/keys/generate", generateKeysHandler);
router.post("/encrypt", upload.single("file"), encryptHandler);
router.post("/decrypt", upload.single("file"), decryptHandler);

// Key Management routes
router.post("/keymanager/save", saveKeyPairHandler);
router.get("/keymanager/keys", listKeysHandler);
router.get("/keymanager/keys/:keyId", getKeyHandler);
router.patch("/keymanager/keys/:keyId", updateKeyHandler);
router.delete("/keymanager/keys/:keyId", deleteKeyHandler);
router.patch("/keymanager/keys/:keyId/deactivate", deactivateKeyHandler);
router.post("/keymanager/keys/:keyId/private", getPrivateKeyHandler);

// History & Stats routes
router.get("/history/logs", getHistoryHandler);
router.get("/history/stats", getStatsHandler);
router.get("/history/top-files", getTopFilesHandler);
router.delete("/history/logs", clearHistoryHandler);

module.exports = router;
