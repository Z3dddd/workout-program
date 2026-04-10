const buildStorageKey = (week, day, exercise, setNum) => `w${week}_d${day}_e${exercise}_s${setNum}`;

function saveWorkoutData(week, day, exercise, setNum, value) {
  const key = buildStorageKey(week, day, exercise, setNum);
  const payload = { week, day, exercise, set: setNum, value: value.trim() };
  if (value.trim() === "") {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value);
  }

  window.dispatchEvent(new CustomEvent("workout:data-changed", { detail: payload }));
}

function getWorkoutData(week, day, exercise, setNum) {
  const key = buildStorageKey(week, day, exercise, setNum);
  return localStorage.getItem(key) || "";
}

function getAllWorkoutEntries() {
  const entries = [];
  const pattern = /^w(\d+)_d(\d+)_e(\d+)_s(\d+)$/;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    const match = key.match(pattern);
    if (!match) continue;
    const raw = localStorage.getItem(key);
    if (!raw || raw.trim() === "") continue;

    const numeric = Number.parseFloat(raw.replace(",", "."));
    if (!Number.isFinite(numeric)) continue;

    entries.push({
      week: Number.parseInt(match[1], 10),
      day: Number.parseInt(match[2], 10),
      exercise: Number.parseInt(match[3], 10),
      set: Number.parseInt(match[4], 10),
      weight: numeric
    });
  }
  return entries;
}

function applyRemoteEntries(entries) {
  entries.forEach((entry) => {
    const key = buildStorageKey(entry.week, entry.day, entry.exercise, entry.set);
    if (entry.weight === null || entry.weight === undefined || Number.isNaN(entry.weight)) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, String(entry.weight));
  });
}

export { applyRemoteEntries, getAllWorkoutEntries, getWorkoutData, saveWorkoutData };
