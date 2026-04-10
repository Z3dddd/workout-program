import { weekData } from "./data/weekData.js";
import { applyRemoteEntries, getExerciseNote, getExerciseRpe } from "./storage.js";
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

const WEEK_LABELS = Array.from({ length: 12 }, (_, i) => `WK ${i + 1}`);
const FILTER_DEFAULTS = { dayType: "all", phase: "all", notesOnly: false };
let activeTrendChart = null;
let activeExerciseDetail = null;
let activeFilters = { ...FILTER_DEFAULTS };
const EXERCISE_COLOR_PALETTE = [
  "#00C2FF",
  "#FF4D00",
  "#E8FF00",
  "#9F67FF",
  "#2DFF87",
  "#FF6EC7",
  "#FFB703",
  "#7CF4FF",
  "#F94144",
  "#43AA8B",
  "#3A86FF",
  "#FB5607",
  "#06D6A0",
  "#EF476F",
  "#A3FF12",
  "#B5179E"
];
const HIGH_CONTRAST_COLOR_ORDER = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];

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

function parseRpe(value) {
  const normalized = String(value).replace(",", ".").trim();
  const numeric = Number.parseFloat(normalized);
  if (!Number.isFinite(numeric)) return null;
  if (numeric < 1 || numeric > 10) return null;
  return numeric;
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
  return `${num.toFixed(1)} lb`;
}

function formatDelta(num) {
  if (num === null || Number.isNaN(num)) return "--";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(1)} lb`;
}

function formatPercent(num) {
  if (num === null || Number.isNaN(num)) return "--";
  return `${num.toFixed(0)}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getDeltaChipStyle(delta) {
  if (delta === null || Number.isNaN(delta)) return "rgba(255,255,255,0.02)";
  if (delta === 0) return "rgba(255,255,255,0.03)";
  if (delta > 0) {
    const alpha = clamp(Math.abs(delta) / 15, 0.1, 0.42);
    return `rgba(45,255,135,${alpha.toFixed(2)})`;
  }
  const alpha = clamp(Math.abs(delta) / 15, 0.1, 0.42);
  return `rgba(255,77,0,${alpha.toFixed(2)})`;
}

function extractNoteKeywords(noteText) {
  const normalized = noteText.toLowerCase();
  const keywords = [
    { key: "pain", pattern: /\bpain|ache|hurt|injury|elbow|knee|shoulder\b/ },
    { key: "fatigue", pattern: /\bfatigue|tired|drained|exhaust|low energy\b/ },
    { key: "easy", pattern: /\beasy|strong|great|good|smooth\b/ },
    { key: "sleep", pattern: /\bsleep|slept|insomnia|restless\b/ }
  ];

  return keywords.filter((entry) => entry.pattern.test(normalized)).map((entry) => entry.key);
}

function matchesDayFilter(dayType, selectedFilter) {
  if (selectedFilter === "all") return true;
  const normalized = dayType === "hyper" ? "hypertrophy" : dayType;
  return normalized === selectedFilter;
}

function matchesPhaseFilter(phase, selectedFilter) {
  if (selectedFilter === "all") return true;
  return phase === selectedFilter;
}

function hasNotesOrRpe(entry) {
  const hasRpe = entry.weeklyRpe.some((value) => value !== null);
  const hasNote = entry.weeklyNotes.some((value) => value.trim() !== "");
  return hasRpe || hasNote;
}

function getLatestNonEmpty(values, isValid) {
  for (let idx = values.length - 1; idx >= 0; idx -= 1) {
    const value = values[idx];
    if (isValid(value)) {
      return { value, week: idx + 1 };
    }
  }
  return null;
}

function getWeekMax(values) {
  if (!values.length) return null;
  return values.reduce((max, value) => (value > max ? value : max), values[0]);
}

function getExerciseDisplayName(entry) {
  const names = [...entry.names];
  return names.length === 1 ? names[0] : names.join(" / ");
}

