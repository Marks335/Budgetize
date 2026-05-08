// ============================================================
//  models/ExpenseStore.js  —  OOP: The "Database" Class
// ============================================================
// This class manages all expenses. It reads/writes to a JSON
// file (our simple "database"). Think of it like a Java
// ArrayList<Expense> with save/load methods.

const fs          = require("fs");
const path        = require("path");
const Expense     = require("./Expense");
const BudgetStore = require("./BudgetStore");

const DATA_FILE = path.join(__dirname, "..", "database", "expenses.json");

class ExpenseStore {
  constructor() {
    this.expenses    = []; // our in-memory list (like ArrayList<Expense>)
    this.budgetStore = new BudgetStore(); // inject budget dependency
    this._ensureFile();
    this._load();
  }

  // ── Private: make sure the data file exists ────────────────
  _ensureFile() {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
  }

  // ── Private: load expenses from disk into memory ───────────
  _load() {
    try {
      const raw  = fs.readFileSync(DATA_FILE, "utf-8");
      const data = JSON.parse(raw);
      // Rebuild each plain object back into a real Expense instance
      this.expenses = data.map((item) => Expense.fromJSON(item));
    } catch {
      this.expenses = [];
    }
  }

  // ── Private: save in-memory list to disk ──────────────────
  _save() {
    const data = this.expenses.map((e) => e.toJSON());
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }

  // ── Public: add a new expense ─────────────────────────────
  add(amount, category, description, date) {
    const expense = new Expense(amount, category, description, date);
    this.expenses.push(expense);
    this._save();
    return expense;
  }

  // ── Public: delete an expense by ID ───────────────────────
  delete(id) {
    const before = this.expenses.length;
    this.expenses = this.expenses.filter((e) => e.id !== id);
    if (this.expenses.length < before) {
      this._save();
      return true;
    }
    return false; // not found
  }

  // ── Public: get ALL expenses (sorted newest first) ─────────
  getAll() {
    return [...this.expenses].sort((a, b) => b.date - a.date);
  }

  // ── Public: get today's expenses ──────────────────────────
  getToday() {
    return this.expenses.filter((e) => e.isToday());
  }

  // ── Public: get this week's expenses ──────────────────────
  getThisWeek() {
    return this.expenses.filter((e) => e.isThisWeek());
  }

  // ── Public: get this month's expenses ─────────────────────
  getThisMonth() {
    return this.expenses.filter((e) => e.isThisMonth());
  }

  // ── Public: compute a summary from a list of expenses ─────
  // Returns totals, warnings vs USER-set budget, and advice
  getSummary(expenseList, period = "all") {
    const byCategory = {};

    for (const e of expenseList) {
      if (!byCategory[e.category]) byCategory[e.category] = 0;
      byCategory[e.category] += e.amount;
    }

    const total  = Object.values(byCategory).reduce((s, v) => s + v, 0);
    const budget = this.budgetStore.get(); // { weekly, monthly }

    // Pick the right limit based on the period
    let periodLimit = null;
    if (period === "week")       periodLimit = budget.weekly;
    else if (period === "month") periodLimit = budget.monthly;
    else if (period === "today") periodLimit = +(budget.weekly / 7).toFixed(2);

    const warnings = [];

    // Warning 1: total vs period budget
    if (periodLimit !== null) {
      const pct  = (total / periodLimit) * 100;
      const left = periodLimit - total;

      if (total > periodLimit) {
        const over = (total - periodLimit).toFixed(2);
        warnings.push(`🚨 You're $${over} OVER your ${period} budget of $${periodLimit.toFixed(2)}!`);
      } else if (pct >= 80) {
        warnings.push(`⚠️ You've used ${pct.toFixed(0)}% of your ${period} budget. Only $${left.toFixed(2)} left!`);
      } else if (pct >= 50) {
        warnings.push(`📊 Halfway there — $${left.toFixed(2)} remaining from your $${periodLimit.toFixed(2)} ${period} budget.`);
      }
    }

    // Warning 2: single category dominates (>50% of total)
    for (const [cat, spent] of Object.entries(byCategory)) {
      if (total > 0 && spent / total > 0.5 && total > 20) {
        warnings.push(`📌 "${cat}" is eating ${((spent/total)*100).toFixed(0)}% of your spending — consider rebalancing.`);
      }
    }

    const advice = this._generateAdvice(byCategory, total, budget, period);

    return { byCategory, total, warnings, advice, budget, periodLimit };
  }

  // ── Private: generate personalized saving tips ─────────────
  _generateAdvice(byCategory, total, budget = {}, period = "all") {
    const tips = [];
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];

    if (!top) return tips;

    const adviceMap = {
      food:          "🍳 Cook at home more often — meal-prepping on Sundays can cut food costs by 40%.",
      transport:     "🚌 Consider a monthly transit pass instead of individual tickets.",
      entertainment: "🎬 Look for student discounts on streaming, cinema, and events.",
      clothing:      "👗 Try thrift stores or swap clothes with friends.",
      health:        "💊 Check if your university has a free health clinic.",
      utilities:     "💡 Unplug devices when not in use and reduce AC/heating usage.",
      other:         "🤔 Review your 'other' spending — small purchases add up fast.",
    };

    if (adviceMap[top[0]]) tips.push(adviceMap[top[0]]);

    // Warn if spending is high relative to their actual budget
    const limit = period === "week" ? budget.weekly : budget.monthly;
    if (limit && total > limit * 0.9)
      tips.push("📊 You're close to your budget limit. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.");
    else if (total > 1000)
      tips.push("📊 Your total spend is high. Consider tracking daily to catch leaks early.");

    if (byCategory.food && byCategory.entertainment) {
      const ratio = byCategory.entertainment / byCategory.food;
      if (ratio > 0.5)
        tips.push("🎮 You're spending a lot on entertainment relative to food. Balance is key!");
    }

    if (tips.length === 0)
      tips.push("✅ Great job! Your spending looks balanced. Keep it up!");

    return tips;
  }
}

module.exports = ExpenseStore;
