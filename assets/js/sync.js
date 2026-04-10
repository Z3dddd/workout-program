import { SUPABASE_CONFIG, hasSupabaseConfig } from "./supabase-config.js";

const SYNC_PIN_SESSION_KEY = "sync_pin_session";
const SYNC_PIN_DEVICE_KEY = "sync_pin_device";
const SYNC_LAST_PULL_KEY = "sync_last_pull_at";
const SYNC_OUTBOX_KEY = "sync_outbox_v1";

let flushTimer = null;
let statusHandler = null;
let isFlushing = false;
let autoRetryStarted = false;

function setSyncStatus(status, message = "") {
  if (typeof statusHandler === "function") {
    statusHandler({ status, message });
  }
}

function setSyncStatusHandler(handler) {
  statusHandler = handler;
}

function isSyncEnabled() {
  return hasSupabaseConfig();
}

function getFunctionUrl() {
  const trimmed = SUPABASE_CONFIG.url.replace(/\/+$/, "");
  return `${trimmed}/functions/v1/${SUPABASE_CONFIG.functionName}`;
}

function getEntryId(entry) {
  return `w${entry.week}_d${entry.day}_e${entry.exercise}_s${entry.set}`;
}

function readOutbox() {
  try {
    const raw = localStorage.getItem(SYNC_OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOutbox(entries) {
  localStorage.setItem(SYNC_OUTBOX_KEY, JSON.stringify(entries));
}

function updateOutboxStatusMessage(prefix = "Pending") {
  const count = readOutbox().length;
  if (count > 0) {
    setSyncStatus("pending", `${prefix} ${count} change${count === 1 ? "" : "s"}`);
  }
}

function getOutboxSize() {
  return readOutbox().length;
}

function getPendingEntries() {
  return readOutbox();
}

function savePin(pin, rememberOnDevice) {
  sessionStorage.setItem(SYNC_PIN_SESSION_KEY, pin);
  if (rememberOnDevice) {
    localStorage.setItem(SYNC_PIN_DEVICE_KEY, pin);
  } else {
    localStorage.removeItem(SYNC_PIN_DEVICE_KEY);
  }
}

function clearSavedPin() {
  sessionStorage.removeItem(SYNC_PIN_SESSION_KEY);
  localStorage.removeItem(SYNC_PIN_DEVICE_KEY);
}

function getSavedPin() {
  return sessionStorage.getItem(SYNC_PIN_SESSION_KEY) || localStorage.getItem(SYNC_PIN_DEVICE_KEY) || "";
}

async function callSyncFunction(payload, pin) {
  const response = await fetch(getFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_CONFIG.anonKey,
      Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      "x-sync-pin": pin
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error || "Sync request failed");
  }

  return json;
}

async function pullRemote(pin) {
  if (!isSyncEnabled()) return [];
  setSyncStatus("syncing", "Pulling latest data...");
  const result = await callSyncFunction({ action: "pull" }, pin);
  localStorage.setItem(SYNC_LAST_PULL_KEY, new Date().toISOString());
  if (getOutboxSize() > 0) {
    updateOutboxStatusMessage("Pending");
  } else {
    setSyncStatus("synced", "Latest data pulled");
  }
  return Array.isArray(result.entries) ? result.entries : [];
}

function enqueueEntryChange(entry) {
  if (!isSyncEnabled()) return;
  const normalized = {
    ...entry,
    updatedAt: entry.updatedAt ?? new Date().toISOString()
  };

  const outbox = readOutbox();
  const existingIndex = outbox.findIndex((item) =>
    item.week === entry.week
    && item.day === entry.day
    && item.exercise === entry.exercise
    && item.set === entry.set
  );

  if (existingIndex >= 0) {
    outbox[existingIndex] = normalized;
  } else {
    outbox.push(normalized);
  }

  writeOutbox(outbox);
  updateOutboxStatusMessage("Pending");
}

async function flushPending(pin) {
  if (!isSyncEnabled()) return;
  if (!pin) {
    updateOutboxStatusMessage("PIN required. Pending");
    return;
  }
  if (isFlushing) return;

  const outbox = readOutbox();
  if (!outbox.length) {
    setSyncStatus("synced", "All changes synced");
    return;
  }

  isFlushing = true;
  const batch = [...outbox];
  const batchVersion = new Map(batch.map((entry) => [getEntryId(entry), entry.updatedAt]));
  setSyncStatus("syncing", "Syncing changes...");
  try {
    await callSyncFunction({ action: "push", entries: batch }, pin);
    const currentOutbox = readOutbox();
    const remaining = currentOutbox.filter((entry) => {
      const id = getEntryId(entry);
      return batchVersion.get(id) !== entry.updatedAt;
    });
    writeOutbox(remaining);
    if (remaining.length > 0) {
      updateOutboxStatusMessage("Pending");
    } else {
      setSyncStatus("synced", "All changes synced");
    }
  } catch (error) {
    setSyncStatus("error", `${error.message} (kept locally, retrying)`);
    throw error;
  } finally {
    isFlushing = false;
  }
}

function scheduleFlush(pin) {
  if (!isSyncEnabled()) return;
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  flushTimer = setTimeout(() => {
    flushPending(pin).catch(() => {});
  }, 900);
}

function initAutoRetry(pinProvider) {
  if (!isSyncEnabled() || autoRetryStarted) return;
  autoRetryStarted = true;

  const retry = () => {
    const pin = typeof pinProvider === "function" ? pinProvider() : "";
    if (!pin) return;
    flushPending(pin).catch(() => {});
  };

  window.addEventListener("online", retry);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) retry();
  });
  setInterval(retry, 20000);
}

function getLastPullAt() {
  return localStorage.getItem(SYNC_LAST_PULL_KEY) || "";
}

export {
  clearSavedPin,
  enqueueEntryChange,
  flushPending,
  getLastPullAt,
  getOutboxSize,
  getPendingEntries,
  getSavedPin,
  initAutoRetry,
  isSyncEnabled,
  pullRemote,
  savePin,
  scheduleFlush,
  setSyncStatus,
  setSyncStatusHandler
};
