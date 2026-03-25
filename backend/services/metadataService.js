const mongoose = require("mongoose");
const FileRecord = require("../models/FileRecord");
const LogRecord = require("../models/LogRecord");

const isConnected = () => mongoose.connection.readyState === 1;

async function saveFileMetadata({ filename, size }) {
  if (!isConnected()) {
    return null;
  }

  return FileRecord.create({ filename, size });
}

async function saveLog({ action, status, message = "" }) {
  if (!isConnected()) {
    return null;
  }

  return LogRecord.create({ action, status, message });
}

module.exports = { saveFileMetadata, saveLog };
