const mongoose = require("mongoose");

const storedKeySchema = new mongoose.Schema(
  {
    keyName: {
      type: String,
      required: true,
      trim: true,
    },
    keyType: {
      type: String,
      enum: ["rsa-2048"],
      default: "rsa-2048",
    },
    publicKey: {
      type: String,
      required: true,
    },
    // Private key stored encrypted (optional - user can choose not to store)
    privateKeyEncrypted: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    tags: {
      type: [String],
      default: [],
    },
    fingerprint: {
      type: String,
      required: true,
      unique: true,
      // SHA256 hash of public key for identification
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

module.exports = mongoose.model("StoredKey", storedKeySchema);
