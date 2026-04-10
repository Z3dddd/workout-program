const buildStorageKey = (week, day, exercise, setNum) => `w${week}_d${day}_e${exercise}_s${setNum}`;

function saveWorkoutData(week, day, exercise, setNum, value) {
  const key = buildStorageKey(week, day, exercise, setNum);
  if (value.trim() === "") {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value);
  }
}

function getWorkoutData(week, day, exercise, setNum) {
  const key = buildStorageKey(week, day, exercise, setNum);
  return localStorage.getItem(key) || "";
}

export { getWorkoutData, saveWorkoutData };
