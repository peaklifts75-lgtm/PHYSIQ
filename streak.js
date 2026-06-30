// ============================================================
// PHYSIQ — streak.js
// Drop this script on: dashboard, analyzer, macro-calculator,
// nutrition/meal planner pages.
// Call window.physiqStreak.update(db, userId) after any
// meaningful action to register the day as active.
// Call window.physiqStreak.render(db, userId) to just display
// the streak without counting the visit as an action.
// ============================================================

window.physiqStreak = (() => {

  // ---------- core logic ----------

  async function getOrCreate(db, userId) {
    const { data, error } = await db
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Row doesn't exist — create it
      const { data: newRow } = await db
        .from('user_streaks')
        .insert({ user_id: userId, current_streak: 1, longest_streak: 1, last_active_date: today() })
        .select()
        .single();
      return newRow;
    }
    return data;
  }

  async function update(db, userId) {
    const row = await getOrCreate(db, userId);
    if (!row) return null;

    const last = row.last_active_date; // 'YYYY-MM-DD' string
    const todayStr = today();
    const yesterdayStr = yesterday();

    let newStreak = row.current_streak;

    if (last === todayStr) {
      // Already checked in today — no change, just return current
      return row;
    } else if (last === yesterdayStr) {
      // Consecutive day — increment
      newStreak = row.current_streak + 1;
    } else {
      // Gap — reset
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, row.longest_streak);

    const { data: updated } = await db
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_active_date: todayStr
      })
      .eq('user_id', userId)
      .select()
      .single();

    renderPill(newStreak);
    animatePill();
    return updated;
  }

  async function render(db, userId) {
    const row = await getOrCreate(db, userId);
    if (!row) return;
    renderPill(row.current_streak);
  }

  // ---------- DOM ----------

  function renderPill(count) {
    const pill = document.getElementById('streakPill');
    if (!pill) return;
    const numEl = pill.querySelector('.streak-count');
    if (numEl) numEl.textContent = count;
    pill.style.display = 'flex';

    // Tooltip text
    const tip = pill.querySelector('.streak-tip');
    if (tip) {
      if (count === 1) tip.textContent = 'Day 1 — keep going!';
      else if (count < 7) tip.textContent = `${count} days — building momentum`;
      else if (count < 30) tip.textContent = `${count} days — you're locked in 🔒`;
      else tip.textContent = `${count} days — elite consistency 👑`;
    }
  }

  function animatePill() {
    const pill = document.getElementById('streakPill');
    if (!pill) return;
    pill.classList.add('streak-pop');
    setTimeout(() => pill.classList.remove('streak-pop'), 600);
  }

  // ---------- helpers ----------

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  return { update, render };
})();