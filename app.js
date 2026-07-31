const PLAN = [
  {
    id: "lower",
    title: "Lower body",
    classes: ["Hot Buns", "Barre None"],
    exercises: [
      { id: "gobletSquat", name: "Goblet squat", target: "3 × 10" },
      { id: "rdl", name: "Romanian deadlift", target: "3 × 10–12" }
    ]
  },
  {
    id: "upper",
    title: "Upper body",
    classes: ["Hot ISO"],
    exercises: [
      { id: "chestPress", name: "Dumbbell chest press", target: "3 × 10" },
      { id: "singleArmRow", name: "Single-arm dumbbell row", target: "3 × 10 each" }
    ]
  },
  {
    id: "conditioning",
    title: "Conditioning",
    classes: ["Hot Blast", "Hot Cycle"],
    exercises: [
      { id: "kettlebellSwing", name: "Kettlebell swings", target: "Optional · 3 × 15" },
      { id: "battleRopes", name: "Battle ropes", target: "Optional · 6 × 30 sec" }
    ]
  },
  {
    id: "functional",
    title: "Core + functional",
    classes: ["Hot Pilates", "Hot Thunder"],
    exercises: [
      { id: "farmerCarry", name: "Farmer carries", target: "3 × 30–45 sec" },
      { id: "curlPress", name: "Curl to overhead press", target: "3 × 10–12" }
    ]
  }
];

const STORAGE_KEY = "danielle-hotworx-v1";

