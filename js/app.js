// app.js — Main app controller, view routing, DOM wiring
import Timer, { Phase } from './timer.js';
import Audio from './audio.js';
import presets from './presets.js';
import Storage from './storage.js';

let currentView = 'home';
let activeTimer = null;
let wakeLock = null;
let editingWorkout = null; // null = new, object = editing

// ---------- View Routing ----------
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById(`view-${name}`);
  if (el) el.classList.add('active');
  currentView = name;
}

// ---------- Home View ----------
function renderHome() {
  const presetList = document.getElementById('preset-list');
  const customList = document.getElementById('custom-list');
  const customSection = document.getElementById('custom-section');

  presetList.innerHTML = presets.map(p => workoutCard(p, false)).join('');
  const customs = Storage.getAll();
  if (customs.length > 0) {
    customSection.style.display = 'block';
    customList.innerHTML = customs.map(w => workoutCard(w, true)).join('');
  } else {
    customSection.style.display = 'none';
  }
  showView('home');
}

function workoutCard(w, isCustom) {
  const actions = isCustom
    ? `<div class="card-actions">
        <button onclick="event.stopPropagation(); app.editWorkout('${w.id}')" title="Edit">&#9998;</button>
        <button onclick="event.stopPropagation(); app.deleteWorkout('${w.id}')" title="Delete">&times;</button>
       </div>`
    : '';
  return `
    <div class="workout-card" onclick="app.openSetup('${w.id}', ${isCustom})">
      ${actions}
      <h3>${esc(w.name)}</h3>
      <p>${esc(w.description || '')}</p>
      <div class="meta">
        <span>${w.workTime}s work</span>
        <span>${w.restTime}s rest</span>
        <span>${w.rounds} rounds</span>
      </div>
    </div>`;
}

// ---------- Setup View ----------
function openSetup(id, isCustom) {
  const workout = isCustom
    ? Storage.getAll().find(w => w.id === id)
    : presets.find(p => p.id === id);
  if (!workout) return;

  document.getElementById('setup-title').textContent = workout.name;
  document.getElementById('setup-work').value = workout.workTime;
  document.getElementById('setup-rest').value = workout.restTime;
  document.getElementById('setup-rounds').value = workout.rounds;

  const exerciseContainer = document.getElementById('setup-exercises');
  exerciseContainer.innerHTML = workout.exercises.map((ex, i) => `
    <div class="exercise-item">
      <span class="num">${i + 1}</span>
      <span>${esc(ex)}</span>
    </div>
  `).join('');

  document.getElementById('setup-start-btn').onclick = () => {
    const workTime = parseInt(document.getElementById('setup-work').value) || 20;
    const restTime = parseInt(document.getElementById('setup-rest').value) || 10;
    const rounds = parseInt(document.getElementById('setup-rounds').value) || 8;
    startTimer({ ...workout, workTime, restTime, rounds });
  };

  showView('setup');
}

// ---------- Create / Edit Workout ----------
function openEditor(workout) {
  editingWorkout = workout || null;
  document.getElementById('editor-title').textContent = workout ? 'Edit Workout' : 'Create Workout';
  document.getElementById('edit-name').value = workout ? workout.name : '';
  document.getElementById('edit-desc').value = workout ? (workout.description || '') : '';
  document.getElementById('edit-work').value = workout ? workout.workTime : 20;
  document.getElementById('edit-rest').value = workout ? workout.restTime : 10;
  document.getElementById('edit-rounds').value = workout ? workout.rounds : 8;

  const exercises = workout ? [...workout.exercises] : [''];
  renderEditorExercises(exercises);
  showView('editor');
}

function renderEditorExercises(exercises) {
  const container = document.getElementById('edit-exercises');
  container.innerHTML = exercises.map((ex, i) => `
    <div class="exercise-item">
      <span class="num">${i + 1}</span>
      <input type="text" value="${esc(ex)}" placeholder="Exercise name" data-idx="${i}" />
      <button class="remove-exercise" onclick="app.removeExercise(${i})">&times;</button>
    </div>
  `).join('') + `
    <button class="add-exercise-btn" onclick="app.addExercise()">+ Add Exercise</button>
  `;
}

function getEditorExercises() {
  return Array.from(document.querySelectorAll('#edit-exercises input'))
    .map(input => input.value.trim())
    .filter(v => v);
}

function addExercise() {
  const exercises = getEditorExercises();
  exercises.push('');
  renderEditorExercises(exercises);
  const inputs = document.querySelectorAll('#edit-exercises input');
  inputs[inputs.length - 1]?.focus();
}

function removeExercise(idx) {
  const exercises = getEditorExercises();
  exercises.splice(idx, 1);
  if (exercises.length === 0) exercises.push('');
  renderEditorExercises(exercises);
}

