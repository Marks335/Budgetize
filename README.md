================================================================================
  BUDGETIZE
  Student Budget Tracker
================================================================================

  A full-stack web application that helps students manage their money.
  Track daily expenses, set budgets, create financial goals, and maintain
  a daily streak by staying under your spending limit.

--------------------------------------------------------------------------------
  WHAT IT DOES
--------------------------------------------------------------------------------

  - Log expenses by category (food, transport, entertainment, etc.)
  - Set a monthly budget — weekly and daily limits are calculated automatically
  - Visualize spending with a donut chart (by category) and a bar chart (by day)
  - Create financial goals: savings targets, emergency funds, spending limits
  - Daily streak: earn a streak every day you stay under budget
  - Smart warnings and personalized advice when you're approaching your limit


--------------------------------------------------------------------------------
  REQUIREMENTS
--------------------------------------------------------------------------------

  TOOLS YOU NEED INSTALLED
  -------------------------

  Node.js   v18 or higher   Runs the backend server
                            Download: https://nodejs.org

  npm       Comes with      Installs project dependencies
            Node.js         (no separate download needed)

  Browser   Any modern      Opens the app — Chrome recommended
            browser

  Terminal  Built into      Runs the commands below
            your OS         Windows: PowerShell or CMD
                            Mac: Terminal


  To check if Node.js is already installed, open a terminal and type:

      node --version

  If you see a version number (e.g. v20.11.0) you are good to go.
  If not, download it from https://nodejs.org and install it first.


  DEPENDENCIES (installed automatically — no manual download needed)
  ------------------------------------------------------------------

  express   v4.18.2   Web framework. Handles routing and serves files.
  uuid      latest    Generates unique IDs for each expense and goal.
  nodemon   v3.0.1    Dev tool. Auto-restarts server when you edit code.
                      (Only needed during development, not for normal use.)


--------------------------------------------------------------------------------
  HOW TO RUN THE PROJECT
--------------------------------------------------------------------------------

  STEP 1 — Open a terminal
  -------------------------
  Windows:  Press Win + R, type powershell, press Enter
  Mac:      Press Cmd + Space, type terminal, press Enter


  STEP 2 — Navigate to the BACKEND folder
  ----------------------------------------
  Type this command and press Enter (replace the path with your actual path):

      Windows:
      cd C:\Users\YourName\Downloads\Budgetize-Organized\BACKEND

      Mac / Linux:
      cd ~/Downloads/Budgetize-Organized/BACKEND


  STEP 3 — Install dependencies  (FIRST TIME ONLY)
  -------------------------------------------------
  Run these two commands one at a time:

      npm install
      npm install uuid

  This downloads all required packages. You only need to do this once.


  STEP 4 — Start the server
  --------------------------
      node server.js

  You should see:
      Server running at http://localhost:3000


  STEP 5 — Open the app in your browser
  --------------------------------------
  Go to:
      http://localhost:3000

  The app will load and you can start using it immediately.


  STEP 6 — Stop the server when done
  ------------------------------------
  Go back to the terminal and press:
      Ctrl + C


  OPTIONAL — Development mode (auto-restart on file save)
  --------------------------------------------------------
  Instead of Step 4, run:
      npm run dev

  This uses nodemon to restart the server automatically whenever
  you save a change to any file. Useful when editing code.


--------------------------------------------------------------------------------
  FILE STRUCTURE
--------------------------------------------------------------------------------

  Budgetize-Organized/
  |
  |-- README.txt                    This file
  |
  |-- FRONTEND/                     Everything the browser sees and runs
  |   |-- index.html                The full page layout (buttons, forms, charts)
  |   |-- style.css                 All colors, fonts, layout, and animations
  |   └-- script.js                 Frontend logic: fetch calls, charts, UI updates
  |
  └-- BACKEND/                      The server — runs on Node.js, not in the browser
      |-- server.js                 Entry point — starts the server
      |-- package.json              Project config and list of dependencies
      |
      |-- routes/                   API endpoints (URLs the frontend calls)
      |   |-- expenses.js           Handles /api/expenses
      |   └-- goals.js              Handles /api/goals and /api/goals/streak
      |
      |-- models/                   Business logic — classes that manage data
      |   |-- Expense.js            Blueprint class for one expense object
      |   |-- ExpenseStore.js       Manages the full list of expenses
      |   |-- BudgetStore.js        Manages monthly/weekly/daily budget limits
      |   |-- GoalStore.js          Manages financial goals and progress
      |   └-- StreakStore.js        Tracks daily streaks and 30-day history
      |
      └-- database/                 JSON flat-file database (plain text files)
          |-- expenses.json         All recorded expenses
          |-- budget.json           The three budget limits
          |-- goals.json            All financial goals
          └-- streak.json           Streak count and daily history


