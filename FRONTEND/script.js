// ============================================================
//  script.js  —  BUDGETIZE Frontend Logic
// ============================================================

const CATEGORY_CONFIG = {
  food:          { emoji: "🍔", bg: "rgba(255,179,71,0.15)"  },
  transport:     { emoji: "🚌", bg: "rgba(106,174,255,0.15)" },
  rent:          { emoji: "🏠", bg: "rgba(180,127,255,0.15)" },
  utilities:     { emoji: "⚡", bg: "rgba(127,255,106,0.15)" },
  health:        { emoji: "💊", bg: "rgba(255,90,130,0.15)"  },
  entertainment: { emoji: "🎬", bg: "rgba(255,220,90,0.15)"  },
  education:     { emoji: "📚", bg: "rgba(90,220,255,0.15)"  },
  clothing:      { emoji: "👕", bg: "rgba(255,130,90,0.15)"  },
  other:         { emoji: "📦", bg: "rgba(150,150,180,0.15)" },
};

const CHART_COLORS = [
  "#ffb347","#6aaeff","#b47fff","#7fff6a",
  "#ff5a82","#ffdc5a","#5adcff","#ff825a","#9696b4"
];

// Encouraging messages shown on the banner
const ENCOURAGE_MSGS = {
  under_week:   ["You stayed under budget this week 🎉", "Great discipline this week! 💪", "Budget champion this week! 🏆"],
  under_today:  ["You're under budget today — keep going! ✨", "Solid spending today 👏", "Today looks great — stay on track! 🌟"],
  no_spend:     ["No spending today — savings win! 💰", "A no-spend day! Your wallet loves you 💚"],
  streak_3:     ["3-day streak! You're on fire 🔥", "3 days under budget — amazing! 🎯"],
  streak_7:     ["7-day streak! Absolutely crushing it 🔥🔥", "One full week under budget — legend! 🏅"],
  streak_14:    ["14-day streak! You're a budgeting machine 🤖💰"],
  goals_near:   ["You're close to a goal! Almost there 🎯"],
};

