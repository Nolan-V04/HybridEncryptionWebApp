import { useState } from "react";
import DecryptPage from "./pages/DecryptPage";
import EncryptPage from "./pages/EncryptPage";
import "./App.css";

function App() {
  const [mode, setMode] = useState("encrypt");

  return (
    <main className="app-shell">
      <div className="bg-orb orb-a" aria-hidden="true" />
      <div className="bg-orb orb-b" aria-hidden="true" />

      <header className="topbar">
        <p className="kicker">Hybrid Encryption File Transfer</p>
        <h1>Secure exchange with RSA + AES-GCM</h1>
        <p className="subtitle">
          Sender encrypts with one-time AES session key. Receiver decrypts with matching RSA private key.
        </p>
      </header>

      <nav className="tabs" aria-label="Workflow mode">
        <button
          type="button"
          className={mode === "encrypt" ? "tab active" : "tab"}
          onClick={() => setMode("encrypt")}
        >
          Encrypt
        </button>
        <button
          type="button"
          className={mode === "decrypt" ? "tab active" : "tab"}
          onClick={() => setMode("decrypt")}
        >
          Decrypt
        </button>
      </nav>

      <div className="page-wrap">{mode === "encrypt" ? <EncryptPage /> : <DecryptPage />}</div>
    </main>
  );
}

export default App;
