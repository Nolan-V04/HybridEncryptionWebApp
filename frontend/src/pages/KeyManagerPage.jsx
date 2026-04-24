import { useState, useEffect } from "react";
import { getStoredKeys, addStoredKey, removeStoredKey } from "../utils/storage";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function KeyManager() {
  const [localKeys, setLocalKeys] = useState([]);
  const [serverKeys, setServerKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveForm, setSaveForm] = useState({
    keyName: "",
    publicKey: "",
    privateKey: "",
    password: "",
    description: "",
    storePrivate: false,
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/keymanager/keys?limit=50`);
      const data = await response.json();
      setServerKeys(data.keys || []);
      setLocalKeys(getStoredKeys());
    } catch (error) {
      setStatus("Failed to load keys");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveKey() {
    if (!saveForm.keyName.trim()) {
      setStatus("Key name is required");
      return;
    }

    if (!saveForm.publicKey.trim()) {
      setStatus("Public key is required");
      return;
    }

    if (saveForm.storePrivate && !saveForm.password.trim()) {
      setStatus("Password required to store private key");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/keymanager/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: saveForm.publicKey,
          privateKey: saveForm.storePrivate ? saveForm.privateKey : null,
          keyName: saveForm.keyName,
          description: saveForm.description,
          password: saveForm.storePrivate ? saveForm.password : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save key");
      }

      // Also save to local storage
      addStoredKey(saveForm.publicKey, saveForm.keyName);

      setStatus("Key saved successfully!");
      setSaveForm({
        keyName: "",
        publicKey: "",
        privateKey: "",
        password: "",
        description: "",
        storePrivate: false,
      });
      setShowSaveForm(false);

      // Reload keys
      setTimeout(() => loadKeys(), 500);
    } catch (error) {
      setStatus(error.message || "Failed to save key");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteKey(keyId) {
    if (!confirm("Delete this key?")) return;

    try {
      const response = await fetch(`${API_BASE}/keymanager/keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete key");
      }

      setStatus("Key deleted");
      loadKeys();
    } catch (error) {
      setStatus(error.message || "Failed to delete key");
    }
  }

  function handleRemoveLocalKey(keyId) {
    removeStoredKey(keyId);
    setLocalKeys(getStoredKeys());
    setStatus("Local key removed");
  }

  function truncateKey(key) {
    if (key.length > 50) {
      return key.substring(0, 47) + "...";
    }
    return key;
  }

  return (
    <section className="panel-grid">
      <div className="card">
        <h2>🔐 Key Manager</h2>
        <p>Store and manage your RSA key pairs securely.</p>

        {status && (
          <div className={`status-message ${status.toLowerCase().includes("success") ? "success" : "error"}`}>
            {status}
          </div>
        )}

        {showSaveForm ? (
          <div className="form-section">
            <h3>Save New Key</h3>
            <input
              type="text"
              placeholder="Key name (e.g., 'Work RSA Key')"
              value={saveForm.keyName}
              onChange={e => setSaveForm({ ...saveForm, keyName: e.target.value })}
              disabled={loading}
            />
            <textarea
              placeholder="Public Key (PEM format)"
              value={saveForm.publicKey}
              onChange={e => setSaveForm({ ...saveForm, publicKey: e.target.value })}
              rows={6}
              disabled={loading}
            />
            <textarea
              placeholder="Private Key (PEM format - optional)"
              value={saveForm.privateKey}
              onChange={e => setSaveForm({ ...saveForm, privateKey: e.target.value })}
              rows={6}
              disabled={loading}
            />
            <textarea
              placeholder="Description (optional)"
              value={saveForm.description}
              onChange={e => setSaveForm({ ...saveForm, description: e.target.value })}
              rows={2}
              disabled={loading}
            />

            {saveForm.privateKey && (
              <>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={saveForm.storePrivate}
                    onChange={e => setSaveForm({ ...saveForm, storePrivate: e.target.checked })}
                    disabled={loading}
                  />
                  Store private key (encrypted with password)
                </label>

                {saveForm.storePrivate && (
                  <input
                    type="password"
                    placeholder="Encryption password"
                    value={saveForm.password}
                    onChange={e => setSaveForm({ ...saveForm, password: e.target.value })}
                    disabled={loading}
                  />
                )}
              </>
            )}

            <div className="button-group">
              <button
                type="button"
                onClick={handleSaveKey}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "Saving..." : "Save Key"}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                disabled={loading}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSaveForm(true)}
            className="btn-primary"
            disabled={loading}
          >
            + Save New Key
          </button>
        )}
      </div>

      {/* Server Keys */}
      <div className="card">
        <h3>📚 Stored Keys (Server)</h3>
        {loading && <p>Loading...</p>}
        {serverKeys.length === 0 && !loading && <p>No keys saved yet.</p>}
        <div className="key-list">
          {serverKeys.map(key => (
            <div key={key._id} className="key-item">
              <div className="key-info">
                <strong>{key.keyName}</strong>
                <p className="key-fingerprint">Fingerprint: {key.fingerprint?.substring(0, 16)}...</p>
                {key.description && <p className="key-description">{key.description}</p>}
                <small>Saved: {new Date(key.created_at).toLocaleDateString()}</small>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteKey(key._id)}
                className="btn-danger btn-small"
                disabled={loading}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Local Session Keys */}
      <div className="card">
        <h3>💾 Recent Keys (Local)</h3>
        {localKeys.length === 0 ? (
          <p>No recent keys. Generate or paste a public key in the Encrypt tab.</p>
        ) : (
          <div className="key-list">
            {localKeys.map(key => (
              <div key={key.id} className="key-item">
                <div className="key-info">
                  <strong>{key.keyName}</strong>
                  <p className="key-fingerprint">Added: {new Date(key.addedAt).toLocaleString()}</p>
                  <code className="key-preview">{truncateKey(key.publicKey)}</code>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLocalKey(key.id)}
                  className="btn-secondary btn-small"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default KeyManager;
