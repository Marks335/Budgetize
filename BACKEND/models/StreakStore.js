// ============================================================
//  models/StreakStore.js  —  Daily Budget Streak Tracker
// ============================================================
const fs   = require("fs");
const path = require("path");

const STREAK_FILE = path.join(__dirname, "..", "database", "streak.json");

const DEFAULTS = {
  currentStreak: 0,
  lastCheckedDate: null,
  todayPassed: false,
  history: [],   // array of { date, passed }
};

class StreakStore {
  constructor() {
    this._ensureFile();
    this.data = this._load();
  }

  _ensureFile() {
    if (!fs.existsSync(STREAK_FILE)) {
      fs.writeFileSync(STREAK_FILE, JSON.stringify(DEFAULTS, null, 2));
    }
  }

  _load() {
    try {
      return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(STREAK_FILE, "utf-8")) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  _save() {
    fs.writeFileSync(STREAK_FILE, JSON.stringify(this.data, null, 2));
  }

  todayStr() {
    return new Date().toISOString().split("T")[0];
  }

  // Call this on every summary load — checks if user stayed under budget today
  evaluate(todayTotal, dailyLimit) {
    const today = this.todayStr();

    // If we've already evaluated today, just return current state
    if (this.data.lastCheckedDate === today) {
      return this.getState();
    }

    // A new day — check if yesterday passed
    if (this.data.lastCheckedDate && this.data.lastCheckedDate !== today) {
      // Yesterday: was it a pass? We stored todayPassed at end of that day
      if (this.data.todayPassed) {
        this.data.currentStreak += 1;
      } else {
        this.data.currentStreak = 0;
      }
      // Record history
      this.data.history = [
        ...(this.data.history || []).slice(-29),
        { date: this.data.lastCheckedDate, passed: this.data.todayPassed },
      ];
    }

    // Evaluate today
    const todayPassed = dailyLimit > 0 && todayTotal <= dailyLimit;
    this.data.todayPassed      = todayPassed;
    this.data.lastCheckedDate  = today;
    this._save();

    return this.getState();
  }

  getState() {
    return {
      currentStreak: this.data.currentStreak,
      todayPassed:   this.data.todayPassed,
      lastCheckedDate: this.data.lastCheckedDate,
      history:       this.data.history || [],
    };
  }
}

module.exports = StreakStore;