function computePrSummary(exercises) {
  let totalPrHits = 0;
  let slotsWithPr = 0;
  let latestPrWeek = null;
  const topImprovers = [];

  exercises.forEach((entry) => {
    const weeklyMaxes = entry.weeklyValues.map((weekSets) => getWeekMax(weekSets));
    let runningBest = null;
    let firstLogged = null;
    let best = null;
    let bestWeek = null;
    const prEvents = [];

    weeklyMaxes.forEach((weekMax, idx) => {
      if (weekMax === null) return;

      if (firstLogged === null) {
        firstLogged = weekMax;
      }
      if (best === null || weekMax > best) {
        best = weekMax;
        bestWeek = idx + 1;
      }
      if (runningBest === null) {
        runningBest = weekMax;
        return;
      }
      if (weekMax > runningBest) {
        prEvents.push({
          week: idx + 1,
          value: weekMax,
          delta: weekMax - runningBest
        });
        runningBest = weekMax;
      }
    });

    if (!prEvents.length) {
      entry.pr = null;
      return;
    }

    const latestEvent = prEvents[prEvents.length - 1];
    const previousEvent = prEvents.length > 1 ? prEvents[prEvents.length - 2] : null;
    const gain = firstLogged === null || best === null ? null : best - firstLogged;

    entry.pr = {
      count: prEvents.length,
      best,
      bestWeek,
      lastPrWeek: latestEvent.week,
      previousBest: previousEvent ? previousEvent.value : null
    };

    totalPrHits += prEvents.length;
    slotsWithPr += 1;
    latestPrWeek = latestPrWeek === null ? latestEvent.week : Math.max(latestPrWeek, latestEvent.week);

    if (gain !== null) {
      topImprovers.push({
        label: getExerciseDisplayName(entry),
        gain,
        best,
        bestWeek
      });
    }
  });

  topImprovers.sort((a, b) => b.gain - a.gain);

  return {
    totalPrHits,
    slotsWithPr,
    latestPrWeek,
    topImprovers: topImprovers.slice(0, 3)
  };
}

function createEmptyText(message) {
  const p = document.createElement("p");
  p.className = "empty";
  p.textContent = message;
  return p;
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getEntrySeed(entry) {
  return `${entry.key}_${[...entry.names].sort().join("|")}`;
}

function createDayColorMap(entries) {
  const colorMap = new Map();
  const sortedEntries = [...entries];
  const paletteSize = EXERCISE_COLOR_PALETTE.length;
  const daySeed = hashString(sortedEntries.map((entry) => getEntrySeed(entry)).join("::"));
  const rotation = daySeed % paletteSize;

  sortedEntries.forEach((entry, idx) => {
    // Use a high-contrast traversal so adjacent exercises are visually distinct.
    const orderIndex = HIGH_CONTRAST_COLOR_ORDER[idx % HIGH_CONTRAST_COLOR_ORDER.length];
    const paletteIndex = (orderIndex + rotation) % paletteSize;
    colorMap.set(entry.key, EXERCISE_COLOR_PALETTE[paletteIndex]);
  });

  return colorMap;
}

function getThemeColor(variableName, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  return value || fallback;
}

function closeDayTrendModal() {
  const dialog = document.getElementById("dayTrendDialog");
  if (!dialog) return;
  if (activeTrendChart) {
    activeTrendChart.destroy();
    activeTrendChart = null;
  }
  if (dialog.open) {
    dialog.close();
  }
}

function buildDayTrendDatasets(entries, colorMap) {
  const datasets = [];

  entries.forEach((entry, index) => {
    const data = entry.weeklyValues.map((weekSets) => average(weekSets));
    const hasData = data.some((point) => point !== null);
    if (!hasData) return;

    const names = [...entry.names];
    const label = names.length === 1 ? names[0] : names.join(" / ");
    const color = colorMap.get(entry.key) || EXERCISE_COLOR_PALETTE[HIGH_CONTRAST_COLOR_ORDER[index % HIGH_CONTRAST_COLOR_ORDER.length]];
    datasets.push({
      label,
      data,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 4,
      spanGaps: true,
      tension: 0.25
    });
  });

  return datasets;
}

function openDayTrendModal(dayInfo, entries) {
  const dialog = document.getElementById("dayTrendDialog");
  const titleEl = document.getElementById("dayTrendTitle");
  const canvas = document.getElementById("dayTrendCanvas");
  const emptyEl = document.getElementById("dayTrendEmpty");
  if (!dialog || !titleEl || !canvas || !emptyEl) return;

  titleEl.textContent = `${dayInfo.name.toUpperCase()} WEEKLY TREND`;

  const colorMap = createDayColorMap(entries);
  const datasets = buildDayTrendDatasets(entries, colorMap);
  const hasData = datasets.length > 0;
  emptyEl.hidden = hasData;
  canvas.hidden = !hasData;

  if (activeTrendChart) {
    activeTrendChart.destroy();
    activeTrendChart = null;
  }

  if (hasData && window.Chart) {
    const muted = getThemeColor("--muted", "#6b6f84");
    const text = getThemeColor("--text", "#e8e8ef");
    const border = getThemeColor("--border", "#2a2a35");
    const ctx = canvas.getContext("2d");
    activeTrendChart = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: WEEK_LABELS,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "nearest",
          intersect: false
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: text,
              boxWidth: 10,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 11 }
            }
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label(context) {
                const value = context.parsed.y;
                if (value === null || Number.isNaN(value)) return `${context.dataset.label}: --`;
                return `${context.dataset.label}: ${value.toFixed(1)} lb`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: muted, maxRotation: 0, autoSkipPadding: 10 },
            grid: { color: border }
          },
          y: {
            ticks: {
              color: muted,
              callback(value) {
                return `${value}lb`;
              }
            },
            grid: { color: border }
          }
        }
      }
    });
  }

  dialog.showModal();
}