function getRandomMsg(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── GLOBAL STATE ──────────────────────────────────────────────
let currentPeriod = "today";
let donutChart    = null;
let barChart      = null;
let allExpenses   = [];
let categories    = [];
let currentPage   = "dashboard";
let depositGoalId = null;

// ── DOM REFERENCES ────────────────────────────────────────────
const budgetWeeklyInput  = document.getElementById("budget-weekly");
const budgetMonthlyInput = document.getElementById("budget-monthly");
const budgetDailyInput   = document.getElementById("budget-daily");
const btnSaveBudget      = document.getElementById("btn-save-budget");
const budgetToast        = document.getElementById("budget-toast");
const budgetBarFill      = document.getElementById("budget-bar-fill");
const budgetPct          = document.getElementById("budget-pct");
const bpAmounts          = document.getElementById("bp-amounts");
const bpPeriodLabel      = document.getElementById("bp-period-label");

const amountInput    = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const descInput      = document.getElementById("description");
const dateInput      = document.getElementById("date");
const btnAdd         = document.getElementById("btn-add");
const toast          = document.getElementById("toast");
const expenseList    = document.getElementById("expense-list");
const warningsList   = document.getElementById("warnings-list");
const adviceList     = document.getElementById("advice-list");
const searchInput    = document.getElementById("search");

const sumTotal = document.getElementById("sum-total");
const sumCount = document.getElementById("sum-count");
const sumAvg   = document.getElementById("sum-avg");
const sumMax   = document.getElementById("sum-max");

const headerTodayVal = document.getElementById("header-today-val");
const headerMonthVal = document.getElementById("header-month-val");

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
async function init() {
  dateInput.value = new Date().toISOString().split("T")[0];
  await loadCategories();
  await loadBudget();
  await refreshAll();
  setupEvents();
  await loadStreak();
  await loadGoals();
}

// ════════════════════════════════════════════════════════════
//  PAGE NAVIGATION
// ════════════════════════════════════════════════════════════
function switchPage(page) {
  currentPage = page;
  document.querySelectorAll(".page-content").forEach(el => el.style.display = "none");
  document.querySelectorAll(".page-tab").forEach(t => t.classList.remove("active"));

  if (page === "dashboard") {
    document.getElementById("page-dashboard").style.display = "";
  } else if (page === "goals") {
    document.getElementById("page-goals").style.display = "";
    loadGoals();
  }

  document.querySelector(`.page-tab[data-page="${page}"]`).classList.add("active");
}

// ════════════════════════════════════════════════════════════
//  STREAK
// ════════════════════════════════════════════════════════════
async function loadStreak() {
  try {
    const res  = await fetch("/api/goals/streak");
    const data = await res.json();

    const fire  = document.getElementById("streak-fire");
    const count = document.getElementById("streak-count");
    const badge = document.getElementById("streak-badge");

    count.textContent = data.currentStreak;

    if (data.todayPassed) {
      fire.textContent = "🔥";
      badge.classList.remove("streak-cold");
      badge.classList.add("streak-hot");
    } else {
      fire.textContent = "🔥";
      badge.classList.remove("streak-hot");
      badge.classList.add("streak-cold");  // grayscale via CSS
    }

    // Show encouraging message based on streak
    if (data.currentStreak >= 14) {
      showEncourage(getRandomMsg(ENCOURAGE_MSGS.streak_14), "🏅");
    } else if (data.currentStreak >= 7) {
      showEncourage(getRandomMsg(ENCOURAGE_MSGS.streak_7), "🔥");
    } else if (data.currentStreak >= 3) {
      showEncourage(getRandomMsg(ENCOURAGE_MSGS.streak_3), "🔥");
    }
  } catch(e) {
    console.error("Streak error:", e);
  }
}

// ════════════════════════════════════════════════════════════
//  ENCOURAGING BANNER
// ════════════════════════════════════════════════════════════
function showEncourage(text, icon = "🎉") {
  const banner = document.getElementById("encourage-banner");
  document.getElementById("encourage-text").textContent = text;
  document.getElementById("encourage-icon").textContent = icon;
  banner.style.display = "flex";
  // auto-hide after 8s
  clearTimeout(window._encourageTimer);
  window._encourageTimer = setTimeout(() => { banner.style.display = "none"; }, 8000);
}

function checkEncouragement(summary, todayData) {
  // No spend today
  if (todayData && todayData.total === 0) {
    showEncourage(getRandomMsg(ENCOURAGE_MSGS.no_spend), "💰");
    return;
  }
  // Under weekly budget
  if (currentPeriod === "week" && summary.periodLimit && summary.total < summary.periodLimit) {
    showEncourage(getRandomMsg(ENCOURAGE_MSGS.under_week), "🎉");
    return;
  }
  // Under today's budget
  if (currentPeriod === "today" && summary.periodLimit && summary.total < summary.periodLimit) {
    showEncourage(getRandomMsg(ENCOURAGE_MSGS.under_today), "✨");
    return;
  }
}

// ════════════════════════════════════════════════════════════
//  GOALS
// ════════════════════════════════════════════════════════════
async function loadGoals() {
  try {
    const res   = await fetch("/api/goals");
    const goals = await res.json();
    renderGoals(goals);
  } catch(e) {
    console.error("Goals error:", e);
  }
}

function renderGoals(goals) {
  const container = document.getElementById("goals-list");
  const empty     = document.getElementById("goals-empty");

  if (goals.length === 0) {
    empty.style.display = "block";
    // Remove old cards
    container.querySelectorAll(".goal-card").forEach(el => el.remove());
    return;
  }

  empty.style.display = "none";
  container.querySelectorAll(".goal-card").forEach(el => el.remove());

  goals.forEach(goal => {
    const card = buildGoalCard(goal);
    container.appendChild(card);
  });
}

const GOAL_TYPE_META = {
  savings:       { icon: "💰", label: "Savings Goal",       color: "#7fff6a" },
  spending_limit:{ icon: "🛑", label: "Spending Limit",      color: "#ffb347" },
  emergency_fund:{ icon: "🛡️", label: "Emergency Fund",     color: "#6aaeff" },
};

function buildGoalCard(goal) {
  const meta    = GOAL_TYPE_META[goal.type] || { icon: "🎯", label: goal.type, color: "#b47fff" };
  const pct     = Math.min(goal.pct || 0, 100).toFixed(0);
  const barColor = pct >= 100 ? "#7fff6a" : (goal.type === "spending_limit" && pct >= 80 ? "#ff5a5a" : meta.color);

  // Deadline display
  let deadlineStr = "";
  if (goal.deadline) {
    const daysLeft = goal.daysLeft;
    if (daysLeft > 0)       deadlineStr = `⏰ ${daysLeft} days left`;
    else if (daysLeft === 0) deadlineStr = `⏰ Due today!`;
    else                     deadlineStr = `⚠️ Overdue`;
  }

  const card = document.createElement("div");
  card.className = "goal-card";
  card.innerHTML = `
    <div class="goal-card-header">
      <div class="goal-icon-name">
        <span class="goal-type-icon">${meta.icon}</span>
        <div>
          <div class="goal-name">${escapeHtml(goal.name)}</div>
          <div class="goal-type-label">${meta.label}</div>
        </div>
      </div>
      <div class="goal-amounts">
        <span class="goal-current">$${parseFloat(goal.currentAmount || 0).toFixed(2)}</span>
        <span class="goal-sep"> / </span>
        <span class="goal-target">$${parseFloat(goal.targetAmount).toFixed(2)}</span>
      </div>
    </div>

    <div class="goal-progress-wrap">
      <div class="goal-bar-track">
        <div class="goal-bar-fill" style="width:${pct}%;background:${barColor}"></div>
      </div>
      <div class="goal-bar-labels">
        <span class="goal-pct">${pct}%</span>
        ${deadlineStr ? `<span class="goal-deadline">${deadlineStr}</span>` : ""}
      </div>
    </div>

    ${goal.prediction ? `<div class="goal-prediction">📈 ${escapeHtml(goal.prediction)}</div>` : ""}

    <div class="goal-actions">
      ${goal.type !== "spending_limit" ? `<button class="btn-goal-deposit" data-id="${goal.id}" data-name="${escapeHtml(goal.name)}">＋ Add Progress</button>` : ""}
      <button class="btn-goal-delete" data-id="${goal.id}">✕ Delete</button>
    </div>
  `;

  card.querySelector(".btn-goal-delete")?.addEventListener("click", async () => {
    if (!confirm("Delete this goal?")) return;
    await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    loadGoals();
  });

  card.querySelector(".btn-goal-deposit")?.addEventListener("click", () => {
    depositGoalId = goal.id;
    document.getElementById("deposit-goal-name").textContent = goal.name;
    document.getElementById("deposit-amount").value = "";
    document.getElementById("deposit-modal").style.display = "flex";
  });

  return card;
}

async function saveGoal() {
  const name        = document.getElementById("goal-name").value.trim();
  const type        = document.getElementById("goal-type").value;
  const target      = document.getElementById("goal-target").value;
  const current     = document.getElementById("goal-current").value || "0";
  const deadline    = document.getElementById("goal-deadline").value;
  const weeklyLimit = document.getElementById("goal-weekly-limit").value;
  const goalToast   = document.getElementById("goal-toast");

  const showErr = (msg) => {
    goalToast.textContent = msg;
    goalToast.className   = "toast error";
    setTimeout(() => { goalToast.textContent = ""; goalToast.className = "toast"; }, 3000);
  };

  if (!name)   return showErr("Enter a goal name.");
  if (!type)   return showErr("Pick a goal type.");
  if (!target || parseFloat(target) <= 0) return showErr("Enter a valid target amount.");

  const body = { name, type, targetAmount: target, currentAmount: current, deadline };
  if (type === "spending_limit" && weeklyLimit) body.weeklyLimit = weeklyLimit;

  const res = await fetch("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    document.getElementById("goal-form-card").style.display = "none";
    document.getElementById("goal-name").value = "";
    document.getElementById("goal-type").value = "";
    document.getElementById("goal-target").value = "";
    document.getElementById("goal-current").value = "";
    document.getElementById("goal-deadline").value = "";
    document.getElementById("goal-weekly-limit").value = "";
    loadGoals();
  } else {
    const data = await res.json();
    showErr(data.error || "Error saving goal.");
  }
}

async function confirmDeposit() {
  const amount = parseFloat(document.getElementById("deposit-amount").value);
  if (!depositGoalId || isNaN(amount) || amount <= 0) return;

  // Get current goal and add to it
  const res1    = await fetch("/api/goals");
  const goals   = await res1.json();
  const goal    = goals.find(g => g.id === depositGoalId);
  if (!goal) return;

  const newCurrent = parseFloat(goal.currentAmount || 0) + amount;
  await fetch(`/api/goals/${depositGoalId}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ currentAmount: newCurrent }),
  });

  document.getElementById("deposit-modal").style.display = "none";
  depositGoalId = null;
  loadGoals();

  if (newCurrent >= goal.targetAmount) {
    showEncourage("🎉 Goal reached! You did it!", "🏆");
  } else if (newCurrent / goal.targetAmount >= 0.9) {
    showEncourage(getRandomMsg(ENCOURAGE_MSGS.goals_near), "🎯");
  }
}

// ════════════════════════════════════════════════════════════
//  LOAD BUDGET
// ════════════════════════════════════════════════════════════
async function loadBudget() {
  const res    = await fetch("/api/expenses/budget");
  const budget = await res.json();

  // Server already sanitizes on startup, but double-check on frontend too
  const monthly   = budget.monthly;
  const maxWeekly = parseFloat((monthly / 4).toFixed(2));
  const maxDaily  = parseFloat((monthly / 30).toFixed(2));

  budgetMonthlyInput.value = monthly;
  // If stored weekly somehow > max, show the correct max
  budgetWeeklyInput.value  = Math.min(budget.weekly, maxWeekly);
  budgetDailyInput.value   = Math.min(budget.daily,  maxDaily);

  // Clear any leftover error states
  [budgetMonthlyInput, budgetWeeklyInput, budgetDailyInput].forEach(el => el.classList.remove("input-error"));
}

// ════════════════════════════════════════════════════════════
//  ALLOWANCE VALIDATION
// ════════════════════════════════════════════════════════════
function setupAllowanceListeners() {
  // ── Monthly changed → recalculate weekly and daily automatically ──
  budgetMonthlyInput.addEventListener("input", () => {
    const val     = budgetMonthlyInput.value;
    const monthly = parseFloat(val);
    [budgetMonthlyInput, budgetWeeklyInput, budgetDailyInput].forEach(el => el.classList.remove("input-error"));
    if (val === "") { budgetWeeklyInput.value = ""; budgetDailyInput.value = ""; return; }
    if (isNaN(monthly) || monthly <= 0) {
      budgetMonthlyInput.classList.add("input-error");
      showBudgetToast("Monthly allowance must be greater than 0.", "error");
      return;
    }
    // Auto-fill weekly and daily
    budgetWeeklyInput.value = (monthly / 4).toFixed(2);
    budgetDailyInput.value  = (monthly / 30).toFixed(2);
    showBudgetToast("Weekly & daily updated automatically.", "success");
  });

  // ── Weekly changed → warn/block if it would exceed monthly ──
  budgetWeeklyInput.addEventListener("input", () => {
    const val     = budgetWeeklyInput.value;
    const weekly  = parseFloat(val);
    const monthly = parseFloat(budgetMonthlyInput.value);
    budgetWeeklyInput.classList.remove("input-error");
    if (val === "") return;
    if (isNaN(weekly) || weekly <= 0) {
      budgetWeeklyInput.classList.add("input-error");
      showBudgetToast("Weekly allowance must be greater than 0.", "error");
      return;
    }
    if (!isNaN(monthly) && monthly > 0) {
      const maxWeekly = monthly / 4;
      if (weekly > maxWeekly) {
        budgetWeeklyInput.classList.add("input-error");
        showBudgetToast(`⚠️ Weekly ($${weekly}) exceeds monthly÷4 ($${maxWeekly.toFixed(2)}). Reduce it.`, "error");
        return;
      }
    }
    showBudgetToast("", "");
  });

  // ── Daily changed → warn/block if it would exceed monthly ──
  budgetDailyInput.addEventListener("input", () => {
    const val     = budgetDailyInput.value;
    const daily   = parseFloat(val);
    const monthly = parseFloat(budgetMonthlyInput.value);
    budgetDailyInput.classList.remove("input-error");
    if (val === "") return;
    if (isNaN(daily) || daily <= 0) {
      budgetDailyInput.classList.add("input-error");
      showBudgetToast("Daily allowance must be greater than 0.", "error");
      return;
    }
    if (!isNaN(monthly) && monthly > 0) {
      const maxDaily = monthly / 30;
      if (daily > maxDaily) {
        budgetDailyInput.classList.add("input-error");
        showBudgetToast(`⚠️ Daily ($${daily}) exceeds monthly÷30 ($${maxDaily.toFixed(2)}). Reduce it.`, "error");
        return;
      }
    }
    showBudgetToast("", "");
  });
}

// ════════════════════════════════════════════════════════════
//  SAVE BUDGET
// ════════════════════════════════════════════════════════════
async function saveBudget() {
  const monthly = parseFloat(budgetMonthlyInput.value);
  const weekly  = parseFloat(budgetWeeklyInput.value);
  const daily   = parseFloat(budgetDailyInput.value);

  if (isNaN(monthly) || monthly <= 0) {
    budgetMonthlyInput.classList.add("input-error");
    return showBudgetToast("Enter a valid monthly amount (must be > 0).", "error");
  }

  // Block save if weekly exceeds monthly/4
  if (!isNaN(weekly) && weekly > monthly / 4) {
    budgetWeeklyInput.classList.add("input-error");
    return showBudgetToast(`Weekly ($${weekly}) would exceed your monthly budget. Max: $${(monthly/4).toFixed(2)}.`, "error");
  }

  // Block save if daily exceeds monthly/30
  if (!isNaN(daily) && daily > monthly / 30) {
    budgetDailyInput.classList.add("input-error");
    return showBudgetToast(`Daily ($${daily}) would exceed your monthly budget. Max: $${(monthly/30).toFixed(2)}.`, "error");
  }

  [budgetMonthlyInput, budgetWeeklyInput, budgetDailyInput].forEach(el => el.classList.remove("input-error"));

  // Determine which field the user last intentionally changed
  // Strategy: always send monthly first (it resets weekly+daily), then optionally override
  // We send monthly → server auto-sets weekly & daily
  // Then if user manually changed weekly or daily, send those too
  const res = await fetch("/api/expenses/budget", {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ monthly }),
  });

  if (!res.ok) {
    const data = await res.json();
    return showBudgetToast(data.error || "Error saving.", "error");
  }

  // Now save weekly if user manually entered it (different from auto-computed)
  const autoWeekly = parseFloat((monthly / 4).toFixed(2));
  if (!isNaN(weekly) && Math.abs(weekly - autoWeekly) > 0.01) {
    const r2 = await fetch("/api/expenses/budget", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ weekly }),
    });
    if (!r2.ok) {
      const d2 = await r2.json();
      return showBudgetToast(d2.error || "Error saving weekly.", "error");
    }
  }

  // Now save daily if user manually entered it (different from auto-computed)
  const autoDaily = parseFloat((monthly / 30).toFixed(2));
  if (!isNaN(daily) && Math.abs(daily - autoDaily) > 0.01) {
    const r3 = await fetch("/api/expenses/budget", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ daily }),
    });
    if (!r3.ok) {
      const d3 = await r3.json();
      return showBudgetToast(d3.error || "Error saving daily.", "error");
    }
  }

  // Reload to show final saved values
  await loadBudget();
  showBudgetToast("Budget saved! ✓", "success");
  await refreshAll();
}

function showBudgetToast(msg, type = "success") {
  budgetToast.textContent = msg;
  budgetToast.className   = `toast ${type}`;
  setTimeout(() => { budgetToast.textContent = ""; budgetToast.className = "toast"; }, 3000);
}

function updateBudgetBar(summary) {
  if (!summary.periodLimit) {
    bpPeriodLabel.textContent = "Set a budget above";
    bpAmounts.textContent     = "";
    budgetPct.textContent     = "";
    budgetBarFill.style.width = "0%";
    return;
  }
  const pct    = Math.min((summary.total / summary.periodLimit) * 100, 100);
  const labels = { today: "Today", week: "This Week", month: "This Month", all: "All Time" };
  bpPeriodLabel.textContent = labels[currentPeriod] || "Period";
  bpAmounts.textContent     = `$${summary.total.toFixed(2)} / $${summary.periodLimit.toFixed(2)}`;
  budgetPct.textContent     = `${pct.toFixed(0)}% used`;
  budgetBarFill.style.width = `${pct}%`;
  budgetBarFill.classList.remove("warn", "danger");
  if (pct >= 100)     budgetBarFill.classList.add("danger");
  else if (pct >= 75) budgetBarFill.classList.add("warn");
}

// ════════════════════════════════════════════════════════════
//  LOAD CATEGORIES
// ════════════════════════════════════════════════════════════
async function loadCategories() {
  const res  = await fetch("/api/expenses/categories");
  const data = await res.json();
  categories = data.categories;
  categorySelect.innerHTML = `<option value="">— pick one —</option>`;
  for (const cat of categories) {
    const cfg    = CATEGORY_CONFIG[cat] || { emoji: "•" };
    const option = document.createElement("option");
    option.value       = cat;
    option.textContent = `${cfg.emoji}  ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
    categorySelect.appendChild(option);
  }
}

// ════════════════════════════════════════════════════════════
//  REFRESH ALL
// ════════════════════════════════════════════════════════════
async function refreshAll() {
  await Promise.all([loadExpenses(), loadSummary(), loadHeaderStats()]);
  await loadStreak();
}

// ════════════════════════════════════════════════════════════
//  LOAD EXPENSES
// ════════════════════════════════════════════════════════════
async function loadExpenses() {
  const res   = await fetch(`/api/expenses?period=${currentPeriod}`);
  allExpenses = await res.json();
  renderExpenseList(allExpenses);
}

// ════════════════════════════════════════════════════════════
//  LOAD SUMMARY
// ════════════════════════════════════════════════════════════
async function loadSummary() {
  const res  = await fetch(`/api/expenses/summary?period=${currentPeriod}`);
  const data = await res.json();

  sumTotal.textContent = `$${data.total.toFixed(2)}`;
  sumCount.textContent = allExpenses.length;

  const days = getPeriodDays(currentPeriod);
  const avg  = days > 0 ? data.total / days : data.total;
  sumAvg.textContent = `$${avg.toFixed(2)}`;

  const maxExpense = allExpenses.reduce((m, e) => Math.max(m, e.amount), 0);
  sumMax.textContent = `$${maxExpense.toFixed(2)}`;

  const labels = Object.keys(data.byCategory);
  const values = Object.values(data.byCategory);
  updateDonutChart(labels, values, data.total);
  updateBarChart(labels, values);
  updateBudgetBar(data);
  renderWarnings(data.warnings);
  renderAdvice(data.advice);

  // Fetch today for encouraging messages
  if (currentPeriod !== "today") {
    const todayRes  = await fetch("/api/expenses/summary?period=today");
    const todayData = await todayRes.json();
    checkEncouragement(data, todayData);
  } else {
    checkEncouragement(data, data);
  }
}

// ════════════════════════════════════════════════════════════
//  LOAD HEADER STATS
// ════════════════════════════════════════════════════════════
async function loadHeaderStats() {
  const [todayRes, monthRes] = await Promise.all([
    fetch("/api/expenses/summary?period=today"),
    fetch("/api/expenses/summary?period=month"),
  ]);
  const todayData = await todayRes.json();
  const monthData = await monthRes.json();
  headerTodayVal.textContent = `$${todayData.total.toFixed(2)}`;
  headerMonthVal.textContent = `$${monthData.total.toFixed(2)}`;
}

// ════════════════════════════════════════════════════════════
//  ADD EXPENSE
// ════════════════════════════════════════════════════════════
async function addExpense() {
  const amount      = amountInput.value.trim();
  const category    = categorySelect.value;
  const description = descInput.value.trim();
  const date        = dateInput.value;

  if (!amount || parseFloat(amount) <= 0) return showToast("Enter a valid amount.", "error");
  if (!category)                          return showToast("Pick a category.", "error");
  if (!description)                       return showToast("Add a description.", "error");

  const res  = await fetch("/api/expenses", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ amount, category, description, date }),
  });
  const data = await res.json();

  if (!res.ok) { showToast(data.error || "Error adding expense.", "error"); return; }

  amountInput.value    = "";
  descInput.value      = "";
  categorySelect.value = "";
  dateInput.value      = new Date().toISOString().split("T")[0];

  showToast("Expense added! 🎉", "success");
  await refreshAll();
}

