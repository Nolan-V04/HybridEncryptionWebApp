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
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
    versionKey: false,
  }
);

module.exports = mongoose.model("LogRecord", logRecordSchema);