function wireDayTrendDialog() {
  const dialog = document.getElementById("dayTrendDialog");
  const closeBtn = document.getElementById("closeDayTrendBtn");
  if (!dialog || !closeBtn) return;

  closeBtn.addEventListener("click", () => closeDayTrendModal());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeDayTrendModal();
    }
  });
}

function closeExerciseDetailDialog() {
  const dialog = document.getElementById("exerciseDetailDialog");
  if (!dialog) return;
  if (dialog.open) dialog.close();
  activeExerciseDetail = null;
}

function openExerciseDetailDialog(entry) {
  const dialog = document.getElementById("exerciseDetailDialog");
  const titleEl = document.getElementById("exerciseDetailTitle");
  const metaEl = document.getElementById("exerciseDetailMeta");
  const trendEl = document.getElementById("exerciseDetailTrend");
  const logsEl = document.getElementById("exerciseDetailLogs");
  if (!dialog || !titleEl || !metaEl || !trendEl || !logsEl) return;

  activeExerciseDetail = entry;
  titleEl.textContent = getExerciseDisplayName(entry).toUpperCase();
  const latestRpe = getLatestNonEmpty(entry.weeklyRpe, (value) => value !== null);
  const latestNote = getLatestNonEmpty(entry.weeklyNotes, (value) => value.trim() !== "");
  metaEl.textContent = `Best ${entry.pr ? formatWeight(entry.pr.best) : "--"} | Last RPE ${latestRpe ? latestRpe.value.toFixed(1) : "--"} | Day ${entry.dayName}`;

  trendEl.innerHTML = "";
  logsEl.innerHTML = "";

  entry.weeklyValues.forEach((sets, idx) => {
    const chip = document.createElement("article");
    chip.className = "heatmap-chip";
    const key = document.createElement("span");
    key.className = "week-chip-key";
    key.textContent = `WK ${idx + 1}`;
    const value = document.createElement("span");
    value.className = "heatmap-chip-value";
    value.textContent = formatWeight(average(sets));
    chip.append(key, value);
    trendEl.appendChild(chip);
  });

  const recentLogs = [];
  for (let idx = 11; idx >= 0 && recentLogs.length < 4; idx -= 1) {
    const note = entry.weeklyNotes[idx];
    const rpe = entry.weeklyRpe[idx];
    if (note.trim() === "" && rpe === null) continue;
    recentLogs.push({ week: idx + 1, note, rpe });
  }
  if (!recentLogs.length) {
    logsEl.appendChild(createEmptyText("No note/RPE logs for this exercise yet."));
  } else {
    recentLogs.forEach((log) => {
      const block = document.createElement("div");
      block.className = "exercise-detail-log";
      const parts = [`WK ${log.week}`];
      if (log.rpe !== null) parts.push(`RPE ${log.rpe.toFixed(1)}`);
      if (log.note.trim()) parts.push(log.note.trim());
      block.textContent = parts.join(" | ");
      logsEl.appendChild(block);
    });
  }

  dialog.showModal();
}

function wireExerciseDetailDialog() {
  const dialog = document.getElementById("exerciseDetailDialog");
  const closeBtn = document.getElementById("closeExerciseDetailBtn");
  if (!dialog || !closeBtn) return;

  closeBtn.addEventListener("click", () => closeExerciseDetailDialog());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeExerciseDetailDialog();
    }
  });
}

