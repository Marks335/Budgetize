const fs   = require("fs");
const path = require("path");

const BUDGET_FILE = path.join(__dirname, "..", "database", "budget.json");

const DEFAULTS = {
  monthly: 800,
  weekly:  200,   // monthly / 4
  daily:   26.67, // monthly / 30
};

class BudgetStore {
  constructor() {
    this._ensureFile();
    this.budget = this._load();
    this._sanitize(); // fix any inconsistencies on startup
  }

  _ensureFile() {
    if (!fs.existsSync(BUDGET_FILE)) {
      fs.writeFileSync(BUDGET_FILE, JSON.stringify(DEFAULTS, null, 2));
    }
  }

  _load() {
    try {
      const raw = fs.readFileSync(BUDGET_FILE, "utf-8");
      return JSON.parse(raw);
    } catch {
      return { ...DEFAULTS };
    }
  }

  // Ensure weekly <= monthly/4 and daily <= monthly/30
  // If violated (e.g. stale data), reset them to the correct derived values
  _sanitize() {
    const m = this.budget.monthly;
    const maxWeekly = parseFloat((m / 4).toFixed(2));
    const maxDaily  = parseFloat((m / 30).toFixed(2));
    let changed = false;

    if (!this.budget.weekly || this.budget.weekly > maxWeekly) {
      this.budget.weekly = maxWeekly;
      changed = true;
    }
    if (!this.budget.daily || this.budget.daily > maxDaily) {
      this.budget.daily = maxDaily;
      changed = true;
    }
    if (changed) this._save();
  }

  _save() {
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(this.budget, null, 2));
  }

  get() {
    return { ...this.budget };
  }

  set({ monthly, weekly, daily }) {
    if (monthly !== undefined) {
      const m = parseFloat(monthly);
      if (m > 0) {
        this.budget.monthly = m;
        this.budget.weekly  = parseFloat((m / 4).toFixed(2));
        this.budget.daily   = parseFloat((m / 30).toFixed(2));
      }
    } else if (weekly !== undefined) {
      const w = parseFloat(weekly);
      const maxWeekly = parseFloat((this.budget.monthly / 4).toFixed(2));
      if (w > maxWeekly) {
        return { error: `Weekly ($${w}) exceeds monthly÷4 ($${maxWeekly}). Max allowed: $${maxWeekly}.` };
      }
      this.budget.weekly = w;
    } else if (daily !== undefined) {
      const d = parseFloat(daily);
      const maxDaily = parseFloat((this.budget.monthly / 30).toFixed(2));
      if (d > maxDaily) {
        return { error: `Daily ($${d}) exceeds monthly÷30 ($${maxDaily}). Max allowed: $${maxDaily}.` };
      }
      this.budget.daily = d;
    }
    this._save();
    return this.get();
  }
}

module.exports = BudgetStore;
