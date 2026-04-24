import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function HistoryPage() {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [filterAction, filterStatus, period, page]);

  async function loadData() {
    setLoading(true);
    try {
      // Load history logs
      const logsParams = new URLSearchParams();
      logsParams.append("page", page);
      logsParams.append("limit", 20);
      if (filterAction) logsParams.append("action", filterAction);
      if (filterStatus) logsParams.append("status", filterStatus);

      const [logsResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE}/history/logs?${logsParams}`),
        fetch(`${API_BASE}/history/stats?period=${period}`),
      ]);

      const logsData = await logsResponse.json();
      const statsData = await statsResponse.json();

      setHistoryLogs(logsData.logs || []);
      setTotalPages(logsData.pagination?.pages || 1);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function formatDuration(ms) {
    if (ms < 1000) return Math.round(ms) + " ms";
    return (ms / 1000).toFixed(2) + " s";
  }

  async function handleClearHistory() {
    if (!confirm("Clear all history? This cannot be undone.")) return;

    try {
      const response = await fetch(`${API_BASE}/history/logs`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        alert("History cleared");
        setPage(1);
        loadData();
      }
    } catch (error) {
      alert("Failed to clear history");
    }
  }

  return (
    <section className="panel-grid">
      {/* Statistics */}
      {stats && (
        <div className="card">
          <h2>📊 Statistics</h2>
          <div className="stats-period">
            <select value={period} onChange={e => setPeriod(e.target.value)} className="select-input">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">✅ Successful Encryptions</span>
              <span className="stat-value">{stats.counts?.encryptSuccess || 0}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">❌ Failed Encryptions</span>
              <span className="stat-value">{stats.counts?.encryptFailure || 0}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">✅ Successful Decryptions</span>
              <span className="stat-value">{stats.counts?.decryptSuccess || 0}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">❌ Failed Decryptions</span>
              <span className="stat-value">{stats.counts?.decryptFailure || 0}</span>
            </div>
            <div className="stat-box highlight">
              <span className="stat-label">📦 Data Transferred</span>
              <span className="stat-value">{formatBytes(stats.totals?.bytes || 0)}</span>
            </div>
            <div className="stat-box highlight">
              <span className="stat-label">⚡ Avg Processing Time</span>
              <span className="stat-value">{formatDuration(stats.totals?.avgDurationMs || 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* History Logs */}
      <div className="card">
        <h2>📋 Transfer History</h2>

        <div className="filter-section">
          <div className="filter-group">
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="select-input"
            >
              <option value="">All Actions</option>
              <option value="encrypt">Encrypt Only</option>
              <option value="decrypt">Decrypt Only</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="select-input"
            >
              <option value="">All Status</option>
              <option value="success">Success Only</option>
              <option value="failure">Failures Only</option>
            </select>
          </div>

          <button type="button" onClick={handleClearHistory} className="btn-danger btn-small">
            Clear History
          </button>
        </div>

        {loading && <p>Loading...</p>}

        {historyLogs.length === 0 && !loading && <p>No transfer history yet.</p>}

        <div className="history-table">
          {historyLogs.map((log, idx) => (
            <div key={log._id || idx} className={`history-row status-${log.status}`}>
              <div className="history-cell">
                <strong>{log.action === "encrypt" ? "🔒" : "🔓"} {log.action.toUpperCase()}</strong>
              </div>
              <div className="history-cell">
                <span className={`status-badge status-${log.status}`}>{log.status.toUpperCase()}</span>
              </div>
              <div className="history-cell">
                <span>{log.filename || "N/A"}</span>
              </div>
              <div className="history-cell">
                <span>{log.fileSize ? formatBytes(log.fileSize) : "-"}</span>
              </div>
              <div className="history-cell">
                <span>{log.duration ? formatDuration(log.duration) : "-"}</span>
              </div>
              <div className="history-cell">
                <small>{new Date(log.timestamp).toLocaleString()}</small>
              </div>
              {log.message && (
                <div className="history-cell full-width">
                  <span className="message">{log.message}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary btn-small"
            >
              ← Previous
            </button>
            <span className="page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn-secondary btn-small"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default HistoryPage;
