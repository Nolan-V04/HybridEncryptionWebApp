/**
 * Local storage utility for managing keys on frontend
 * This provides quick access to recently used keys
 */

const LOCAL_STORAGE_KEY = "hybridEncryption_keys";

export function getStoredKeys() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to parse stored keys", error);
    return [];
  }
}

export function addStoredKey(publicKey, keyName = "Unnamed Key") {
  try {
    const keys = getStoredKeys();
    const newKey = {
      id: Date.now().toString(),
      keyName,
      publicKey,
      addedAt: new Date().toISOString(),
    };
    keys.unshift(newKey); // Add to front
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(keys.slice(0, 20))); // Keep last 20
    return newKey;
  } catch (error) {
    console.error("Failed to save key", error);
    return null;
  }
}

export function removeStoredKey(keyId) {
  try {
    const keys = getStoredKeys();
    const filtered = keys.filter(k => k.id !== keyId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to remove key", error);
    return false;
  }
}

export function clearStoredKeys() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Failed to clear keys", error);
    return false;
  }
}

// Dark mode management
const DARK_MODE_KEY = "hybridEncryption_darkMode";

export function isDarkMode() {
  try {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (error) {
    return false;
  }
}

export function setDarkMode(isDark) {
  try {
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDark));
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    return true;
  } catch (error) {
    console.error("Failed to set dark mode", error);
    return false;
  }
}

// Initialize theme on load
export function initializeTheme() {
  const dark = isDarkMode();
  if (dark) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}
