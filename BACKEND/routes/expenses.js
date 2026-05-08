// ============================================================
//  routes/expenses.js  —  All API Endpoints
// ============================================================

const express      = require("express");
const router       = express.Router();
const ExpenseStore = require("../models/ExpenseStore");
const BudgetStore  = require("../models/BudgetStore");
const Expense      = require("../models/Expense");

const store       = new ExpenseStore();
const budgetStore = store.budgetStore; // reuse same instance

// POST /api/expenses
router.post("/", (req, res) => {
  const { amount, category, description, date } = req.body;
  if (!amount || isNaN(amount) || amount <= 0)
    return res.status(400).json({ error: "Invalid amount." });
  if (!Expense.CATEGORIES.includes(category?.toLowerCase()))
    return res.status(400).json({ error: "Invalid category." });
  if (!description || description.trim().length === 0)
    return res.status(400).json({ error: "Description required." });
  const expense = store.add(amount, category, description, date);
  res.status(201).json(expense.toJSON());
});

// GET /api/expenses
router.get("/", (req, res) => {
  const { period } = req.query;
  let expenses;
  if (period === "today")      expenses = store.getToday();
  else if (period === "week")  expenses = store.getThisWeek();
  else if (period === "month") expenses = store.getThisMonth();
  else                         expenses = store.getAll();
  res.json(expenses.map((e) => e.toJSON()));
});

// GET /api/expenses/summary
router.get("/summary", (req, res) => {
  const { period } = req.query;
  let expenses;
  if (period === "today")      expenses = store.getToday();
  else if (period === "week")  expenses = store.getThisWeek();
  else if (period === "month") expenses = store.getThisMonth();
  else                         expenses = store.getAll();
  const summary = store.getSummary(expenses, period || "all");
  res.json(summary);
});

// GET /api/expenses/categories
router.get("/categories", (req, res) => {
  res.json({
    categories:        Expense.CATEGORIES,
    recommendedLimits: Expense.RECOMMENDED_LIMITS,
  });
});

// DELETE /api/expenses/:id
router.delete("/:id", (req, res) => {
  const deleted = store.delete(req.params.id);
  if (deleted) res.json({ success: true });
  else         res.status(404).json({ error: "Expense not found." });
});

// GET /api/expenses/budget  — get current budget
router.get("/budget", (req, res) => {
  res.json(budgetStore.get());
});

// PUT /api/expenses/budget  — update budget
// Body must contain exactly ONE of: { monthly } | { weekly } | { daily }
router.put("/budget", (req, res) => {
  const { weekly, monthly, daily } = req.body;
  if (monthly !== undefined) {
    if (isNaN(monthly) || monthly <= 0)
      return res.status(400).json({ error: "Monthly budget must be a positive number." });
  } else if (weekly !== undefined) {
    if (isNaN(weekly) || weekly <= 0)
      return res.status(400).json({ error: "Weekly budget must be a positive number." });
  } else if (daily !== undefined) {
    if (isNaN(daily) || daily <= 0)
      return res.status(400).json({ error: "Daily budget must be a positive number." });
  }
  const result = budgetStore.set({ monthly, weekly, daily });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

module.exports = router;
