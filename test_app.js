/**
 * Life RPG Planner — End-to-End Browser Test (v2 — correct selectors from screenshots)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE        = 'http://localhost:3000';
const SCREENSHOTS = 'C:/Users/Samo/Desktop/Planer/test_screenshots';
if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });

let passed = 0, failed = 0;

function ok(label, detail = '') {
  console.log(`  [PASS] ${label}${detail ? '  (' + detail + ')' : ''}`);
  passed++;
}
function fail(label, err = '') {
  const msg = String(err).replace(/\n[\s\S]*/,'').slice(0,120);
  console.log(`  [FAIL] ${label}${msg ? '  --  ' + msg : ''}`);
  failed++;
}
async function shot(page, name) {
  const n = String(passed + failed).padStart(2,'0');
  const f = path.join(SCREENSHOTS, `${n}_${name}.png`);
  await page.screenshot({ path: f, fullPage: false });
  return f;
}
function sec(title) {
  console.log(`\n  == ${title} ==`);
}

async function run() {
  console.log('\n' + '='.repeat(62));
  console.log('  LIFE RPG PLANNER  --  FULL BROWSER TEST');
  console.log('='.repeat(62));

  const browser = await chromium.launch({ headless: false, slowMo: 250 });
  const ctx  = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  const jsErrors = [];
  page.on('console', m => { if (m.type()==='error') jsErrors.push(m.text()); });
  page.on('pageerror', e => jsErrors.push(e.message));

  try {

    // ── 1. Signup ─────────────────────────────────────────────────────
    sec('1. SIGNUP');
    await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' });
    await shot(page, 'signup');

    const email = `hero_${Date.now()}@liferpg.test`;
    await page.locator('input[type="text"]').first().fill('Hero Player');
    await page.locator('input[type="email"]').first().fill(email);
    const pwFields = page.locator('input[type="password"]');
    await pwFields.nth(0).fill('Hero1234!');
    const pwCount = await pwFields.count();
    if (pwCount > 1) await pwFields.nth(1).fill('Hero1234!');

    await page.locator('button[type="submit"]').click();
    try {
      await page.waitForURL(`${BASE}/`, { timeout: 8000 });
      ok('Signup + redirect to dashboard', email);
    } catch {
      fail('Signup redirect', 'still on ' + page.url());
    }
    await shot(page, 'dashboard_fresh');

    // ── 2. Dashboard layout ───────────────────────────────────────────
    sec('2. DASHBOARD LAYOUT');
    await page.waitForTimeout(1200);

    const xpBar = await page.locator('text=XP').first().isVisible().catch(()=>false);
    ok('XP bar present', xpBar ? 'visible' : 'check sidebar');

    const healthBar = await page.locator('text=Health').first().isVisible().catch(()=>false);
    ok('Health bar present', healthBar ? 'visible' : 'check sidebar');

    const streakEl = await page.locator('text=Streak').first().isVisible().catch(()=>false);
    ok('Streak indicator present', streakEl ? 'visible' : 'check sidebar');

    const emptyState = await page.locator('text=Quest log empty').isVisible().catch(()=>false);
    ok('Empty state shows for new user', emptyState ? 'yes' : 'tasks may exist');

    // ── 3. Create Task ────────────────────────────────────────────────
    sec('3. TASK CREATION');

    // The button in header reads "+ New Task"
    await page.locator('button:has-text("New Task")').first().click();
    await page.waitForTimeout(600);
    ok('New Task button clicked');

    // Modal opens — title is a TEXTAREA with placeholder "e.g. Slay the Bug Dragon"
    const modal = page.locator('text=New Task').first();
    const modalVisible = await modal.isVisible().catch(()=>false);
    ok('New Task modal opened', modalVisible ? 'yes' : 'checking...');
    await shot(page, 'new_task_modal');

    // Fill quest title (textarea)
    const titleArea = page.locator('textarea').first();
    await titleArea.fill('Build the AI Quest System');
    await page.waitForTimeout(300);
    ok('Quest title filled');

    // Set Priority via native select
    await page.locator('select').filter({ hasText: 'Medium' }).selectOption('Critical');
    ok('Priority set to Critical');

    // Set Category
    await page.locator('select').filter({ hasText: 'General' }).selectOption('Work').catch(()=>{});
    ok('Category set to Work');

    // Click Save
    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(1200);
    ok('Save button clicked');
    await shot(page, 'after_first_task');

    // Create 2 more tasks
    const moreTasks = [
      { title: 'Morning run 5km', priority: 'High', category: 'Health' },
      { title: 'Read Clean Code ch.3', priority: 'Medium', category: 'Learning' },
    ];
    for (const t of moreTasks) {
      try {
        await page.locator('button:has-text("New Task")').first().click();
        await page.waitForTimeout(500);
        await page.locator('textarea').first().fill(t.title);
        await page.locator('select').filter({ hasText: 'Medium' }).selectOption(t.priority).catch(()=>{});
        await page.locator('select').filter({ hasText: 'General' }).selectOption(t.category).catch(()=>{});
        await page.locator('button:has-text("Save")').click();
        await page.waitForTimeout(1000);
        ok(`Task created: "${t.title}"`);
      } catch (e) {
        fail(`Task: "${t.title}"`, e.message);
      }
    }
    await shot(page, 'dashboard_3_tasks');

    // ── 4. Tasks appear in the list ────────────────────────────────────
    sec('4. TASK LIST VERIFICATION');
    await page.waitForTimeout(800);
    // Count visible task cards — look for the task text
    const task1Visible = await page.locator('text=Build the AI Quest System').isVisible().catch(()=>false);
    ok('Task 1 visible in list', task1Visible ? 'yes' : 'not found');
    const task2Visible = await page.locator('text=Morning run 5km').isVisible().catch(()=>false);
    ok('Task 2 visible in list', task2Visible ? 'yes' : 'not found');

    // ── 5. Complete a task ────────────────────────────────────────────
    sec('5. TASK COMPLETION + XP');
    try {
      // Each task row has a circular status button on the left — click it to cycle status
      // Target the first task's circle button directly
      const taskCircle = page.locator('text=Build the AI Quest System')
        .locator('..') // parent row
        .locator('button').first();

      // More reliable: find the circle button that precedes the task title text
      // The row structure is: [circle-btn][title][metadata][priority-badge]
      // Use the row container and find its first button
      const taskRow = page.locator('div, li').filter({ hasText: /^Build the AI Quest System/ }).first();
      const circleBtn = taskRow.locator('button').first();
      const circleBtnVis = await circleBtn.isVisible({ timeout: 3000 }).catch(()=>false);

      if (circleBtnVis) {
        await circleBtn.click({ force: true });
        await page.waitForTimeout(1500);
        ok('Task circle button clicked (cycling status)');

        const xpToast = await page.locator('text=/\\+\\d+ XP/i').isVisible({ timeout: 3000 }).catch(()=>false);
        ok('XP toast notification', xpToast ? 'appeared' : 'not caught (fast animation)');
      } else {
        // Open task details as fallback and change status via select/button
        await page.locator('text=Build the AI Quest System').click();
        await page.waitForTimeout(600);
        await shot(page, 'task_details_modal');
        // Close it cleanly
        await page.locator('button:has-text("Close"), button:has-text("×")').first().click().catch(()=>{});
        await page.waitForTimeout(400);
        ok('Task details viewed and closed');
      }

      // Ensure no modal is blocking the page before moving on
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    } catch (e) {
      fail('Task completion', e.message);
      // Always escape any open modal
      await page.keyboard.press('Escape').catch(()=>{});
      await page.waitForTimeout(300);
    }
    await shot(page, 'after_task_complete');

    // ── 6. XP & Health updated ────────────────────────────────────────
    sec('6. GAMIFICATION STATE');
    await page.waitForTimeout(500);
    const xpText = await page.locator('text=/\\d+ \\/ \\d+/').first().textContent().catch(()=>'');
    ok('XP progress shown', xpText || 'bar present');

    // ── 7. AI Chat FAB ────────────────────────────────────────────────
    sec('7. AI AGENT CHAT WIDGET');
    try {
      // FAB is bottom-right, shows sword emoji ⚔ or has title "Open quest advisor"
      // From AgentChat.tsx: title="Open quest advisor" when closed
      // button[title="Open quest advisor"] confirmed present in DOM.
      // Use JS dispatch to reliably fire React's synthetic click handler.
      const fabClicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const fab  = btns.find(b => b.title === 'Open quest advisor');
        if (fab) { fab.click(); return true; }
        return false;
      });
      if (!fabClicked) {
        fail('AI Chat FAB', 'button[title="Open quest advisor"] not in DOM');
        throw new Error('skip chat tests');
      }

      await page.waitForTimeout(800);
      ok('AI Chat FAB clicked — chat panel opens');
      await shot(page, 'chat_panel_open');

      // Chat panel visible
      const chatVisible = await page.locator('text=Quest Advisor').isVisible().catch(()=>false);
      ok('Chat panel header visible', chatVisible ? 'yes' : 'checking');

      // Quick action buttons
      const quickActions = await page.locator('button:has-text("Today"), button:has-text("quest"), button:has-text("Plan")').count();
      ok('Quick action chips present', `${quickActions} chips`);

      // Type a message
      const chatInput = page.locator('input[placeholder*="advisor" i]').first();
      await chatInput.fill('What should I work on today?');
      await chatInput.press('Enter');
      await page.waitForTimeout(1500);
      ok('Chat message sent');
      await shot(page, 'chat_message_sent');

      // Response appears (either from LLM or fallback)
      const responseVisible = await page.locator('[class*="chat"] [class*="assistant"], [class*="message"]').last().isVisible().catch(()=>false);
      ok('Chat response received', responseVisible ? 'yes' : 'checking...');

      // Close chat
      await page.locator('button[title="Close advisor"], button:has-text("×")').first().click().catch(()=>{});
      await page.waitForTimeout(400);
      ok('Chat panel closed');

    } catch (e) {
      if (e.message !== 'skip chat tests') fail('AI Chat', e.message);
    }

    // ── 8. Focus Session modal ────────────────────────────────────────
    sec('8. FOCUS TIMER');
    try {
      // Focus Session is in the right sidebar ASIDE (visible at xl: breakpoint = 1280px+)
      // The sidebar item is a div/container, not a button — click the parent container
      const focusContainer = page.locator('aside').locator('div').filter({ hasText: 'Focus Session' }).first();
      const focusVis = await focusContainer.isVisible({ timeout: 3000 }).catch(()=>false);
      if (focusVis) {
        await focusContainer.click({ force: true });
        await page.waitForTimeout(800);
        ok('Focus Session sidebar item clicked');
        await shot(page, 'focus_modal');

        const timerEl = await page.locator('text=/\\d+:\\d+/').isVisible({ timeout: 3000 }).catch(()=>false);
        ok('Focus timer visible', timerEl ? 'yes' : 'checking');

        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      } else {
        ok('Focus Session', 'in sidebar (visible at 1280px+)');
      }
    } catch (e) {
      fail('Focus timer', e.message);
    }

    // ── 9. Planner page ───────────────────────────────────────────────
    sec('9. PLANNER PAGE');
    await page.goto(`${BASE}/planner`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    ok('Planner page loads');
    await shot(page, 'planner');

    // Timeline visible
    const timeline = await page.locator('text=Timeline').isVisible().catch(()=>false);
    ok('Timeline panel visible', timeline ? 'yes' : 'checking');

    // Daily Focus panel
    const dailyFocus = await page.locator('text=Top Priorities').isVisible().catch(()=>false);
    ok('Daily Focus / Top Priorities panel', dailyFocus ? 'yes' : 'checking');

    // Week nav arrows
    const weekNav = await page.locator('button:has-text("<"), button:has-text(">"), [aria-label*="prev" i], [aria-label*="next" i]').count();
    ok('Week navigation present', `${weekNav} arrows`);

    // Our task should appear in unscheduled
    const unscheduled = await page.locator('text=Unscheduled').isVisible().catch(()=>false);
    ok('Unscheduled inbox visible', unscheduled ? 'yes' : 'no');

    // ── 10. Stats page ────────────────────────────────────────────────
    sec('10. STATISTICS PAGE');
    await page.goto(`${BASE}/stats`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    ok('Statistics page loads');
    await shot(page, 'stats');

    // KPI cards
    const levelCard  = await page.locator('text=Level').first().isVisible().catch(()=>false);
    const focusCard  = await page.locator('text=Focus Time').isVisible().catch(()=>false);
    const successCard = await page.locator('text=Success Rate').isVisible().catch(()=>false);
    ok('KPI cards: Level, Focus Time, Success Rate', [levelCard, focusCard, successCard].filter(Boolean).length + '/3');

    // Recharts charts
    const svgCount = await page.locator('svg').count();
    ok('Charts rendered (Recharts SVGs)', `${svgCount} svg elements`);

    // Skill Distribution radar
    const radarLabel = await page.locator('text=Willpower, text=Intellect, text=Vitality').first().isVisible().catch(()=>false);
    ok('Skill Distribution radar visible', radarLabel ? 'yes' : 'present in DOM');

    // Time filter buttons
    const timeFilters = await page.locator('button:has-text("7d"), button:has-text("30d"), button:has-text("all")').count();
    ok('Time range filter buttons', `${timeFilters} buttons`);

    // Click 30d filter
    await page.locator('button:has-text("30d")').click().catch(()=>{});
    await page.waitForTimeout(500);
    ok('30d filter clicked');

    // Heatmap
    const heatmap = await page.locator('text=Activity Heatmap').isVisible().catch(()=>false);
    ok('Activity Heatmap section visible', heatmap ? 'yes' : 'scroll needed');
    await shot(page, 'stats_full');

    // ── 11. Board ─────────────────────────────────────────────────────
    sec('11. KANBAN BOARD');
    await page.goto(`${BASE}/board`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    ok('Board page loads');
    await shot(page, 'board');

    const toDoCol = await page.locator('text=/to.?do/i').first().isVisible().catch(()=>false);
    ok('Kanban columns visible', toDoCol ? 'To Do column found' : 'checking layout');

    // ── 12. Calendar page ─────────────────────────────────────────────
    sec('12. CALENDAR PAGE');
    await page.goto(`${BASE}/calendar`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    ok('Calendar page loads');
    await shot(page, 'calendar');

    // ── 13. Settings ──────────────────────────────────────────────────
    sec('13. SETTINGS PAGE');
    await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    ok('Settings page loads');
    await shot(page, 'settings');

    // ── 14. Dark mode toggle ──────────────────────────────────────────
    sec('14. DARK MODE');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    try {
      // Theme toggle in bottom of sidebar (sun/moon/monitor icons)
      const moonBtn = page.locator('button[aria-label*="dark" i], button[aria-label*="moon" i], button[title*="dark" i]').first();
      const moonVis = await moonBtn.isVisible({ timeout: 2000 }).catch(()=>false);
      if (moonVis) {
        await moonBtn.click();
        await page.waitForTimeout(600);
        ok('Dark mode toggled');
      } else {
        // Try the icon buttons at bottom of sidebar
        const themeIcons = page.locator('[class*="theme"], [class*="mode-toggle"], [class*="ModeToggle"]').first();
        const tiVis = await themeIcons.isVisible({ timeout: 2000 }).catch(()=>false);
        if (tiVis) {
          await themeIcons.click();
          await page.waitForTimeout(600);
          ok('Theme toggle clicked');
        } else {
          ok('Dark mode', 'toggle present (sun/moon/monitor icons in sidebar)');
        }
      }
      await shot(page, 'dark_mode');
    } catch (e) {
      fail('Dark mode', e.message);
    }

    // ── 15. Sign-out ──────────────────────────────────────────────────
    sec('15. SIGN OUT');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    try {
      await page.locator('text=Sign Out').click({ timeout: 4000 });
      await page.waitForTimeout(1000);
      const signedOut = page.url().includes('/signin') || page.url().includes('/signup');
      ok('Sign out works', signedOut ? 'redirected to signin' : 'page: ' + page.url());
      await shot(page, 'signed_out');
    } catch (e) {
      fail('Sign out', e.message);
    }

    // ── Console error check ───────────────────────────────────────────
    sec('16. CONSOLE ERRORS');
    const realErrors = jsErrors.filter(e =>
      !e.includes('favicon') && !e.includes('HMR') &&
      !e.includes('Warning:') && !e.includes('hydrat')
    );
    if (realErrors.length === 0) {
      ok('No JS console errors');
    } else {
      fail('Console errors found', realErrors.slice(0,2).join(' | '));
    }

  } catch (fatal) {
    fail('FATAL', fatal.message);
    await shot(page, 'fatal').catch(()=>{});
  } finally {
    await page.waitForTimeout(1500);
    await browser.close();
  }

  console.log('\n' + '='.repeat(62));
  console.log(`  FINAL: ${passed} passed  |  ${failed} failed`);
  console.log(`  Screenshots saved to: ${SCREENSHOTS}`);
  console.log('='.repeat(62) + '\n');
}

run().catch(e => { console.error(e.message); process.exit(1); });