function collectAnalysisData(filters = activeFilters) {
  const exerciseMap = new Map();
  const weeklyBuckets = Array.from({ length: 12 }, () => []);
  const weeklyPlannedSets = Array.from({ length: 12 }, () => 0);
  const weeklyLoggedSets = Array.from({ length: 12 }, () => 0);
  const allValues = [];
  const volumeByType = {
    strength: { loggedSets: 0, values: [] },
    hypertrophy: { loggedSets: 0, values: [] }
  };
  const noteKeywordCounts = new Map();
  const recentFlags = [];

  for (let week = 1; week <= 12; week += 1) {
    const weekInfo = weekData[week];
    if (!matchesPhaseFilter(weekInfo.phase, filters.phase)) continue;

    weekInfo.days.forEach((day, dayIdx) => {
      if (!matchesDayFilter(day.type, filters.dayType)) return;

      day.exercises.forEach((exercise, exIdx) => {
        const setCount = getSetCount(exercise.sets);
        weeklyPlannedSets[week - 1] += setCount;
        const key = `d${dayIdx}_e${exIdx}`;
        if (!exerciseMap.has(key)) {
          exerciseMap.set(key, {
            key,
            dayIdx,
            dayName: day.name,
            type: day.type,
            names: new Set(),
            weeklyValues: Array.from({ length: 12 }, () => []),
            weeklyNotes: Array.from({ length: 12 }, () => ""),
            weeklyRpe: Array.from({ length: 12 }, () => null),
            values: []
          });
        }

        const entry = exerciseMap.get(key);
        entry.names.add(exercise.name);
        const noteValue = getExerciseNote(week, dayIdx, exIdx);
        entry.weeklyNotes[week - 1] = noteValue;
        entry.weeklyRpe[week - 1] = parseRpe(getExerciseRpe(week, dayIdx, exIdx));

        const noteKeywords = extractNoteKeywords(noteValue);
        noteKeywords.forEach((keyword) => {
          noteKeywordCounts.set(keyword, (noteKeywordCounts.get(keyword) || 0) + 1);
          if ((keyword === "pain" || keyword === "fatigue") && week >= 10) {
            recentFlags.push({ keyword, week, note: noteValue, exercise: exercise.name });
          }
        });

        for (let setNum = 1; setNum <= setCount; setNum += 1) {
          const raw = getStorageValue(week, dayIdx, exIdx, setNum);
          if (!raw) continue;
          const value = parseWeight(raw);
          if (value === null) continue;

          entry.values.push(value);
          entry.weeklyValues[week - 1].push(value);
          weeklyBuckets[week - 1].push(value);
          weeklyLoggedSets[week - 1] += 1;
          const typeKey = day.type === "hyper" ? "hypertrophy" : day.type;
          volumeByType[typeKey].loggedSets += 1;
          volumeByType[typeKey].values.push(value);
          allValues.push(value);
        }
      });
    });
  }

  const exercises = [...exerciseMap.values()].sort((a, b) => {
    if (a.dayIdx !== b.dayIdx) return a.dayIdx - b.dayIdx;
    return a.key.localeCompare(b.key);
  });

  const filteredExercises = filters.notesOnly ? exercises.filter((entry) => hasNotesOrRpe(entry)) : exercises;
  const notesEligibleCount = exercises.filter((entry) => hasNotesOrRpe(entry)).length;
  const weeklyAverages = weeklyBuckets.map((bucket) => average(bucket));
  const weeklyDeltas = weeklyAverages.map((weekAvg, idx) => {
    if (idx === 0 || weekAvg === null || weeklyAverages[idx - 1] === null) return null;
    return weekAvg - weeklyAverages[idx - 1];
  });
  const movers = filteredExercises.map((entry) => {
    const firstWeek = entry.weeklyValues.find((sets) => sets.length > 0);
    const lastWeek = [...entry.weeklyValues].reverse().find((sets) => sets.length > 0);
    const firstAvg = firstWeek ? average(firstWeek) : null;
    const lastAvg = lastWeek ? average(lastWeek) : null;
    const delta = firstAvg !== null && lastAvg !== null ? lastAvg - firstAvg : null;
    return {
      label: getExerciseDisplayName(entry),
      delta,
      prCount: entry.pr ? entry.pr.count : 0
    };
  }).filter((item) => item.delta !== null);

  const bestMovers = [...movers].sort((a, b) => b.delta - a.delta).slice(0, 5);
  const worstMovers = [...movers].sort((a, b) => a.delta - b.delta).slice(0, 5);

  let currentStreak = 0;
  for (let idx = weeklyLoggedSets.length - 1; idx >= 0; idx -= 1) {
    if (weeklyLoggedSets[idx] > 0) currentStreak += 1;
    else break;
  }
  let longestStreak = 0;
  let running = 0;
  weeklyLoggedSets.forEach((count) => {
    if (count > 0) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
  });
  const lowCompletionWeeks = weeklyPlannedSets
    .map((planned, idx) => ({ week: idx + 1, completion: planned ? (weeklyLoggedSets[idx] / planned) * 100 : 0 }))
    .filter((item) => item.completion < 40);

  const noteInsights = {
    keywordCounts: [...noteKeywordCounts.entries()].sort((a, b) => b[1] - a[1]),
    recentFlags: recentFlags.slice(-5)
  };
  const progressDelta = weeklyAverages[0] !== null && weeklyAverages[11] !== null ? weeklyAverages[11] - weeklyAverages[0] : null;
  const recentCompletionValues = weeklyPlannedSets
    .map((planned, idx) => (planned ? (weeklyLoggedSets[idx] / planned) * 100 : null))
    .slice(-4)
    .filter((value) => value !== null);
  const recentCompletion = recentCompletionValues.length ? average(recentCompletionValues) : null;
  const fatigueSignals = noteInsights.recentFlags.length + filteredExercises.reduce((sum, entry) => {
    const recentRpe = entry.weeklyRpe.slice(-2).filter((value) => value !== null && value >= 9).length;
    return sum + recentRpe;
  }, 0);

  return {
    exercises: filteredExercises,
    notesEligibleCount,
    weeklyAverages,
    weeklyDeltas,
    weeklyCompletion: weeklyPlannedSets.map((planned, idx) => {
      if (!planned) return null;
      return (weeklyLoggedSets[idx] / planned) * 100;
    }),
    completionSummary: {
      totalLogged: weeklyLoggedSets.reduce((sum, value) => sum + value, 0),
      totalPlanned: weeklyPlannedSets.reduce((sum, value) => sum + value, 0)
    },
    readiness: {
      consistency: recentCompletion,
      progressDelta,
      fatigueSignals
    },
    movers: {
      best: bestMovers,
      worst: worstMovers
    },
    streaks: {
      current: currentStreak,
      longest: longestStreak,
      lowCompletionWeeks
    },
    volumeByType: {
      strength: {
        loggedSets: volumeByType.strength.loggedSets,
        avgLoad: average(volumeByType.strength.values)
      },
      hypertrophy: {
        loggedSets: volumeByType.hypertrophy.loggedSets,
        avgLoad: average(volumeByType.hypertrophy.values)
      }
    },
    noteInsights,
    allValues,
    prSummary: computePrSummary(filteredExercises)
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

function renderReadiness(analysisData) {
  const el = document.getElementById("readinessCards");
  if (!el) return;
  el.innerHTML = "";

  const consistencyState = analysisData.readiness.consistency === null
    ? "--"
    : analysisData.readiness.consistency >= 75 ? "HIGH" : analysisData.readiness.consistency >= 50 ? "MOD" : "LOW";
  const progressState = analysisData.readiness.progressDelta === null
    ? "--"
    : analysisData.readiness.progressDelta > 0 ? "UP" : analysisData.readiness.progressDelta < 0 ? "DOWN" : "FLAT";
  const fatigueState = analysisData.readiness.fatigueSignals >= 5
    ? "ELEVATED"
    : analysisData.readiness.fatigueSignals >= 2 ? "MODERATE" : "LOW";

  const cards = [
    { label: "Consistency", value: consistencyState, warn: consistencyState === "LOW" },
    { label: "Progress", value: progressState, warn: progressState === "DOWN" },
    { label: "Fatigue Risk", value: fatigueState, warn: fatigueState === "ELEVATED" }
  ];

  cards.forEach((item) => {
    const card = document.createElement("article");
    card.className = "readiness-card";

    const key = document.createElement("span");
    key.className = "readiness-key";
    key.textContent = item.label;

    const value = document.createElement("span");
    value.className = "readiness-value";
    if (item.warn) value.classList.add("warn");
    value.textContent = item.value;

    card.append(key, value);
    el.appendChild(card);
  });
}

function renderPrSummary(analysisData) {
  const prEl = document.getElementById("prSummary");
  if (!prEl) return;
  prEl.innerHTML = "";

  const { prSummary } = analysisData;
  if (!prSummary || prSummary.slotsWithPr === 0) {
    prEl.appendChild(createEmptyText("No PRs yet. Log more sets to unlock strict slot-based PR tracking."));
    return;
  }

  const cards = [
    { label: "Total PR Hits", value: String(prSummary.totalPrHits) },
    { label: "Slots With PR", value: String(prSummary.slotsWithPr) },
    { label: "Latest PR Week", value: prSummary.latestPrWeek ? `WK ${prSummary.latestPrWeek}` : "--" }
  ];

  cards.forEach((item) => {
    const card = document.createElement("article");
    card.className = "pr-card";

    const key = document.createElement("span");
    key.className = "pr-key";
    key.textContent = item.label;

    const value = document.createElement("span");
    value.className = "pr-value";
    value.textContent = item.value;

    card.append(key, value);
    prEl.appendChild(card);
  });

  const topCard = document.createElement("article");
  topCard.className = "pr-card pr-card-wide";

  const topKey = document.createElement("span");
  topKey.className = "pr-key";
  topKey.textContent = "Top Improvements";
  topCard.appendChild(topKey);

  if (!prSummary.topImprovers.length) {
    topCard.appendChild(createEmptyText("Not enough data yet to rank improvements."));
  } else {
    const list = document.createElement("div");
    list.className = "pr-top-list";

    prSummary.topImprovers.forEach((item) => {
      const row = document.createElement("div");
      row.className = "pr-top-row";

      const name = document.createElement("span");
      name.className = "pr-top-name";
      name.textContent = item.label;

      const meta = document.createElement("span");
      meta.className = "pr-top-meta";
      meta.textContent = `${formatDelta(item.gain)} | Best ${formatWeight(item.best)} | WK ${item.bestWeek}`;

      row.append(name, meta);
      list.appendChild(row);
    });

    topCard.appendChild(list);
  }

  prEl.appendChild(topCard);
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

function renderCompletion(analysisData) {
  const summaryEl = document.getElementById("completionSummary");
  const weeklyEl = document.getElementById("completionWeekly");
  if (!summaryEl || !weeklyEl) return;

  summaryEl.innerHTML = "";
  weeklyEl.innerHTML = "";

  const completionValues = analysisData.weeklyCompletion.filter((value) => value !== null);
  if (!completionValues.length) {
    weeklyEl.appendChild(createEmptyText("No completion data in this filter scope yet."));
    return;
  }

  const overall = analysisData.completionSummary.totalPlanned
    ? (analysisData.completionSummary.totalLogged / analysisData.completionSummary.totalPlanned) * 100
    : null;

  const bestValue = completionValues.reduce((max, value) => (value > max ? value : max), completionValues[0]);
  const bestWeek = analysisData.weeklyCompletion.findIndex((value) => value === bestValue) + 1;

  const summaryItems = [
    { label: "Overall", value: formatPercent(overall) },
    { label: "Logged Sets", value: `${analysisData.completionSummary.totalLogged}` },
    { label: "Best Week", value: `WK ${bestWeek}` }
  ];

  summaryItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "completion-card";

    const key = document.createElement("span");
    key.className = "completion-key";
    key.textContent = item.label;

    const value = document.createElement("span");
    value.className = "completion-value";
    value.textContent = item.value;

    card.append(key, value);
    summaryEl.appendChild(card);
  });

  analysisData.weeklyCompletion.forEach((value, idx) => {
    if (value === null) return;

    const chip = document.createElement("article");
    chip.className = "completion-chip";

    const key = document.createElement("span");
    key.className = "week-chip-key";
    key.textContent = `WK ${idx + 1}`;

    const chipValue = document.createElement("span");
    chipValue.className = "completion-chip-value";
    chipValue.textContent = formatPercent(value);

    chip.append(key, chipValue);
    weeklyEl.appendChild(chip);
  });
}

function renderDeltaHeatmap(analysisData) {
  const el = document.getElementById("deltaHeatmap");
  if (!el) return;
  el.innerHTML = "";

  analysisData.weeklyDeltas.forEach((delta, idx) => {
    const chip = document.createElement("article");
    chip.className = "heatmap-chip";
    chip.style.background = getDeltaChipStyle(delta);

    const key = document.createElement("span");
    key.className = "week-chip-key";
    key.textContent = `WK ${idx + 1}`;

    const value = document.createElement("span");
    value.className = "heatmap-chip-value";
    value.textContent = idx === 0 ? "--" : formatDelta(delta);

    chip.append(key, value);
    el.appendChild(chip);
  });
}

function renderMovers(analysisData) {
  const el = document.getElementById("moversPanel");
  if (!el) return;
  el.innerHTML = "";

  const cards = [
    { title: "Best Movers", items: analysisData.movers.best },
    { title: "Needs Attention", items: analysisData.movers.worst }
  ];

  cards.forEach((group) => {
    const card = document.createElement("article");
    card.className = "insight-card";

    const title = document.createElement("div");
    title.className = "insight-title";
    title.textContent = group.title;
    card.appendChild(title);

    if (!group.items.length) {
      card.appendChild(createEmptyText("Not enough movement data yet."));
    } else {
      const list = document.createElement("div");
      list.className = "insight-list";
      group.items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "insight-row";

        const name = document.createElement("strong");
        name.textContent = item.label;

        const value = document.createElement("span");
        value.textContent = formatDelta(item.delta);

        row.append(name, value);
        list.appendChild(row);
      });
      card.appendChild(list);
    }

    el.appendChild(card);
  });
}

