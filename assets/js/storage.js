const buildStorageKey = (week, day, exercise, setNum) => `w${week}_d${day}_e${exercise}_s${setNum}`;
const buildExerciseNoteKey = (week, day, exercise) => `note_w${week}_d${day}_e${exercise}`;
const buildExerciseRpeKey = (week, day, exercise) => `rpe_w${week}_d${day}_e${exercise}`;
const buildCardioDayKey = (week, day) => `cardio_w${week}_d${day}`;

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

function saveExerciseNote(week, day, exercise, value) {
  const key = buildExerciseNoteKey(week, day, exercise);
  const trimmed = value.trim();
  if (trimmed === "") {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, trimmed);
  }
}

function getExerciseNote(week, day, exercise) {
  const key = buildExerciseNoteKey(week, day, exercise);
  return localStorage.getItem(key) || "";
}

function saveExerciseRpe(week, day, exercise, value) {
  const key = buildExerciseRpeKey(week, day, exercise);
  const trimmed = value.trim();
  if (trimmed === "") {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, trimmed);
  }
}

function getExerciseRpe(week, day, exercise) {
  const key = buildExerciseRpeKey(week, day, exercise);
  return localStorage.getItem(key) || "";
}

function toNumberOrZero(value) {
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCardioPayload(payload) {
  const stairMinutes = Math.max(0, toNumberOrZero(payload.stairMinutes));
  const treadmillMinutes = Math.max(0, toNumberOrZero(payload.treadmillMinutes));
  const stairsClimbed = Math.max(0, toNumberOrZero(payload.stairsClimbed));
  const treadmillDistance = Math.max(0, toNumberOrZero(payload.treadmillDistance));
  const totalMinutes = stairMinutes + treadmillMinutes;

  return {
    stairMinutes,
    treadmillMinutes,
    totalMinutes,
    stairsClimbed,
    treadmillDistance
  };
}

function isCardioDayLogged(entry) {
  return entry.totalMinutes > 0 || entry.stairsClimbed > 0 || entry.treadmillDistance > 0;
}

function saveCardioDay(week, day, payload) {
  const key = buildCardioDayKey(week, day);
  const normalized = normalizeCardioPayload(payload);
  const clear = !isCardioDayLogged(normalized);
  if (!isCardioDayLogged(normalized)) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(normalized));
  }

  window.dispatchEvent(new CustomEvent("cardio:data-changed", {
    detail: {
      week,
      day,
      ...normalized,
      clear,
      updatedAt: new Date().toISOString()
    }
  }));
}

function getCardioDay(week, day) {
  const key = buildCardioDayKey(week, day);
  const raw = localStorage.getItem(key);
  if (!raw) {
    return normalizeCardioPayload({
      stairMinutes: 0,
      treadmillMinutes: 0,
      stairsClimbed: 0,
      treadmillDistance: 0
    });
  }

  try {
    return normalizeCardioPayload(JSON.parse(raw));
  } catch {
    return normalizeCardioPayload({
      stairMinutes: 0,
      treadmillMinutes: 0,
      stairsClimbed: 0,
      treadmillDistance: 0
    });
  }
}

function getAllCardioDays() {
  const entries = [];
  const pattern = /^cardio_w(\d+)_d(\d+)$/;

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    const match = key.match(pattern);
    if (!match) continue;
    const week = Number.parseInt(match[1], 10);
    const day = Number.parseInt(match[2], 10);
    const data = getCardioDay(week, day);
    if (!isCardioDayLogged(data)) continue;
    entries.push({ week, day, ...data });
  }

  return entries;
}

function getCardioTotals() {
  return getAllCardioDays().reduce((totals, entry) => ({
    totalMinutes: totals.totalMinutes + entry.totalMinutes,
    stairMinutes: totals.stairMinutes + entry.stairMinutes,
    stairsClimbed: totals.stairsClimbed + entry.stairsClimbed,
    treadmillDistance: totals.treadmillDistance + entry.treadmillDistance
  }), {
    totalMinutes: 0,
    stairMinutes: 0,
    stairsClimbed: 0,
    treadmillDistance: 0
  });
}

function getCardioCurrentStreak(totalWeeks = 12, daysPerWeek = 6) {
  const lookup = new Map();
  getAllCardioDays().forEach((entry) => {
    lookup.set(`${entry.week}-${entry.day}`, true);
  });

  const totalDays = totalWeeks * daysPerWeek;
  let lastLoggedIndex = -1;
  for (let idx = totalDays - 1; idx >= 0; idx -= 1) {
    const week = Math.floor(idx / daysPerWeek) + 1;
    const day = (idx % daysPerWeek) + 1;
    if (lookup.get(`${week}-${day}`)) {
      lastLoggedIndex = idx;
      break;
    }
  }
  if (lastLoggedIndex === -1) return 0;

  let streak = 0;
  for (let idx = lastLoggedIndex; idx >= 0; idx -= 1) {
    const week = Math.floor(idx / daysPerWeek) + 1;
    const day = (idx % daysPerWeek) + 1;
    if (!lookup.get(`${week}-${day}`)) break;
    streak += 1;
  }
  return streak;
}

function applyRemoteCardioEntries(entries) {
  entries.forEach((entry) => {
    const key = buildCardioDayKey(entry.week, entry.day);
    const normalized = normalizeCardioPayload(entry);
    if (!isCardioDayLogged(normalized)) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(normalized));
  });
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

export {
  applyRemoteCardioEntries,
  applyRemoteEntries,
  getCardioCurrentStreak,
  getCardioDay,
  getCardioTotals,
  getAllWorkoutEntries,
  getExerciseNote,
  getExerciseRpe,
  getWorkoutData,
  isCardioDayLogged,
  saveCardioDay,
  saveExerciseNote,
  saveExerciseRpe,
  saveWorkoutData
};
