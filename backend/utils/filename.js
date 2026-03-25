function sanitizeFilename(value, fallback) {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\s+/g, " ").trim() || fallback;
}

module.exports = { sanitizeFilename };
