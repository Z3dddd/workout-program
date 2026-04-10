import { SUPABASE_CONFIG, hasSupabaseConfig } from "./supabase-config.js";

const SYNC_PIN_SESSION_KEY = "sync_pin_session";
const SYNC_PIN_DEVICE_KEY = "sync_pin_device";
const SYNC_LAST_PULL_KEY = "sync_last_pull_at";

let pendingEntries = [];
let flushTimer = null;
let statusHandler = null;

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
  setSyncStatus("synced", "Latest data pulled");
  return Array.isArray(result.entries) ? result.entries : [];
}

function enqueueEntryChange(entry) {
  if (!isSyncEnabled()) return;
  const existingIndex = pendingEntries.findIndex((item) =>
    item.week === entry.week
    && item.day === entry.day
    && item.exercise === entry.exercise
    && item.set === entry.set
  );

  if (existingIndex >= 0) {
    pendingEntries[existingIndex] = entry;
  } else {
    pendingEntries.push(entry);
  }
}

async function flushPending(pin) {
  if (!isSyncEnabled()) return;
  if (!pendingEntries.length) return;
  const batch = [...pendingEntries];
  pendingEntries = [];
  setSyncStatus("syncing", "Syncing changes...");
  try {
    await callSyncFunction({ action: "push", entries: batch }, pin);
    setSyncStatus("synced", "All changes synced");
  } catch (error) {
    pendingEntries = [...batch, ...pendingEntries];
    setSyncStatus("error", error.message);
    throw error;
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

function getLastPullAt() {
  return localStorage.getItem(SYNC_LAST_PULL_KEY) || "";
}

export {
  clearSavedPin,
  enqueueEntryChange,
  flushPending,
  getLastPullAt,
  getSavedPin,
  isSyncEnabled,
  pullRemote,
  savePin,
  scheduleFlush,
  setSyncStatus,
  setSyncStatusHandler
};