function renderStreaks(analysisData) {
  const el = document.getElementById("streakCards");
  if (!el) return;
  el.innerHTML = "";

  const cards = [
    { label: "Current Streak", value: `${analysisData.streaks.current} weeks` },
    { label: "Longest Streak", value: `${analysisData.streaks.longest} weeks` }
  ];

  cards.forEach((item) => {
    const card = document.createElement("article");
    card.className = "streak-card";

    const key = document.createElement("div");
    key.className = "insight-title";
    key.textContent = item.label;

    const value = document.createElement("div");
    value.className = "readiness-value";
    value.textContent = item.value;

    card.append(key, value);
    el.appendChild(card);
  });

  const missed = document.createElement("article");
  missed.className = "streak-card";
  const missedTitle = document.createElement("div");
  missedTitle.className = "insight-title";
  missedTitle.textContent = "Low Completion Weeks";
  missed.appendChild(missedTitle);

  if (!analysisData.streaks.lowCompletionWeeks.length) {
    missed.appendChild(createEmptyText("No low-completion weeks in this scope."));
  } else {
    const list = document.createElement("div");
    list.className = "insight-list";
    analysisData.streaks.lowCompletionWeeks.slice(0, 6).forEach((item) => {
      const row = document.createElement("div");
      row.className = "insight-row";
      const wk = document.createElement("strong");
      wk.textContent = `WK ${item.week}`;
      const value = document.createElement("span");
      value.textContent = formatPercent(item.completion);
      row.append(wk, value);
      list.appendChild(row);
    });
    missed.appendChild(list);
  }

  el.appendChild(missed);
}

