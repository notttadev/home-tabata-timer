// timer.js — Tabata timer engine with drift-corrected intervals

export const Phase = {
  IDLE: 'idle',
  COUNTDOWN: 'countdown',
  WORK: 'work',
  REST: 'rest',
  DONE: 'done'
};

export default class Timer {
  constructor({ workTime, restTime, rounds, exercises, onTick, onPhaseChange, onComplete }) {
    this.workTime = workTime;
    this.restTime = restTime;
    this.rounds = rounds;
    this.exercises = exercises || [];
    this.onTick = onTick || (() => {});
    this.onPhaseChange = onPhaseChange || (() => {});
    this.onComplete = onComplete || (() => {});

    this.phase = Phase.IDLE;
    this.currentRound = 0;
    this.secondsLeft = 0;
    this.intervalId = null;
    this.targetTime = 0;
    this.paused = false;
    this.pausedSecondsLeft = 0;
  }

  get currentExercise() {
    if (this.exercises.length === 0) return '';
    return this.exercises[(this.currentRound - 1) % this.exercises.length] || '';
  }

  get totalRounds() {
    return this.rounds;
  }

  get progress() {
    if (this.phase === Phase.IDLE) return 0;
    if (this.phase === Phase.DONE) return 1;
    return (this.currentRound - 1) / this.rounds;
  }

  start() {
    this.paused = false;
    this._setPhase(Phase.COUNTDOWN, 3);
  }

  pause() {
    if (this.paused || this.phase === Phase.IDLE || this.phase === Phase.DONE) return;
    this.paused = true;
    this.pausedSecondsLeft = this.secondsLeft;
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this._startCounting(this.pausedSecondsLeft);
  }

  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.phase = Phase.IDLE;
    this.currentRound = 0;
    this.secondsLeft = 0;
    this.paused = false;
  }

  _setPhase(phase, duration) {
    this.phase = phase;
    this.onPhaseChange(phase, this);
    this._startCounting(duration);
  }

  _startCounting(seconds) {
    clearInterval(this.intervalId);
    this.secondsLeft = seconds;
    this.targetTime = Date.now() + seconds * 1000;
    this.onTick(this);

    this.intervalId = setInterval(() => {
      const remaining = Math.round((this.targetTime - Date.now()) / 1000);
      this.secondsLeft = Math.max(0, remaining);
      this.onTick(this);

      if (this.secondsLeft <= 0) {
        clearInterval(this.intervalId);
        this._next();
      }
    }, 250); // check 4x/sec for accuracy
  }

  _next() {
    switch (this.phase) {
      case Phase.COUNTDOWN:
        this.currentRound = 1;
        this._setPhase(Phase.WORK, this.workTime);
        break;

      case Phase.WORK:
        if (this.currentRound >= this.rounds) {
          this.phase = Phase.DONE;
          this.onPhaseChange(Phase.DONE, this);
          this.onComplete(this);
        } else {
          this._setPhase(Phase.REST, this.restTime);
        }
        break;

      case Phase.REST:
        this.currentRound++;
        this._setPhase(Phase.WORK, this.workTime);
        break;
    }
  }
}
