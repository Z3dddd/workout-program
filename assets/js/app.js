import { weekData } from "./data/weekData.js";
import { renderProgram, showWeek } from "./ui.js";
import { applyRemoteCardioEntries, applyRemoteEntries } from "./storage.js";
import {
  clearSavedPin,
  enqueueCardioChange,
  enqueueEntryChange,
  flushPending,
  getPendingCardioEntries,
  getPendingEntries,
  getSavedPin,
  initAutoRetry,
  isSyncEnabled,
  pullRemote,
  savePin,
  scheduleFlush,
  setSyncStatus,
  setSyncStatusHandler
} from "./sync.js";

let activePin = "";

function updateStatusUi(payload) {
  const statusEl = document.getElementById("syncStatus");
  if (!statusEl) return;
  statusEl.classList.remove("syncing", "synced", "error", "pending");
  statusEl.classList.add(payload.status);
  statusEl.textContent = payload.message || payload.status.toUpperCase();
}

function wirePinDialog() {
  const dialog = document.getElementById("syncPinDialog");
  const form = document.getElementById("syncPinForm");
  const openBtn = document.getElementById("openSyncPinBtn");
  const clearBtn = document.getElementById("clearPinBtn");
  const cancelBtn = document.getElementById("cancelPinBtn");
  const pinInput = document.getElementById("syncPinInput");
  const remember = document.getElementById("rememberPin");

  if (!dialog || !form || !openBtn || !clearBtn || !cancelBtn || !pinInput || !remember) return;

  openBtn.addEventListener("click", () => dialog.showModal());
  cancelBtn.addEventListener("click", () => dialog.close());

  clearBtn.addEventListener("click", () => {
    clearSavedPin();
    activePin = "";
    setSyncStatus("error", "PIN cleared. Local-only mode.");
    dialog.close();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const pin = pinInput.value.trim();
    if (!pin) return;
    savePin(pin, remember.checked);
    activePin = pin;
    try {
      const remoteData = await pullRemote(activePin);
      applyRemoteEntries(remoteData.entries);
      applyRemoteCardioEntries(remoteData.cardioEntries);
      applyRemoteEntries(getPendingEntries());
      applyRemoteCardioEntries(getPendingCardioEntries());
      await flushPending(activePin);
      setSyncStatus("synced", "Sync enabled");
      dialog.close();
      window.location.reload();
    } catch (error) {
      setSyncStatus("error", error.message);
    }
  });
}

function wireLiveSync() {
  window.addEventListener("workout:data-changed", (event) => {
    if (!activePin || !isSyncEnabled()) return;
    const value = event.detail.value;
    const numeric = value === "" ? null : Number.parseFloat(String(value).replace(",", "."));
    enqueueEntryChange({
      week: event.detail.week,
      day: event.detail.day,
      exercise: event.detail.exercise,
      set: event.detail.set,
      weight: numeric === null || Number.isNaN(numeric) ? null : numeric,
      updatedAt: new Date().toISOString()
    });
    scheduleFlush(activePin);
  });

  window.addEventListener("cardio:data-changed", (event) => {
    if (!activePin || !isSyncEnabled()) return;
    enqueueCardioChange({
      week: event.detail.week,
      day: event.detail.day,
      stairMinutes: event.detail.stairMinutes,
      treadmillMinutes: event.detail.treadmillMinutes,
      totalMinutes: event.detail.totalMinutes,
      stairsClimbed: event.detail.stairsClimbed,
      treadmillDistance: event.detail.treadmillDistance,
      clear: event.detail.clear === true,
      updatedAt: event.detail.updatedAt
    });
    scheduleFlush(activePin);
  });
}

async function init() {
  setSyncStatusHandler(updateStatusUi);
  wirePinDialog();
  wireLiveSync();
  initAutoRetry(() => activePin);

  if (!isSyncEnabled()) {
    setSyncStatus("error", "Local-only (configure Supabase keys)");
  } else {
    activePin = getSavedPin();
    if (activePin) {
      try {
        const remoteData = await pullRemote(activePin);
        applyRemoteEntries(remoteData.entries);
        applyRemoteCardioEntries(remoteData.cardioEntries);
        applyRemoteEntries(getPendingEntries());
        applyRemoteCardioEntries(getPendingCardioEntries());
        await flushPending(activePin);
      } catch (error) {
        setSyncStatus("error", error.message);
      }
    } else {
      setSyncStatus("error", "PIN required for sync");
    }
  }

  renderProgram(weekData);
  showWeek(1);
}

init();
