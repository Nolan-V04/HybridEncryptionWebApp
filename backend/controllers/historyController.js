const LogRecord = require("../models/LogRecord");
const FileRecord = require("../models/FileRecord");

/**
 * GET /api/history/logs
 * Get transfer history with pagination
 */
async function getHistoryHandler(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const action = req.query.action; // 'encrypt' or 'decrypt'
    const status = req.query.status; // 'success' or 'failure'
    
    const skip = (page - 1) * limit;
    const query = {};
    
    if (action) query.action = action;
    if (status) query.status = status;
    
    const total = await LogRecord.countDocuments(query);
    
    const logs = await LogRecord.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    return res.status(200).json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch history" });
  }
}

/**
 * GET /api/history/stats
 * Get transfer statistics
 */
async function getStatsHandler(req, res) {
  try {
    const period = req.query.period || "all"; // 'today', 'week', 'month', 'all'
    
    let dateFilter = {};
    const now = new Date();
    
    if (period === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { timestamp: { $gte: startOfDay } };
    } else if (period === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      dateFilter = { timestamp: { $gte: startOfWeek } };
    } else if (period === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { timestamp: { $gte: startOfMonth } };
    }
    
    // Count by action and status
    const encryptSuccess = await LogRecord.countDocuments({
      action: "encrypt",
      status: "success",
      ...dateFilter,
    });
    
    const encryptFailure = await LogRecord.countDocuments({
      action: "encrypt",
      status: "failure",
      ...dateFilter,
    });
    
    const decryptSuccess = await LogRecord.countDocuments({
      action: "decrypt",
      status: "success",
      ...dateFilter,
    });
    
    const decryptFailure = await LogRecord.countDocuments({
      action: "decrypt",
      status: "failure",
      ...dateFilter,
    });
    
    // Total bytes transferred
    const bytesTransferred = await LogRecord.aggregate([
      { $match: { status: "success", ...dateFilter } },
      { $group: { _id: null, totalBytes: { $sum: "$fileSize" } } },
    ]);
    
    // Average processing time
    const avgTime = await LogRecord.aggregate([
      { $match: { status: "success", ...dateFilter } },
      { $group: { _id: null, avgDuration: { $avg: "$duration" } } },
    ]);
    
    return res.status(200).json({
      period,
      counts: {
        encryptSuccess,
        encryptFailure,
        decryptSuccess,
        decryptFailure,
      },
      totals: {
        bytes: bytesTransferred[0]?.totalBytes || 0,
        avgDurationMs: Math.round(avgTime[0]?.avgDuration || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch statistics" });
  }
}

/**
 * DELETE /api/history/logs
 * Clear history (with optional filters)
 */
async function clearHistoryHandler(req, res) {
  try {
    const { olderThanDays } = req.body || {};
    
    let query = {};
    if (olderThanDays && olderThanDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      query = { timestamp: { $lt: cutoffDate } };
    }
    
    const result = await LogRecord.deleteMany(query);
    
    return res.status(200).json({
      message: "History cleared",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to clear history" });
  }
}

/**
 * GET /api/history/top-files
 * Get top transferred files
 */
async function getTopFilesHandler(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topFiles = await FileRecord.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
    
    return res.status(200).json({ files: topFiles });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch top files" });
  }
}

module.exports = {
  getHistoryHandler,
  getStatsHandler,
  clearHistoryHandler,
  getTopFilesHandler,
};
