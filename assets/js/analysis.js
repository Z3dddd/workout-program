import { weekData } from "./data/weekData.js";
import { applyRemoteEntries } from "./storage.js";
import {
  clearSavedPin,
  flushPending,
  getPendingEntries,
  getSavedPin,
  initAutoRetry,
  isSyncEnabled,
  pullRemote,
  savePin,
  setSyncStatus,
  setSyncStatusHandler
} from "./sync.js";

function getSetCount(setText) {
  const match = setText.match(/^\s*(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 1;
}

function parseWeight(value) {
  const normalized = String(value).replace(",", ".").trim();
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const numeric = Number.parseFloat(match[0]);
  return Number.isFinite(numeric) ? numeric : null;
}

function getStorageValue(week, day, exercise, setNum) {
  const key = `w${week}_d${day}_e${exercise}_s${setNum}`;
  return localStorage.getItem(key);
}

function average(numbers) {
  if (!numbers.length) return null;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

function formatWeight(num) {
  if (num === null || Number.isNaN(num)) return "--";
  return `${num.toFixed(1)} kg`;
}

function formatDelta(num) {
  if (num === null || Number.isNaN(num)) return "--";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(1)} kg`;
}

function createEmptyText(message) {
  const p = document.createElement("p");
  p.className = "empty";
  p.textContent = message;
  return p;
}

function collectAnalysisData() {
  const exerciseMap = new Map();
  const weeklyBuckets = Array.from({ length: 12 }, () => []);
  const allValues = [];

  for (let week = 1; week <= 12; week += 1) {
    const weekInfo = weekData[week];
    weekInfo.days.forEach((day, dayIdx) => {
      day.exercises.forEach((exercise, exIdx) => {
        const setCount = getSetCount(exercise.sets);
        const key = `d${dayIdx}_e${exIdx}`;
        if (!exerciseMap.has(key)) {
          exerciseMap.set(key, {
            key,
            dayIdx,
            dayName: day.name,
            type: day.type,
            names: new Set(),
            weeklyValues: Array.from({ length: 12 }, () => []),
            values: []
          });
        }

        const entry = exerciseMap.get(key);
        entry.names.add(exercise.name);

        for (let setNum = 1; setNum <= setCount; setNum += 1) {
          const raw = getStorageValue(week, dayIdx, exIdx, setNum);
          if (!raw) continue;
          const value = parseWeight(raw);
          if (value === null) continue;

          entry.values.push(value);
          entry.weeklyValues[week - 1].push(value);
          weeklyBuckets[week - 1].push(value);
          allValues.push(value);
        }
      });
    });
  }

  return {
    exercises: [...exerciseMap.values()].sort((a, b) => {
      if (a.dayIdx !== b.dayIdx) return a.dayIdx - b.dayIdx;
      return a.key.localeCompare(b.key);
    }),
    weeklyAverages: weeklyBuckets.map((bucket) => average(bucket)),
    allValues
  };
}

function renderSummary(analysisData) {
  const summaryEl = document.getElementById("summaryCards");
  if (!summaryEl) return;
  summaryEl.innerHTML = "";

  const week1 = analysisData.weeklyAverages[0];
  const week12 = analysisData.weeklyAverages[11];
  const progress = week1 !== null && week12 !== null ? week12 - week1 : null;

  const items = [
    { label: "Logged Sets", value: String(analysisData.allValues.length) },
    { label: "Overall Average", value: formatWeight(average(analysisData.allValues)) },
    { label: "Week 1 Average", value: formatWeight(week1) },
    { label: "Week 12 Delta", value: formatDelta(progress), delta: progress }
  ];

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "summary-card";

    const key = document.createElement("span");
    key.className = "summary-key";
    key.textContent = item.label;

    const value = document.createElement("span");
    value.className = "summary-value";
    if (item.delta !== undefined && item.delta !== null) {
      if (item.delta > 0) value.classList.add("positive");
      if (item.delta < 0) value.classList.add("negative");
    }
    value.textContent = item.value;

    card.append(key, value);
    summaryEl.appendChild(card);
  });
}

function renderWeeklyAverages(analysisData) {
  const weeklyEl = document.getElementById("weeklyAverages");
  if (!weeklyEl) return;
  weeklyEl.innerHTML = "";

  const hasAnyData = analysisData.weeklyAverages.some((weekAvg) => weekAvg !== null);
  if (!hasAnyData) {
    weeklyEl.appendChild(createEmptyText("No saved sets yet. Enter weights on the main page to see week-by-week progress."));
    return;
  }

  analysisData.weeklyAverages.forEach((weekAvg, idx) => {
    const chip = document.createElement("article");
    chip.className = "week-chip";

    const key = document.createElement("span");
    key.className = "week-chip-key";
    key.textContent = `WK ${idx + 1}`;

    const value = document.createElement("span");
    value.className = "week-chip-value";
    value.textContent = formatWeight(weekAvg);

    chip.append(key, value);
    weeklyEl.appendChild(chip);
  });
}

function renderExerciseProgress(analysisData) {
  const dayEl = document.getElementById("dayAnalysis");
  if (!dayEl) return;
  dayEl.innerHTML = "";

  const dayGroups = new Map();
  analysisData.exercises.forEach((exercise) => {
    if (!dayGroups.has(exercise.dayIdx)) {
      dayGroups.set(exercise.dayIdx, []);
    }
    dayGroups.get(exercise.dayIdx).push(exercise);
  });

  dayGroups.forEach((entries, dayIdx) => {
    const card = document.createElement("article");
    card.className = "day-progress-card";

    const head = document.createElement("div");
    const dayInfo = weekData[1].days[dayIdx];
    head.className = `day-progress-head ${dayInfo.type}`;

    const title = document.createElement("div");
    title.className = "day-progress-title";
    title.textContent = dayInfo.name.toUpperCase();

    const type = document.createElement("div");
    type.className = "day-progress-type";
    type.textContent = dayInfo.type === "strength" ? "STRENGTH FOCUS" : "HYPERTROPHY FOCUS";

    head.append(title, type);
    card.appendChild(head);

    let dayHasData = false;
    entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "exercise-row";

      const name = document.createElement("div");
      name.className = "exercise-name";
      const names = [...entry.names];
      name.textContent = names.length === 1 ? names[0] : names.join(" / ");

      const overallAvg = average(entry.values);
      const week1Avg = average(entry.weeklyValues[0]);
      const week12Avg = average(entry.weeklyValues[11]);
      const delta = week1Avg !== null && week12Avg !== null ? week12Avg - week1Avg : null;

      if (overallAvg !== null) {
        dayHasData = true;
      }

      const meta = document.createElement("div");
      meta.className = "exercise-meta";
      meta.textContent = `Avg ${formatWeight(overallAvg)} | W1 ${formatWeight(week1Avg)} | W12 ${formatWeight(week12Avg)} | Delta ${formatDelta(delta)}`;

      row.append(name, meta);
      card.appendChild(row);
    });

    if (!dayHasData) {
      card.appendChild(createEmptyText("No logged sets for this day yet."));
    }

    dayEl.appendChild(card);
  });
}

function updateStatusUi(payload) {
  const statusEl = document.getElementById("syncStatus");
  if (!statusEl) return;
  statusEl.classList.remove("syncing", "synced", "error", "pending");
  statusEl.classList.add(payload.status);
  statusEl.textContent = payload.message || payload.status.toUpperCase();
}

function wirePinDialog(onSynced) {
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
    setSyncStatus("error", "PIN cleared. Local-only mode.");
    dialog.close();
    onSynced();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const pin = pinInput.value.trim();
    if (!pin) return;
    savePin(pin, remember.checked);
    try {
      const remoteEntries = await pullRemote(pin);
      applyRemoteEntries(remoteEntries);
      applyRemoteEntries(getPendingEntries());
      await flushPending(pin);
      setSyncStatus("synced", "Sync enabled");
      dialog.close();
      onSynced();
    } catch (error) {
      setSyncStatus("error", error.message);
    }
  });
}

function renderAll() {
  const analysisData = collectAnalysisData();
  renderSummary(analysisData);
  renderWeeklyAverages(analysisData);
  renderExerciseProgress(analysisData);
}

async function init() {
  setSyncStatusHandler(updateStatusUi);
  wirePinDialog(renderAll);
  initAutoRetry(() => getSavedPin());

  if (!isSyncEnabled()) {
    setSyncStatus("error", "Local-only (configure Supabase keys)");
    renderAll();
    return;
  }

  const pin = getSavedPin();
  if (!pin) {
    setSyncStatus("error", "PIN required for sync");
    renderAll();
    return;
  }

  try {
    const remoteEntries = await pullRemote(pin);
    applyRemoteEntries(remoteEntries);
    applyRemoteEntries(getPendingEntries());
    await flushPending(pin);
  } catch (error) {
    setSyncStatus("error", error.message);
  }

  renderAll();
}

init();
