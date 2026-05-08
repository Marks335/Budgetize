// ============================================================
//  models/Expense.js  —  OOP: The Expense "Blueprint" (Class)
// ============================================================
// Think of this like a Java class. Every expense is an object
// built from this blueprint.

const { randomUUID } = require("crypto"); // built-in Node module

class Expense {
  constructor(amount, category, description, date = null) {
    this.id          = randomUUID();               // unique ID (like a primary key)
    this.amount      = parseFloat(amount);         // always store as number
    this.category    = category.trim().toLowerCase();
    this.description = description.trim();
    this.date        = date ? new Date(date) : new Date(); // default = today
    this.createdAt   = new Date();
  }

  // ── Instance method: is this expense from today? ──────────
  isToday() {
    const today = new Date();
    return (
      this.date.getFullYear() === today.getFullYear() &&
      this.date.getMonth()    === today.getMonth()    &&
      this.date.getDate()     === today.getDate()
    );
  }

  // ── Instance method: is this expense from this week? ──────
  isThisWeek() {
    const now     = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    return this.date >= weekAgo && this.date <= now;
  }

  // ── Instance method: is this expense from this month? ─────
  isThisMonth() {
    const today = new Date();
    return (
      this.date.getFullYear() === today.getFullYear() &&
      this.date.getMonth()    === today.getMonth()
    );
  }

  // ── Instance method: serialize to plain object (for JSON) ─
  toJSON() {
    return {
      id:          this.id,
      amount:      this.amount,
      category:    this.category,
      description: this.description,
      date:        this.date.toISOString(),
      createdAt:   this.createdAt.toISOString(),
    };
  }

  // ── Static method: rebuild an Expense object from raw JSON ─
  // (like a factory — "give me a JSON blob, I'll give you a real object")
  static fromJSON(data) {
    const expense = new Expense(
      data.amount,
      data.category,
      data.description,
      data.date
    );
    expense.id        = data.id;
    expense.createdAt = new Date(data.createdAt);
    return expense;
  }
}

// ── CATEGORY CONSTANTS ─────────────────────────────────────
// One place to define valid categories — easy to maintain
Expense.CATEGORIES = [
  "food",
  "transport",
  "rent",
  "utilities",
  "health",
  "entertainment",
  "education",
  "clothing",
  "other",
];

// ── CATEGORY BUDGETS (monthly recommended limits) ──────────
Expense.RECOMMENDED_LIMITS = {
  food:          300,
  transport:     100,
  rent:          600,
  utilities:     80,
  health:        60,
  entertainment: 50,
  education:     100,
  clothing:      60,
  other:         50,
};

module.exports = Expense;