function renderVolumeProxy(analysisData) {
  const el = document.getElementById("volumeCards");
  if (!el) return;
  el.innerHTML = "";

  ["strength", "hypertrophy"].forEach((typeKey) => {
    const data = analysisData.volumeByType[typeKey];
    const card = document.createElement("article");
    card.className = "volume-card";
    const title = document.createElement("div");
    title.className = "insight-title";
    title.textContent = typeKey === "strength" ? "Strength Days" : "Hypertrophy Days";

    const list = document.createElement("div");
    list.className = "insight-list";
    const rows = [
      { label: "Logged Sets", value: `${data.loggedSets}` },
      { label: "Average Load", value: formatWeight(data.avgLoad) }
    ];
    rows.forEach((rowData) => {
      const row = document.createElement("div");
      row.className = "insight-row";
      const label = document.createElement("strong");
      label.textContent = rowData.label;
      const value = document.createElement("span");
      value.textContent = rowData.value;
      row.append(label, value);
      list.appendChild(row);
    });

    card.append(title, list);
    el.appendChild(card);
  });
}

function renderNoteInsights(analysisData) {
  const el = document.getElementById("notesInsights");
  if (!el) return;
  el.innerHTML = "";

  const frequencyCard = document.createElement("article");
  frequencyCard.className = "note-insight-card";
  const freqTitle = document.createElement("div");
  freqTitle.className = "insight-title";
  freqTitle.textContent = "Keyword Frequency";
  frequencyCard.appendChild(freqTitle);

  if (!analysisData.noteInsights.keywordCounts.length) {
    frequencyCard.appendChild(createEmptyText("No note keywords found yet."));
  } else {
    const list = document.createElement("div");
    list.className = "insight-list";
    analysisData.noteInsights.keywordCounts.slice(0, 5).forEach(([keyword, count]) => {
      const row = document.createElement("div");
      row.className = "insight-row";
      const name = document.createElement("strong");
      name.textContent = keyword.toUpperCase();
      const value = document.createElement("span");
      value.textContent = `${count}`;
      row.append(name, value);
      list.appendChild(row);
    });
    frequencyCard.appendChild(list);
  }
  el.appendChild(frequencyCard);

  const flagsCard = document.createElement("article");
  flagsCard.className = "note-insight-card";
  const flagsTitle = document.createElement("div");
  flagsTitle.className = "insight-title";
  flagsTitle.textContent = "Recent Risk Flags";
  flagsCard.appendChild(flagsTitle);

  if (!analysisData.noteInsights.recentFlags.length) {
    flagsCard.appendChild(createEmptyText("No recent pain/fatigue flags in notes."));
  } else {
    const list = document.createElement("div");
    list.className = "insight-list";
    analysisData.noteInsights.recentFlags.forEach((flag) => {
      const row = document.createElement("div");
      row.className = "insight-row";
      const name = document.createElement("strong");
      name.textContent = `${flag.keyword.toUpperCase()} WK ${flag.week}`;
      const value = document.createElement("span");
      value.textContent = flag.exercise;
      row.append(name, value);
      list.appendChild(row);
    });
    flagsCard.appendChild(list);
  }
  el.appendChild(flagsCard);
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

  if (!dayGroups.size) {
    dayEl.appendChild(createEmptyText("No exercise rows match the current filters. Try disabling Notes Only or broadening split/phase filters."));
    return;
  }

  dayGroups.forEach((entries, dayIdx) => {
    const colorMap = createDayColorMap(entries);
    const card = document.createElement("article");
    card.className = "day-progress-card";

    const head = document.createElement("div");
    const dayInfo = weekData[1].days[dayIdx];
    head.className = `day-progress-head ${dayInfo.type}`;

    const headTop = document.createElement("div");
    headTop.className = "day-progress-head-top";

    const title = document.createElement("div");
    title.className = "day-progress-title";
    title.textContent = dayInfo.name.toUpperCase();

    const trendBtn = document.createElement("button");
    trendBtn.type = "button";
    trendBtn.className = "day-trend-btn";
    trendBtn.textContent = "VIEW TREND";
    trendBtn.addEventListener("click", () => openDayTrendModal(dayInfo, entries));

    const type = document.createElement("div");
    type.className = "day-progress-type";
    type.textContent = dayInfo.type === "strength" ? "STRENGTH FOCUS" : "HYPERTROPHY FOCUS";

    headTop.append(title, trendBtn);
    head.append(headTop, type);
    card.appendChild(head);

    let dayHasData = false;
    entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "exercise-row";
      row.addEventListener("click", () => openExerciseDetailDialog(entry));

      const name = document.createElement("div");
      name.className = "exercise-name";
      const color = colorMap.get(entry.key) || EXERCISE_COLOR_PALETTE[0];

      const legendDot = document.createElement("span");
      legendDot.className = "exercise-legend-dot";
      legendDot.style.backgroundColor = color;

      const nameText = document.createElement("span");
      nameText.className = "exercise-name-text";
      const names = [...entry.names];
      nameText.textContent = names.length === 1 ? names[0] : names.join(" / ");
      nameText.style.color = color;
      name.append(legendDot, nameText);

      if (entry.pr) {
        const badge = document.createElement("span");
        badge.className = "exercise-pr-badge";
        badge.textContent = entry.pr.lastPrWeek === 12 ? "NEW PR" : `PR x${entry.pr.count}`;
        name.appendChild(badge);
      }

      const overallAvg = average(entry.values);
      const week1Avg = average(entry.weeklyValues[0]);
      const week12Avg = average(entry.weeklyValues[11]);
      const delta = week1Avg !== null && week12Avg !== null ? week12Avg - week1Avg : null;

      if (overallAvg !== null) {
        dayHasData = true;
      }

      const meta = document.createElement("div");
      meta.className = "exercise-meta";
      const baseMeta = `Avg ${formatWeight(overallAvg)} | W1 ${formatWeight(week1Avg)} | W12 ${formatWeight(week12Avg)} | Delta ${formatDelta(delta)}`;
      if (entry.pr) {
        const prMeta = ` | Best ${formatWeight(entry.pr.best)} (WK ${entry.pr.bestWeek})`;
        meta.textContent = `${baseMeta}${prMeta}`;
      } else {
        meta.textContent = baseMeta;
      }

      row.append(name, meta);

      const latestRpe = getLatestNonEmpty(entry.weeklyRpe, (value) => value !== null);
      const latestNote = getLatestNonEmpty(entry.weeklyNotes, (value) => value.trim() !== "");
      if (latestRpe || latestNote) {
        const noteLine = document.createElement("div");
        noteLine.className = "exercise-note-line";
        const parts = [];
        if (latestRpe) parts.push(`RPE ${latestRpe.value.toFixed(1)} (WK ${latestRpe.week})`);
        if (latestNote) parts.push(`Note: ${latestNote.value} (WK ${latestNote.week})`);
        noteLine.textContent = parts.join(" | ");
        row.appendChild(noteLine);
      }

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

function wireFilterControls() {
  const dayTypeSelect = document.getElementById("dayTypeFilter");
  const phaseSelect = document.getElementById("phaseFilter");
  const notesOnlyInput = document.getElementById("notesOnlyFilter");
  if (!dayTypeSelect || !phaseSelect || !notesOnlyInput) return;

  dayTypeSelect.value = activeFilters.dayType;
  phaseSelect.value = activeFilters.phase;
  notesOnlyInput.checked = activeFilters.notesOnly;

  dayTypeSelect.addEventListener("change", () => {
    activeFilters = {
      ...activeFilters,
      dayType: dayTypeSelect.value
    };
    renderAll();
  });

  phaseSelect.addEventListener("change", () => {
    activeFilters = {
      ...activeFilters,
      phase: phaseSelect.value
    };
    renderAll();
  });

  notesOnlyInput.addEventListener("change", () => {
    activeFilters = {
      ...activeFilters,
      notesOnly: notesOnlyInput.checked
    };
    renderAll();
  });
}

function renderNotesOnlyCount(analysisData) {
  const countEl = document.getElementById("notesOnlyCount");
  if (!countEl) return;

  if (activeFilters.notesOnly) {
    countEl.textContent = `${analysisData.exercises.length}`;
  } else {
    countEl.textContent = `${analysisData.notesEligibleCount}`;
  }
}

function renderAll() {
  const analysisData = collectAnalysisData();
  renderNotesOnlyCount(analysisData);
  renderSummary(analysisData);
  renderReadiness(analysisData);
  renderPrSummary(analysisData);
  renderWeeklyAverages(analysisData);
  renderCompletion(analysisData);
  renderDeltaHeatmap(analysisData);
  renderMovers(analysisData);
  renderStreaks(analysisData);
  renderVolumeProxy(analysisData);
  renderNoteInsights(analysisData);
  renderExerciseProgress(analysisData);
}

async function init() {
  setSyncStatusHandler(updateStatusUi);
  wirePinDialog(renderAll);
  wireDayTrendDialog();
  wireExerciseDetailDialog();
  wireFilterControls();
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
