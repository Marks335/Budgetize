// ============================================================
//  routes/goals.js  —  Goals & Streak API
// ============================================================
const express      = require("express");
const router       = express.Router();
const GoalStore    = require("../models/GoalStore");
const StreakStore   = require("../models/StreakStore");
const ExpenseStore = require("../models/ExpenseStore");

const goalStore   = new GoalStore();
const streakStore = new StreakStore();
const expStore    = new ExpenseStore();

// GET /api/goals
router.get("/", (req, res) => {
  const goals = goalStore.getAll().map(g => GoalStore.computeProgress(g, expStore));
  res.json(goals);
});

// POST /api/goals
router.post("/", (req, res) => {
  const { name, type, targetAmount, currentAmount, deadline, weeklyLimit } = req.body;
  if (!name || !type || !targetAmount)
    return res.status(400).json({ error: "name, type and targetAmount are required." });
  if (!["savings", "spending_limit", "emergency_fund"].includes(type))
    return res.status(400).json({ error: "Invalid goal type." });
  if (isNaN(targetAmount) || parseFloat(targetAmount) <= 0)
    return res.status(400).json({ error: "targetAmount must be positive." });
  const goal = goalStore.add({ name, type, targetAmount, currentAmount, deadline, weeklyLimit });
  res.status(201).json(GoalStore.computeProgress(goal, expStore));
});

// PUT /api/goals/:id  — update progress (add money to savings/emergency goal)
router.put("/:id", (req, res) => {
  const { currentAmount, name, deadline } = req.body;
  const updates = {};
  if (currentAmount !== undefined) updates.currentAmount = parseFloat(currentAmount);
  if (name !== undefined)          updates.name = name;
  if (deadline !== undefined)      updates.deadline = deadline;
  const updated = goalStore.update(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: "Goal not found." });
  res.json(GoalStore.computeProgress(updated, expStore));
});

// DELETE /api/goals/:id
router.delete("/:id", (req, res) => {
  const deleted = goalStore.delete(req.params.id);
  if (deleted) res.json({ success: true });
  else         res.status(404).json({ error: "Goal not found." });
});

// GET /api/goals/streak  — get streak state
router.get("/streak", (req, res) => {
  const budget = expStore.budgetStore.get();
  const dailyLimit = +(budget.weekly / 7).toFixed(2);
  const todayExpenses = expStore.getToday();
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const state = streakStore.evaluate(todayTotal, dailyLimit);
  res.json({ ...state, dailyLimit, todayTotal });
});

module.exports = router;