function blankState() {
  return {
    currentWeek: 1,
    weeks: Array.from({ length: 8 }, () => ({
      workouts: {},
      checkin: { weight: "", waist: "", hips: "", oura: "", win: "", focus: "" }
    }))
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : blankState();
  } catch {
    return blankState();
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentWeekData() {
  return state.weeks[state.currentWeek - 1];
}

function getWorkout(id) {
  const week = currentWeekData();
  if (!week.workouts[id]) {
    week.workouts[id] = {
      complete: false,
      selectedClass: "",
      exercises: {},
      difficulty: "",
      energy: "",
      water: "",
      calories: "",
      victory: "",
      increase: false
    };
  }
  return week.workouts[id];
}

function setScreen(name) {
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(el => el.classList.remove("active"));
  document.getElementById(`screen-${name}`).classList.add("active");
  document.querySelector(`[data-screen="${name}"]`).classList.add("active");
}

function renderWeekSelect() {
  const select = document.getElementById("weekSelect");
  select.innerHTML = "";
  for (let i = 1; i <= 8; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Week ${i}`;
    select.appendChild(opt);
  }
  select.value = state.currentWeek;
}

function renderWorkouts() {
  const host = document.getElementById("workoutCards");
  host.innerHTML = "";
  PLAN.forEach((day, index) => {
    const tpl = document.getElementById("workoutTemplate").content.cloneNode(true);
    const card = tpl.querySelector(".workout-card");
    const data = getWorkout(day.id);
    if (data.complete) card.classList.add("completed");

    tpl.querySelector(".workout-number").textContent = `DAY ${index + 1}`;
    tpl.querySelector(".workout-title").textContent = day.title;

    const complete = tpl.querySelector(".day-complete");
    complete.checked = data.complete;
    complete.addEventListener("change", () => {
      data.complete = complete.checked;
      saveState();
      renderAll();
    });

    const classSelect = tpl.querySelector(".class-select");
    classSelect.innerHTML = `<option value="">Choose class</option>` + day.classes.map(c =>
      `<option value="${c}">${c}</option>`).join("");
    classSelect.value = data.selectedClass;
    classSelect.addEventListener("change", () => {
      data.selectedClass = classSelect.value;
      saveState();
    });

    const list = tpl.querySelector(".exercise-list");
    day.exercises.forEach(exercise => {
      const rowTpl = document.getElementById("exerciseTemplate").content.cloneNode(true);
      const exData = data.exercises[exercise.id] || { weight: "", reps: "", done: false };
      data.exercises[exercise.id] = exData;
      rowTpl.querySelector(".exercise-name").textContent = exercise.name;
      rowTpl.querySelector(".exercise-target").textContent = exercise.target;

      const weight = rowTpl.querySelector(".exercise-weight");
      const reps = rowTpl.querySelector(".exercise-reps");
      const done = rowTpl.querySelector(".exercise-done");
      weight.value = exData.weight;
      reps.value = exData.reps;
      done.checked = exData.done;

      weight.addEventListener("input", () => { exData.weight = weight.value; saveState(); renderStrength(); });
      reps.addEventListener("input", () => { exData.reps = reps.value; saveState(); });
      done.addEventListener("change", () => { exData.done = done.checked; saveState(); });
      list.appendChild(rowTpl);
    });

    ["difficulty","energy","water","calories","victory"].forEach(field => {
      const el = tpl.querySelector(`.${field}`);
      el.value = data[field];
      el.addEventListener("input", () => { data[field] = el.value; saveState(); });
    });

    const increase = tpl.querySelector(".increase");
    increase.checked = data.increase;
    increase.addEventListener("change", () => { data.increase = increase.checked; saveState(); });

    host.appendChild(tpl);
  });
}

function renderSummary() {
  let total = 0;
  state.weeks.forEach(week => {
    PLAN.forEach(day => { if (week.workouts[day.id]?.complete) total++; });
  });
  const weekTotal = PLAN.filter(day => currentWeekData().workouts[day.id]?.complete).length;
  const pct = Math.round(total / 32 * 100);

  document.getElementById("totalDone").textContent = `${total}/32`;
  document.getElementById("weekDone").textContent = `${weekTotal}/4`;
  document.getElementById("completionPct").textContent = `${pct}%`;
  document.getElementById("weekBar").style.width = `${weekTotal * 25}%`;
  document.getElementById("weekTitle").textContent = `Week ${state.currentWeek}`;
  document.getElementById("ringWeek").textContent = state.currentWeek;
  document.getElementById("checkinWeekLabel").textContent = `Week ${state.currentWeek}`;
}

function renderStrength() {
  const host = document.getElementById("strengthGrid");
  const allExercises = PLAN.flatMap(day => day.exercises);
  const latest = Object.fromEntries(allExercises.map(ex => [ex.id, { name: ex.name, weight: "" }]));

  state.weeks.forEach(week => {
    PLAN.forEach(day => {
      const workout = week.workouts[day.id];
      if (!workout) return;
      day.exercises.forEach(ex => {
        const w = workout.exercises?.[ex.id]?.weight;
        if (w !== undefined && w !== "") latest[ex.id].weight = w;
      });
    });
  });

  host.innerHTML = Object.values(latest).map(item => `
    <div class="strength-item">
      <span>${item.name}</span>
      <strong>${item.weight ? `${item.weight} lb` : "—"}</strong>
    </div>`).join("");
}

function renderOverview() {
  const host = document.getElementById("weekOverview");
  host.innerHTML = state.weeks.map((week, i) => {
    const done = PLAN.filter(day => week.workouts[day.id]?.complete).length;
    return `
      <div class="overview-row">
        <strong>Week ${i + 1}</strong>
        <div class="overview-bar"><div class="overview-fill" style="width:${done * 25}%"></div></div>
        <span>${done}/4</span>
      </div>`;
  }).join("");
}

function renderCheckin() {
  const c = currentWeekData().checkin;
  ["weight","waist","hips","oura","win","focus"].forEach(id => {
    document.getElementById(id).value = c[id];
  });
}

function renderAll() {
  renderWeekSelect();
  renderWorkouts();
  renderSummary();
  renderStrength();
  renderOverview();
  renderCheckin();
  saveState();
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => setScreen(btn.dataset.screen));
});

document.getElementById("weekSelect").addEventListener("change", e => {
  state.currentWeek = Number(e.target.value);
  renderAll();
});

["weight","waist","hips","oura","win","focus"].forEach(id => {
  document.getElementById(id).addEventListener("input", e => {
    currentWeekData().checkin[id] = e.target.value;
    saveState();
  });
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "danielle-hotworx-backup.json";
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById("status").textContent = "Backup exported.";
});

document.getElementById("importInput").addEventListener("change", e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.weeks)) throw new Error();
      state = imported;
      saveState();
      renderAll();
      document.getElementById("status").textContent = "Backup restored.";
    } catch {
      document.getElementById("status").textContent = "That backup file could not be read.";
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset all eight weeks? Export a backup first if you may need this data.")) return;
  state = blankState();
  saveState();
  renderAll();
  document.getElementById("status").textContent = "All data reset.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

renderAll();