function saveWorkout() {
  const name = document.getElementById('edit-name').value.trim();
  if (!name) { document.getElementById('edit-name').focus(); return; }

  const workout = {
    id: editingWorkout?.id || null,
    name,
    description: document.getElementById('edit-desc').value.trim(),
    workTime: parseInt(document.getElementById('edit-work').value) || 20,
    restTime: parseInt(document.getElementById('edit-rest').value) || 10,
    rounds: parseInt(document.getElementById('edit-rounds').value) || 8,
    exercises: getEditorExercises()
  };

  Storage.save(workout);
  renderHome();
}

function editWorkout(id) {
  const workout = Storage.getAll().find(w => w.id === id);
  if (workout) openEditor(workout);
}

function deleteWorkout(id) {
  if (confirm('Delete this workout?')) {
    Storage.remove(id);
    renderHome();
  }
}

// ---------- Timer ----------
async function startTimer(workout) {
  Audio.unlock();
  await requestWakeLock();

  showView('timer');
  const timerView = document.getElementById('view-timer');
  const display = document.getElementById('timer-time');
  const phaseLabel = document.getElementById('timer-phase-label');
  const exerciseLabel = document.getElementById('timer-exercise-name');
  const roundLabel = document.getElementById('timer-round-label');
  const progress = document.getElementById('timer-progress');
  const pauseBtn = document.getElementById('timer-pause-btn');

  // Build progress dots
  progress.innerHTML = Array.from({ length: workout.rounds }, (_, i) =>
    `<div class="dot" data-round="${i + 1}"></div>`
  ).join('');

  activeTimer = new Timer({
    workTime: workout.workTime,
    restTime: workout.restTime,
    rounds: workout.rounds,
    exercises: workout.exercises,
    onTick(t) {
      display.textContent = t.secondsLeft;
      // Update dots
      progress.querySelectorAll('.dot').forEach(dot => {
        const r = parseInt(dot.dataset.round);
        dot.className = 'dot';
        if (r < t.currentRound) dot.classList.add('done');
        else if (r === t.currentRound) dot.classList.add('current');
      });
    },
    onPhaseChange(phase, t) {
      // Update classes
      timerView.className = 'view active timer-view phase-' + phase;

      switch (phase) {
        case Phase.COUNTDOWN:
          phaseLabel.textContent = 'Get Ready';
          exerciseLabel.textContent = workout.exercises[0] || '';
          roundLabel.textContent = '';
          Audio.tick();
          break;
        case Phase.WORK:
          phaseLabel.textContent = 'Work';
          exerciseLabel.textContent = t.currentExercise;
          roundLabel.textContent = `Round ${t.currentRound} / ${t.totalRounds}`;
          Audio.work();
          break;
        case Phase.REST:
          phaseLabel.textContent = 'Rest';
          exerciseLabel.textContent = 'Next: ' + (workout.exercises[t.currentRound % workout.exercises.length] || '');
          roundLabel.textContent = `Round ${t.currentRound} / ${t.totalRounds}`;
          Audio.rest();
          break;
        case Phase.DONE:
          phaseLabel.textContent = 'Done!';
          display.textContent = '0';
          exerciseLabel.textContent = 'Great workout!';
          roundLabel.textContent = '';
          pauseBtn.style.display = 'none';
          Audio.complete();
          progress.querySelectorAll('.dot').forEach(d => d.classList.add('done'));
          releaseWakeLock();
          break;
      }

      // Countdown beeps
      if (phase === Phase.COUNTDOWN) {
        const tickInterval = setInterval(() => {
          if (activeTimer && activeTimer.phase === Phase.COUNTDOWN && activeTimer.secondsLeft > 0) {
            Audio.tick();
          } else {
            clearInterval(tickInterval);
          }
        }, 1000);
      }
    },
    onComplete() {}
  });

  pauseBtn.textContent = 'Pause';
  pauseBtn.className = 'timer-btn pause';
  pauseBtn.style.display = '';
  pauseBtn.onclick = () => togglePause(pauseBtn);

  activeTimer.start();
}

function togglePause(btn) {
  if (!activeTimer) return;
  if (activeTimer.paused) {
    activeTimer.resume();
    btn.textContent = 'Pause';
    btn.className = 'timer-btn pause';
  } else {
    activeTimer.pause();
    btn.textContent = 'Resume';
    btn.className = 'timer-btn resume';
  }
}

function stopTimer() {
  if (activeTimer) {
    activeTimer.stop();
    activeTimer = null;
  }
  releaseWakeLock();
  renderHome();
}

// ---------- Wake Lock ----------
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch { /* Wake Lock not supported or denied */ }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

// Re-acquire wake lock when page becomes visible again
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && activeTimer && !activeTimer.paused) {
    requestWakeLock();
  }
});

// ---------- Helpers ----------
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Public API (exposed to window for onclick handlers) ----------
window.app = {
  openSetup,
  editWorkout,
  deleteWorkout,
  removeExercise,
  addExercise,
  openEditor,
  saveWorkout,
  stopTimer,
  goHome: renderHome,
};

// ---------- Init ----------
renderHome();
