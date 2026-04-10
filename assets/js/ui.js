import { getWorkoutData, saveWorkoutData } from "./storage.js";

function getSetCount(setText) {
  const match = setText.match(/^\s*(\d+)/);
  if (!match) {
    return 1;
  }
  return Number.parseInt(match[1], 10);
}

function createDayCard(day, weekNum, dayIdx) {
  const dayCard = document.createElement("div");
  dayCard.className = "day-card";

  const dayHeader = document.createElement("button");
  dayHeader.className = "day-header";
  dayHeader.type = "button";
  dayHeader.setAttribute("aria-expanded", "false");
  dayHeader.addEventListener("click", () => {
    dayCard.classList.toggle("expanded");
    dayHeader.setAttribute("aria-expanded", String(dayCard.classList.contains("expanded")));
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
      label.textContent = `Set ${setNum}`;

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

    exDiv.append(exName, exMeta, weightInputs);
    dayContent.appendChild(exDiv);
  });

  dayCard.append(dayHeader, dayContent);
  return dayCard;
}

function showWeek(weekNum) {
  document.querySelectorAll(".week-content").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".week-btn").forEach((el) => el.classList.remove("active"));
  document.getElementById(`week-${weekNum}`)?.classList.add("active");
  document.querySelector(`.week-btn[data-week="${weekNum}"]`)?.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProgram(weekData) {
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
}

export { renderProgram, showWeek };
