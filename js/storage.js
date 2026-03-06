// storage.js — LocalStorage for custom workouts

const STORAGE_KEY = 'tabata_custom_workouts';

const Storage = {
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },

  save(workout) {
    const all = this.getAll();
    const idx = all.findIndex(w => w.id === workout.id);
    if (idx >= 0) {
      all[idx] = workout;
    } else {
      workout.id = 'custom-' + Date.now();
      all.push(workout);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return workout;
  },

  remove(id) {
    const all = this.getAll().filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  exportJSON() {
    return JSON.stringify(this.getAll(), null, 2);
  },

  importJSON(json) {
    try {
      const data = JSON.parse(json);
      if (!Array.isArray(data)) return false;
      data.forEach(w => {
        w.id = 'custom-' + Date.now() + Math.random().toString(36).slice(2, 6);
        this.save(w);
      });
      return true;
    } catch {
      return false;
    }
  }
};

export default Storage;
