// ============================================================
// HOW TO ADD STREAK TRACKING TO OTHER PAGES
// Add <script src="streak.js"></script> to each page, then
// call the relevant snippet below inside the existing function
// that fires when the user completes a meaningful action.
// ============================================================


// ── ANALYZER PAGE (analyzer.html) ───────────────────────────
// Find the function that handles the AI analysis response
// (wherever you display the score/results). Add this AFTER
// the result is successfully returned:

async function onAnalysisComplete() {
  // ... your existing result display code ...

  // Streak trigger — fires when analysis is complete
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    await window.physiqStreak.update(db, session.user.id);
  }
}


// ── MACRO CALCULATOR PAGE (macro-calculator.html) ────────────
// Find the function that calculates and displays macro results.
// Add this AFTER the macros are shown to the user:

async function onMacrosCalculated() {
  // ... your existing macro display code ...

  // Streak trigger — fires when macros are calculated
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    await window.physiqStreak.update(db, session.user.id);
  }
}


// ── NUTRITION / MEAL PLANNER PAGE (nutrition.html) ───────────
// Find the function that generates and displays the meal plan.
// Add this AFTER the plan is successfully generated:

async function onMealPlanGenerated() {
  // ... your existing meal plan display code ...

  // Streak trigger — fires when a meal plan is generated
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    await window.physiqStreak.update(db, session.user.id);
  }
}


// ── NAVBAR PILL ON NON-DASHBOARD PAGES ───────────────────────
// If you want the streak pill visible on the analyzer/macro/nutrition
// navbars too (recommended), add the same pill HTML to those navbars
// and call render (not update) on page load so it just displays
// without double-counting the visit:

async function initStreakDisplay() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    await window.physiqStreak.render(db, session.user.id);
  }
}
// Call initStreakDisplay() at the bottom of each page's init function