--------------------------------------------------------------------------------
  WHAT EACH FILE DOES
--------------------------------------------------------------------------------

  FRONTEND FILES
  --------------

  index.html
      Defines every visible element on the page — the header, dashboard,
      expense form, charts, goals page, and popup modals. JavaScript shows
      and hides sections to switch between pages without reloading.

  style.css
      All visual design. Uses CSS Grid for the 3-column layout, Flexbox for
      alignment, CSS variables for the color theme, and @keyframes for
      animations (expense cards fade in, etc.).

  script.js
      The brain of the frontend. Sends HTTP requests to the backend using
      fetch(), listens for user actions (button clicks, form input, search),
      and updates the page with returned data. Also manages the Chart.js
      donut chart (spending by category) and bar chart (spending by day).


  BACKEND FILES
  -------------

  server.js
      The entry point. Creates the Express app, registers middleware
      (JSON body parsing and static file serving), mounts the route files,
      and starts listening on port 3000.

  package.json
      Project configuration. Lists the app name, version, npm scripts
      (start, dev), and all dependencies with their versions.

  routes/expenses.js
      All endpoints under /api/expenses:
        GET    /api/expenses              Fetch expenses (filter by period)
        POST   /api/expenses              Add a new expense
        DELETE /api/expenses/:id          Delete an expense by ID
        GET    /api/expenses/summary      Totals, warnings, advice
        GET    /api/expenses/categories   List of valid categories
        GET    /api/expenses/budget       Get current budget settings
        PUT    /api/expenses/budget       Update budget settings

  routes/goals.js
      All endpoints under /api/goals:
        GET    /api/goals                 Get all goals with progress %
        POST   /api/goals                 Create a new goal
        PUT    /api/goals/:id             Update a goal (e.g. deposit savings)
        DELETE /api/goals/:id             Delete a goal
        GET    /api/goals/streak          Get streak state + today's spending

  models/Expense.js
      A JavaScript class. The constructor sets id (UUID), amount, category,
      description, date, and createdAt. Instance methods: isToday(),
      isThisWeek(), isThisMonth(), toJSON(). Static method: fromJSON()
      to rebuild an object from data loaded off disk.

  models/ExpenseStore.js
      Loads expenses.json on startup into a memory array. Every add() or
      delete() call updates the array and immediately saves back to disk.
      Methods: add(), delete(), getAll(), getToday(), getThisWeek(),
      getThisMonth(), getSummary().

  models/BudgetStore.js
      Loads budget.json. Validates that weekly does not exceed monthly / 4
      and daily does not exceed monthly / 30. The set() method auto-
      recalculates all three limits when monthly is updated.

  models/GoalStore.js
      Loads goals.json. add() generates a UUID and stores the new goal.
      computeProgress() is a static method that calculates completion
      percentage and remaining amount for each goal.

  models/StreakStore.js
      Loads streak.json. evaluate() is called on every summary request.
      It checks if today's total spending is under the daily limit and
      updates the streak count and 30-day history accordingly.


  DATABASE FILES
  --------------

  expenses.json
      A JSON array []. Each item has: id, amount, category, description,
      date, createdAt. Starts empty: []

  budget.json
      A JSON object {}. Keys: monthly, weekly, daily (all numbers).
      Default: { "monthly": 800, "weekly": 200, "daily": 26.67 }

  goals.json
      A JSON array []. Each item has: id, name, type, targetAmount,
      currentAmount, weeklyLimit, deadline, createdAt. Starts empty: []

  streak.json
      A JSON object with: currentStreak (number), lastCheckedDate (string
      or null), todayPassed (boolean), history (array of last 30 days).


--------------------------------------------------------------------------------
  EDITING THE CODE
--------------------------------------------------------------------------------

  What you want to change              File to edit
  -------------------------------------------------------
  Page layout or structure             FRONTEND/index.html
  Colors, fonts, or design             FRONTEND/style.css
  Charts, buttons, or page logic       FRONTEND/script.js
  Server startup or middleware         BACKEND/server.js
  Expense or budget API logic          BACKEND/routes/expenses.js
  Goals or streak API logic            BACKEND/routes/goals.js
  How expense objects work             BACKEND/models/Expense.js
  How data is saved to disk            BACKEND/models/ExpenseStore.js

  Recommended editor: Visual Studio Code (free) — https://code.visualstudio.com
  Simpler alternative: Notepad++       (free) — https://notepad-plus-plus.org


================================================================================
