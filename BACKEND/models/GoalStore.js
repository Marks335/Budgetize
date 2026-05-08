// ============================================================
//  models/GoalStore.js  —  Financial Goals
// ============================================================
const fs   = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const GOALS_FILE = path.join(__dirname, "..", "database", "goals.json");

class GoalStore {
  constructor() {
    this._ensureFile();
    this.goals = this._load();
  }

  _ensureFile() {
    if (!fs.existsSync(GOALS_FILE)) {
      fs.writeFileSync(GOALS_FILE, JSON.stringify([]));
    }
  }

  _load() {
    try {
      return JSON.parse(fs.readFileSync(GOALS_FILE, "utf-8"));
    } catch {
      return [];
    }
  }

  _save() {
    fs.writeFileSync(GOALS_FILE, JSON.stringify(this.goals, null, 2));
  }

  getAll() {
    return this.goals;
  }

  add({ name, type, targetAmount, currentAmount, deadline, weeklyLimit }) {
    const goal = {
      id: uuidv4(),
      name,
      type,                          // "savings" | "spending_limit" | "emergency_fund"
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount || 0),
      weeklyLimit: weeklyLimit ? parseFloat(weeklyLimit) : null,
      deadline: deadline || null,
      createdAt: new Date().toISOString(),
    };
    this.goals.push(goal);
    this._save();
    return goal;
  }

  update(id, updates) {
    const idx = this.goals.findIndex(g => g.id === id);
    if (idx === -1) return null;
    this.goals[idx] = { ...this.goals[idx], ...updates };
    this._save();
    return this.goals[idx];
  }

  delete(id) {
    const before = this.goals.length;
    this.goals = this.goals.filter(g => g.id !== id);
    if (this.goals.length < before) { this._save(); return true; }
    return false;
  }

  // Compute progress + prediction for a single goal
  static computeProgress(goal, expenseStore) {
    const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

    // Days until deadline
    let daysLeft = null;
    let prediction = null;
    if (goal.deadline) {
      daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    }

    // Daily saving rate needed
    if (daysLeft !== null && daysLeft > 0 && remaining > 0) {
      const dailyNeeded = remaining / daysLeft;
      prediction = `Save $${dailyNeeded.toFixed(2)}/day to reach your goal in time.`;
    } else if (remaining === 0) {
      prediction = "🎉 Goal reached!";
    } else if (daysLeft !== null && daysLeft <= 0) {
      prediction = "⚠️ Deadline passed — update your goal.";
    }

    // For spending_limit: compare with actual expenses this week
    let weeklySpent = null;
    if (goal.type === "spending_limit" && expenseStore) {
      const weekExpenses = expenseStore.getThisWeek();
      weeklySpent = weekExpenses.reduce((s, e) => s + e.amount, 0);
      const limit = goal.weeklyLimit || goal.targetAmount;
      const spentPct = Math.min((weeklySpent / limit) * 100, 100);
      if (weeklySpent > limit) {
        prediction = `🚨 Over weekly limit by $${(weeklySpent - limit).toFixed(2)}`;
      } else {
        prediction = `$${(limit - weeklySpent).toFixed(2)} remaining this week`;
      }
      return { ...goal, pct: spentPct, remaining: Math.max(limit - weeklySpent, 0), prediction, weeklySpent };
    }

    return { ...goal, pct, remaining, prediction, daysLeft };
  }
}

module.exports = GoalStore;
