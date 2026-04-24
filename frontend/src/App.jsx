import { useState, useEffect } from "react";
import DecryptPage from "./pages/DecryptPage";
import EncryptPage from "./pages/EncryptPage";
import KeyManagerPage from "./pages/KeyManagerPage";
import HistoryPage from "./pages/HistoryPage";
import Toast, { useToast } from "./components/Toast";
import { initializeTheme, isDarkMode, setDarkMode } from "./utils/storage";
import "./App.css";

function App() {
  const [mode, setMode] = useState("encrypt");
  const [darkMode, setDarkModeSt] = useState(false);
  const { toasts, showToast } = useToast();

  useEffect(() => {
    initializeTheme();
    setDarkModeSt(isDarkMode());
  }, []);

  function toggleDarkMode() {
    const newDark = !darkMode;
    setDarkMode(newDark);
    setDarkModeSt(newDark);
    showToast(newDark ? "Dark mode enabled" : "Light mode enabled", "info");
  }

  function handleRemoveToast(id) {
    // This will be handled by the Toast component
  }

  return (
    <main className="app-shell">
      <div className="bg-orb orb-a" aria-hidden="true" />
      <div className="bg-orb orb-b" aria-hidden="true" />

      <header className="topbar">
        <div className="header-top">
          <div>
            <p className="kicker">Hybrid Encryption File Transfer</p>
            <h1>Secure exchange with RSA + AES-GCM</h1>
            <p className="subtitle">
              Sender encrypts with one-time AES session key. Receiver decrypts with matching RSA private key.
            </p>
          </div>
          <button
            type="button"
            className="btn-dark-toggle"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="Workflow mode">
        <button
          type="button"
          className={mode === "encrypt" ? "tab active" : "tab"}
          onClick={() => setMode("encrypt")}
        >
          🔒 Encrypt
        </button>
        <button
          type="button"
          className={mode === "decrypt" ? "tab active" : "tab"}
          onClick={() => setMode("decrypt")}
        >
          🔓 Decrypt
        </button>
        <button
          type="button"
          className={mode === "keymanager" ? "tab active" : "tab"}
          onClick={() => setMode("keymanager")}
        >
          🔐 Key Manager
        </button>
        <button
          type="button"
          className={mode === "history" ? "tab active" : "tab"}
          onClick={() => setMode("history")}
        >
          📊 History
        </button>
      </nav>

      <div className="page-wrap">
        {mode === "encrypt" && <EncryptPage />}
        {mode === "decrypt" && <DecryptPage />}
        {mode === "keymanager" && <KeyManagerPage />}
        {mode === "history" && <HistoryPage />}
      </div>

      <Toast toasts={toasts} onRemove={handleRemoveToast} />
    </main>
  );
}

export default App;
