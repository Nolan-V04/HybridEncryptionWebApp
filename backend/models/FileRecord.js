const mongoose = require("mongoose");

const fileRecordSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    size: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

module.exports = mongoose.model("FileRecord", fileRecordSchema);
