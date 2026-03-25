import { useState } from "react";
import FileDropZone from "../components/FileDropZone";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function EncryptPage() {
  const [file, setFile] = useState(null);
  const [publicKey, setPublicKey] = useState("");
  const [status, setStatus] = useState("Idle");
  const [busy, setBusy] = useState(false);

  async function generateKeys() {
    setBusy(true);
    setStatus("Generating RSA key pair...");

    try {
      const response = await fetch(`${API_BASE}/keys/generate`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate key pair");
      }

      setPublicKey(data.public_key || "");
      downloadText(data.public_filename || "public_key.pem", data.public_key || "");
      downloadText(data.private_filename || "private_key.pem", data.private_key || "");
      setStatus("Keys generated and downloaded.");
    } catch (error) {
      setStatus(error.message || "Failed to generate keys");
    } finally {
      setBusy(false);
    }
  }

  async function encryptNow() {
    if (!file) {
      setStatus("Please select a source file.");
      return;
    }

    if (!publicKey.trim()) {
      setStatus("Please provide a receiver public key.");
      return;
    }

    setBusy(true);
    setStatus("Encrypting file with AES-256-GCM and RSA-OAEP...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("publicKey", publicKey);

      const response = await fetch(`${API_BASE}/encrypt`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Encryption failed" }));
        throw new Error(body.message || "Encryption failed");
      }

      const blob = await response.blob();
      const suggestedName = `${file.name}.hybrid`;
      downloadBlob(suggestedName, blob);
      setStatus("Encryption successful. Hybrid payload downloaded.");
    } catch (error) {
      setStatus(error.message || "Encryption failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel-grid">
      <div className="card">
        <h2>Sender flow</h2>
        <p>Encrypt any file with receiver public key and export a .hybrid payload.</p>
        <FileDropZone
          id="encrypt-source"
          label="Upload file to encrypt"
          accept="*/*"
          file={file}
          onFileSelect={setFile}
        />
      </div>

      <div className="card">
        <h2>Public key</h2>
        <p>Paste receiver RSA public key or generate a fresh key pair for testing.</p>
        <textarea
          value={publicKey}
          onChange={(event) => setPublicKey(event.target.value)}
          placeholder="-----BEGIN PUBLIC KEY-----"
          rows={10}
        />
        <div className="actions">
          <button type="button" onClick={generateKeys} disabled={busy}>
            Generate Keys
          </button>
          <button type="button" className="primary" onClick={encryptNow} disabled={busy}>
            Encrypt
          </button>
        </div>
      </div>

      <p className="status">{status}</p>
    </section>
  );
}

export default EncryptPage;
