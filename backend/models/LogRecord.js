const mongoose = require("mongoose");

const logRecordSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["encrypt", "decrypt"],
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    filename: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    keyFingerprint: {
      type: String,
      default: "",
      // SHA256 hash of public key used
    },
    duration: {
      type: Number,
      default: 0,
      // Processing time in MS
    },
    errorDetails: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
    versionKey: false,
  }
);

module.exports = mongoose.model("LogRecord", logRecordSchema);
