import {
  getCardioCurrentStreak,
  getCardioDay,
  getCardioTotals,
  getExerciseNote,
  getExerciseRpe,
  isCardioDayLogged,
  getWorkoutData,
  saveCardioDay,
  saveExerciseNote,
  saveExerciseRpe,
  saveWorkoutData
} from "./storage.js";

let activeWeekNum = 1;
let activeDayNum = 1;
let weekPhaseMap = {};
let cardioBound = false;

function getSetCount(setText) {
  const match = setText.match(/^\s*(\d+)/);
  if (!match) {
    return 1;
  }
  return Number.parseInt(match[1], 10);
}

function parseInputNumber(value, allowDecimal = false) {
  const normalized = String(value).replace(",", ".").trim();
  if (!normalized) return 0;
  const parsed = allowDecimal ? Number.parseFloat(normalized) : Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatWhole(value) {
  return Number.isFinite(value) && value > 0 ? String(Math.round(value)) : "";
}

function formatDistance(value) {
  return Number.isFinite(value) && value > 0 ? value.toFixed(1) : "";
}

function getCardioInputs() {
  return {
    contextLabel: document.getElementById("cardioContextLabel"),
    streakLabel: document.getElementById("cardioStreak"),
    stairMinutes: document.getElementById("cardioStairMinutes"),
    treadmillMinutes: document.getElementById("cardioTreadmillMinutes"),
    stairsClimbed: document.getElementById("cardioStairsClimbed"),
    treadmillDistance: document.getElementById("cardioTreadmillDistance"),
    totalMinutesAll: document.getElementById("cardioTotalMinutesAll"),
    stairMinutesAll: document.getElementById("cardioStairMinutesAll"),
    stairsAll: document.getElementById("cardioStairsAll"),
    distanceAll: document.getElementById("cardioDistanceAll"),
    copyPrevBtn: document.getElementById("cardioCopyPrevBtn"),
    copyStatus: document.getElementById("cardioCopyStatus")
  };
}

function computePreviousDay(week, day) {
  if (day > 1) return { week, day: day - 1 };
  if (week > 1) return { week: week - 1, day: 6 };
  return null;
}

function updateCardioTotalsView() {
  const els = getCardioInputs();
  if (!els.totalMinutesAll || !els.stairMinutesAll || !els.stairsAll || !els.distanceAll || !els.streakLabel) return;

  const totals = getCardioTotals();
  els.totalMinutesAll.textContent = `${Math.round(totals.totalMinutes)}`;
  els.stairMinutesAll.textContent = `${Math.round(totals.stairMinutes)}`;
  els.stairsAll.textContent = `${Math.round(totals.stairsClimbed)}`;
  els.distanceAll.textContent = `${totals.treadmillDistance.toFixed(1)} mi`;
  els.streakLabel.textContent = `Streak: ${getCardioCurrentStreak()} days`;
}

function updateCardioDayView() {
  const els = getCardioInputs();
  if (!els.stairMinutes || !els.treadmillMinutes || !els.stairsClimbed || !els.treadmillDistance) return;

  const dayData = getCardioDay(activeWeekNum, activeDayNum);
  els.stairMinutes.value = formatWhole(dayData.stairMinutes);
  els.treadmillMinutes.value = formatWhole(dayData.treadmillMinutes);
  els.stairsClimbed.value = formatWhole(dayData.stairsClimbed);
  els.treadmillDistance.value = formatDistance(dayData.treadmillDistance);
  if (els.contextLabel) {
    els.contextLabel.textContent = `W${activeWeekNum} D${activeDayNum} · ${Math.round(dayData.totalMinutes)}m`;
  }
  if (els.copyStatus) {
    els.copyStatus.textContent = "";
  }
}

function persistCardioFromInputs() {
  const els = getCardioInputs();
  if (!els.stairMinutes || !els.treadmillMinutes || !els.stairsClimbed || !els.treadmillDistance) return;

  const stairMinutes = parseInputNumber(els.stairMinutes.value);
  const treadmillMinutes = parseInputNumber(els.treadmillMinutes.value);
  const stairsClimbed = parseInputNumber(els.stairsClimbed.value);
  const treadmillDistance = parseInputNumber(els.treadmillDistance.value, true);
  const totalMinutes = stairMinutes + treadmillMinutes;
  if (els.contextLabel) {
    els.contextLabel.textContent = `W${activeWeekNum} D${activeDayNum} · ${Math.round(totalMinutes)}m`;
  }

  saveCardioDay(activeWeekNum, activeDayNum, {
    stairMinutes,
    treadmillMinutes,
    totalMinutes,
    stairsClimbed,
    treadmillDistance
  });
  updateCardioTotalsView();
}

function initCardioTracker() {
  if (cardioBound) return;
  const els = getCardioInputs();
  if (!els.stairMinutes || !els.treadmillMinutes || !els.stairsClimbed || !els.treadmillDistance || !els.copyPrevBtn) return;

  const onInput = () => persistCardioFromInputs();
  els.stairMinutes.addEventListener("input", onInput);
  els.treadmillMinutes.addEventListener("input", onInput);
  els.stairsClimbed.addEventListener("input", onInput);
  els.treadmillDistance.addEventListener("input", onInput);

  els.copyPrevBtn.addEventListener("click", () => {
    const prev = computePreviousDay(activeWeekNum, activeDayNum);
    if (!prev) {
      if (els.copyStatus) els.copyStatus.textContent = "No previous day available.";
      return;
    }

    const prevData = getCardioDay(prev.week, prev.day);
    if (!isCardioDayLogged(prevData)) {
      if (els.copyStatus) els.copyStatus.textContent = `No cardio logged for WK ${prev.week} DAY ${prev.day}.`;
      return;
    }

    els.stairMinutes.value = formatWhole(prevData.stairMinutes);
    els.treadmillMinutes.value = formatWhole(prevData.treadmillMinutes);
    els.stairsClimbed.value = formatWhole(prevData.stairsClimbed);
    els.treadmillDistance.value = formatDistance(prevData.treadmillDistance);
    persistCardioFromInputs();
    if (els.copyStatus) els.copyStatus.textContent = `Copied WK ${prev.week} DAY ${prev.day}.`;
  });

  cardioBound = true;
  updateCardioDayView();
  updateCardioTotalsView();
}

function createDayCard(day, weekNum, dayIdx) {
  const dayCard = document.createElement("div");
  dayCard.className = "day-card";
  dayCard.id = `week-${weekNum}-day-${dayIdx + 1}`;
  dayCard.dataset.dayIndex = String(dayIdx + 1);

  const dayHeader = document.createElement("button");
  dayHeader.className = "day-header";
  dayHeader.type = "button";
  dayHeader.setAttribute("aria-expanded", "false");
  dayHeader.addEventListener("click", () => {
    dayCard.classList.toggle("expanded");
    const isExpanded = dayCard.classList.contains("expanded");
    dayHeader.setAttribute("aria-expanded", String(isExpanded));
    updateDayTabActiveState(isExpanded ? dayIdx + 1 : 0);
    if (isExpanded) {
      activeDayNum = dayIdx + 1;
      updateCardioDayView();
    }
  });

  const dayTitleWrap = document.createElement("div");
  dayTitleWrap.className = "day-title-wrap";

  const dayBadge = document.createElement("div");
  dayBadge.className = `day-badge ${day.type}`;
  dayBadge.textContent = day.type === "strength" ? "STRENGTH" : "HYPERTROPHY";

  const dayTitle = document.createElement("div");
  dayTitle.className = "day-title";
  dayTitle.textContent = day.name;

  dayTitleWrap.append(dayBadge, dayTitle);

  const expandIcon = document.createElement("div");
  expandIcon.className = "expand-icon";
  expandIcon.textContent = "▼";

  dayHeader.append(dayTitleWrap, expandIcon);

  const dayContent = document.createElement("div");
  dayContent.className = "day-content";

  day.exercises.forEach((exercise, exIdx) => {
    const exDiv = document.createElement("div");
    exDiv.className = "exercise";

    const exName = document.createElement("div");
    exName.className = "ex-name";
    if (exercise.highlight === "foundation") exName.classList.add("highlight");
    if (exercise.highlight === "ramping") exName.classList.add("ramp-highlight");
    exName.textContent = exercise.name;

    const exMeta = document.createElement("div");
    exMeta.className = "ex-meta";

    const exSets = document.createElement("span");
    exSets.className = "ex-sets";
    exSets.textContent = exercise.sets;

    const exRpe = document.createElement("span");
    exRpe.className = exercise.rpe10 ? "ex-rpe rpe-10" : "ex-rpe";
    exRpe.textContent = exercise.rpe;
    exMeta.append(exSets, exRpe);

    const weightInputs = document.createElement("div");
    weightInputs.className = "weight-inputs";

    const setCount = getSetCount(exercise.sets);
    for (let setNum = 1; setNum <= setCount; setNum += 1) {
      const inputWrap = document.createElement("div");
      inputWrap.className = "weight-input-wrap";

      const label = document.createElement("div");
      label.className = "weight-label";
      label.textContent = `Set ${setNum} (lb)`;

      const input = document.createElement("input");
      input.className = "weight-input";
      input.type = "text";
      input.inputMode = "decimal";
      input.placeholder = "-";
      input.dataset.week = String(weekNum);
      input.dataset.day = String(dayIdx);
      input.dataset.exercise = String(exIdx);
      input.dataset.set = String(setNum);

      const saved = getWorkoutData(weekNum, dayIdx, exIdx, setNum);
      if (saved) {
        input.value = saved;
      }

      input.addEventListener("input", (event) => {
        saveWorkoutData(weekNum, dayIdx, exIdx, setNum, event.target.value);
      });

      inputWrap.append(label, input);
      weightInputs.appendChild(inputWrap);
    }

    const logWrap = document.createElement("div");
    logWrap.className = "exercise-log-wrap";

    const rpeWrap = document.createElement("label");
    rpeWrap.className = "exercise-rpe-wrap";
    rpeWrap.textContent = "Session RPE";

    const rpeInput = document.createElement("input");
    rpeInput.className = "exercise-rpe-input";
    rpeInput.type = "text";
    rpeInput.inputMode = "decimal";
    rpeInput.placeholder = "e.g. 8.5";
    rpeInput.maxLength = 4;
    rpeInput.value = getExerciseRpe(weekNum, dayIdx, exIdx);
    rpeInput.addEventListener("change", (event) => {
      saveExerciseRpe(weekNum, dayIdx, exIdx, event.target.value);
    });
    rpeWrap.appendChild(rpeInput);

    const noteWrap = document.createElement("label");
    noteWrap.className = "exercise-note-wrap";
    noteWrap.textContent = "Week Note";

    const noteInput = document.createElement("textarea");
    noteInput.className = "exercise-note-input";
    noteInput.rows = 2;
    noteInput.maxLength = 200;
    noteInput.placeholder = "Optional: felt easy, elbow pain, form cues...";
    noteInput.value = getExerciseNote(weekNum, dayIdx, exIdx);
    noteInput.addEventListener("change", (event) => {
      saveExerciseNote(weekNum, dayIdx, exIdx, event.target.value);
    });
    noteWrap.appendChild(noteInput);

    logWrap.append(rpeWrap, noteWrap);
    exDiv.append(exName, exMeta, weightInputs, logWrap);
    dayContent.appendChild(exDiv);
  });

  dayCard.append(dayHeader, dayContent);
  return dayCard;
}

function getDayTabType(day) {
  return day.type === "strength" ? "strength" : "hypertrophy";
}

function updateDayTabActiveState(dayNum) {
  document.querySelectorAll(".day-tab").forEach((tab) => {
    const isActive = tab.dataset.day === String(dayNum);
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });
}

function showDay(dayNum) {
  const activeWeekEl = document.getElementById(`week-${activeWeekNum}`);
  if (!activeWeekEl) return;
  activeDayNum = dayNum;

  const dayCards = activeWeekEl.querySelectorAll(".day-card");
  dayCards.forEach((card) => {
    const header = card.querySelector(".day-header");
    const isTarget = card.dataset.dayIndex === String(dayNum);
    card.classList.toggle("expanded", isTarget);
    if (header) header.setAttribute("aria-expanded", String(isTarget));
  });

  updateDayTabActiveState(dayNum);

  const targetCard = document.getElementById(`week-${activeWeekNum}-day-${dayNum}`);
  if (targetCard) {
    targetCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  updateCardioDayView();
}

function renderDayTabs(weekData) {
  const dayTabsEl = document.getElementById("dayTabs");
  if (!dayTabsEl) return;

  const dayTemplate = weekData[1].days;
  dayTemplate.forEach((day, idx) => {
    const dayNum = idx + 1;
    const [, dayLabel] = day.name.split(" - ");
    const isStrength = getDayTabType(day) === "strength";

    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = `day-tab ${isStrength ? "strength" : "hypertrophy"}`;
    tab.dataset.day = String(dayNum);
    tab.setAttribute("aria-pressed", "false");

    const top = document.createElement("span");
    top.className = "day-tab-top";
    top.textContent = `DAY ${dayNum}`;

    const mid = document.createElement("span");
    mid.className = "day-tab-mid";
    mid.textContent = dayLabel ? dayLabel.toUpperCase() : day.name.toUpperCase();

    const bottom = document.createElement("span");
    bottom.className = "day-tab-bottom";
    bottom.textContent = isStrength ? "STRENGTH" : "HYPERTROPHY";

    tab.append(top, mid, bottom);
    tab.addEventListener("click", () => showDay(dayNum));
    dayTabsEl.appendChild(tab);
  });
}

function showWeek(weekNum) {
  activeWeekNum = weekNum;
  activeDayNum = Math.min(Math.max(activeDayNum, 1), 6);
  document.querySelectorAll(".week-content").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".week-btn").forEach((el) => el.classList.remove("active"));
  document.getElementById(`week-${weekNum}`)?.classList.add("active");
  document.querySelector(`.week-btn[data-week="${weekNum}"]`)?.classList.add("active");
  updateDayTabActiveState(0);

  const foundationInfoEl = document.getElementById("foundationWeekInfo");
  const rampingInfoEl = document.getElementById("rampingWeekInfo");
  if (foundationInfoEl) {
    const isFoundation = weekPhaseMap[weekNum] === "foundation";
    const isRamping = weekPhaseMap[weekNum] === "ramping";
    foundationInfoEl.hidden = !isFoundation;
    if (rampingInfoEl) {
      rampingInfoEl.hidden = !isRamping;
    }
  } else if (rampingInfoEl) {
    const isRamping = weekPhaseMap[weekNum] === "ramping";
    rampingInfoEl.hidden = !isRamping;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  updateCardioDayView();
  updateCardioTotalsView();
}

function renderProgram(weekData) {
  weekPhaseMap = {};
  for (let i = 1; i <= 12; i += 1) {
    weekPhaseMap[i] = weekData[i].phase;
  }

  renderDayTabs(weekData);

  const weekButtonsEl = document.getElementById("weekButtons");
  const weekContainer = document.getElementById("weekContainer");

  for (let i = 1; i <= 12; i += 1) {
    const btn = document.createElement("button");
    btn.className = `week-btn ${weekData[i].phase}`;
    btn.textContent = `WK ${i}`;
    btn.dataset.week = String(i);
    btn.type = "button";
    btn.addEventListener("click", () => showWeek(i));
    weekButtonsEl.appendChild(btn);
  }

  for (let weekNum = 1; weekNum <= 12; weekNum += 1) {
    const week = weekData[weekNum];
    const weekDiv = document.createElement("div");
    weekDiv.className = "week-content";
    weekDiv.id = `week-${weekNum}`;

    const phaseTag = document.createElement("div");
    phaseTag.className = `phase-tag ${week.phase}`;
    phaseTag.textContent = week.label
      ? `${week.phase.toUpperCase()} BLOCK · ${week.label}`
      : `${week.phase.toUpperCase()} BLOCK · WEEK ${weekNum}`;

    weekDiv.appendChild(phaseTag);
    week.days.forEach((day, dayIdx) => {
      weekDiv.appendChild(createDayCard(day, weekNum, dayIdx));
    });

    weekContainer.appendChild(weekDiv);
  }

  initCardioTracker();
}

export { renderProgram, showWeek };