// ════════════════════════════════════════════════════════════
//  DELETE EXPENSE
// ════════════════════════════════════════════════════════════
async function deleteExpense(id) {
  const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
  if (res.ok) await refreshAll();
}

// ════════════════════════════════════════════════════════════
//  RENDER: EXPENSE LIST
// ════════════════════════════════════════════════════════════
function renderExpenseList(expenses) {
  if (expenses.length === 0) {
    expenseList.innerHTML = `<p class="empty-msg center">No expenses found for this period.</p>`;
    return;
  }
  expenseList.innerHTML = expenses.map((e, i) => {
    const cfg  = CATEGORY_CONFIG[e.category] || { emoji: "•", bg: "rgba(150,150,180,0.15)" };
    const date = new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `
      <div class="expense-item" style="animation-delay:${i*0.04}s">
        <div class="expense-cat-badge" style="background:${cfg.bg}">${cfg.emoji}</div>
        <div class="expense-info">
          <div class="expense-desc">${escapeHtml(e.description)}</div>
          <div class="expense-meta">${date} · ${e.category}</div>
        </div>
        <div class="expense-right">
          <span class="expense-amount">-$${parseFloat(e.amount).toFixed(2)}</span>
          <button class="expense-delete" onclick="deleteExpense('${e.id}')">✕ remove</button>
        </div>
      </div>`;
  }).join("");
}

