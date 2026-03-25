const express = require("express");
const multer = require("multer");
const {
  decryptHandler,
  encryptHandler,
  generateKeysHandler,
} = require("../controllers/cryptoController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.post("/keys/generate", generateKeysHandler);
router.post("/encrypt", upload.single("file"), encryptHandler);
router.post("/decrypt", upload.single("file"), decryptHandler);

module.exports = router;