// ════════════════════════════════════════════════════════════
//  RENDER: WARNINGS & ADVICE
// ════════════════════════════════════════════════════════════
function renderWarnings(warnings) {
  if (!warnings || warnings.length === 0) {
    warningsList.innerHTML = `<p class="empty-msg">No warnings yet. Keep it up! 🎉</p>`;
    return;
  }
  warningsList.innerHTML = warnings.map(w => `<div class="warning-item">${w}</div>`).join("");
}

function renderAdvice(advice) {
  if (!advice || advice.length === 0) {
    adviceList.innerHTML = `<p class="empty-msg">Add expenses to get personalized tips.</p>`;
    return;
  }
  adviceList.innerHTML = advice.map(a => `<div class="advice-item">${a}</div>`).join("");
}

// ════════════════════════════════════════════════════════════
//  CHARTS
// ════════════════════════════════════════════════════════════
function updateDonutChart(labels, values, total) {
  const ctx = document.getElementById("donut-chart").getContext("2d");
  document.getElementById("chart-center-amount").textContent = labels.length ? `$${total.toFixed(2)}` : "—";
  if (donutChart) donutChart.destroy();
  if (labels.length === 0) return;
  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: CHART_COLORS.slice(0, labels.length), borderColor: "#111118", borderWidth: 3, hoverOffset: 6 }],
    },
    options: {
      cutout: "68%", responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { color: "#7070a0", font: { family: "'Space Mono', monospace", size: 10 }, padding: 12, boxWidth: 10, boxHeight: 10 } },
        tooltip: { callbacks: { label: (ctx) => ` $${ctx.parsed.toFixed(2)} (${((ctx.parsed/total)*100).toFixed(1)}%)` } },
      },
    },
  });
}

function updateBarChart(labels, values) {
  const ctx = document.getElementById("bar-chart").getContext("2d");
  if (barChart) barChart.destroy();
  if (labels.length === 0) return;
  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      datasets: [{ label: "Spent ($)", data: values, backgroundColor: CHART_COLORS.slice(0, labels.length), borderRadius: 6, borderSkipped: false }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` $${ctx.parsed.y.toFixed(2)}` } },
      },
      scales: {
        x: { ticks: { color: "#7070a0", font: { family: "'Space Mono', monospace", size: 10 } }, grid: { color: "rgba(255,255,255,0.04)" } },
        y: { ticks: { color: "#7070a0", font: { family: "'Space Mono', monospace", size: 10 }, callback: (v) => `$${v}` }, grid: { color: "rgba(255,255,255,0.04)" } },
      },
    },
  });
}

// ════════════════════════════════════════════════════════════
//  UTILITIES
// ════════════════════════════════════════════════════════════
function showToast(msg, type = "success") {
  toast.textContent = msg;
  toast.className   = `toast ${type}`;
  setTimeout(() => { toast.textContent = ""; toast.className = "toast"; }, 3000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getPeriodDays(period) {
  return { today: 1, week: 7, month: 30, all: 30 }[period] || 1;
}

// ════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ════════════════════════════════════════════════════════════
function setupEvents() {
  setupAllowanceListeners();

  btnSaveBudget.addEventListener("click", saveBudget);
  btnAdd.addEventListener("click", addExpense);

  [amountInput, descInput, dateInput].forEach(el => {
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") addExpense(); });
  });

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", async () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentPeriod = tab.dataset.period;
      await refreshAll();
    });
  });

  searchInput.addEventListener("input", () => {
    const q        = searchInput.value.toLowerCase();
    const filtered = allExpenses.filter(e =>
      e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    );
    renderExpenseList(filtered);
  });

  // Page nav
  document.querySelectorAll(".page-tab").forEach(tab => {
    tab.addEventListener("click", () => switchPage(tab.dataset.page));
  });

  // Goals form
  document.getElementById("btn-new-goal").addEventListener("click", () => {
    const fc = document.getElementById("goal-form-card");
    fc.style.display = fc.style.display === "none" ? "" : "none";
  });

  document.getElementById("btn-cancel-goal").addEventListener("click", () => {
    document.getElementById("goal-form-card").style.display = "none";
  });

  document.getElementById("btn-save-goal").addEventListener("click", saveGoal);

  document.getElementById("goal-type").addEventListener("change", () => {
    const t  = document.getElementById("goal-type").value;
    const wg = document.getElementById("weekly-limit-group");
    wg.style.display = t === "spending_limit" ? "" : "none";
  });

  // Deposit modal
  document.getElementById("btn-confirm-deposit").addEventListener("click", confirmDeposit);
  document.getElementById("btn-cancel-deposit").addEventListener("click", () => {
    document.getElementById("deposit-modal").style.display = "none";
    depositGoalId = null;
  });
  document.getElementById("deposit-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("deposit-modal")) {
      document.getElementById("deposit-modal").style.display = "none";
      depositGoalId = null;
    }
  });
}

init();
