// ══════════════════════════════════════════════════════════════
// MindShift PWA — Main Application
// Premium behavior change app based on peer-reviewed science
// ══════════════════════════════════════════════════════════════

import { GOALS, HABITS, ENV_TIPS, COMPASSION, PILLARS, PHASES, TTM_STAGES,
         MINDFUL_PRACTICES, CBT_MESSAGES, WEEKLY_REVIEW_PROMPTS,
         AUTOMATICITY_QUESTIONS } from './habits.js';
import { haptic, launchConfetti } from './celebrations.js';
import { renderWeeklyChart, renderAutomaticityMeter } from './charts.js';
import { icons } from './icons.js';
import { AICoach } from './ai-coach.js';

// ── State ─────────────────────────────────────────────────────
const STORAGE_KEY = 'mindshift-v2';
const DEFAULT_STATE = {
  version: 2,
  onboarded: false,
  userName: '',
  ttmStage: 'action',
  currentDay: 1,
  streak: 0,
  bestStreak: 0,
  totalVotes: 0,
  lastActiveDate: '',
  dailyChecks: {},
  journal: [],
  environmentChecks: {},
  weeklyReflections: [],
  automaticityScores: {},
  copingPlansEnabled: true,
  startDate: new Date().toISOString().split('T')[0],
  theme: 'auto'
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const s = JSON.parse(raw);
    // Schema migration / validation
    return { ...DEFAULT_STATE, ...s, version: 2 };
  } catch (e) {
    return { ...DEFAULT_STATE };
  }
}

let state = loadState();
let screen = state.onboarded ? 'home' : 'onboarding';
let onboardStep = 0;
let openPillar = null;
let journalText = '';
let weeklyText = '';
let showCelebration = false;
let coachMessages = [];
let coachInput = '';
let scrollPositions = {};

const coach = new AICoach();

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function today() { return new Date().toISOString().split('T')[0]; }

function daysSinceStart() {
  return Math.max(1, Math.floor((Date.now() - new Date(state.startDate).getTime()) / 86400000) + 1);
}

function currentWeek() { return Math.ceil(daysSinceStart() / 7); }

function currentPhase() {
  const w = currentWeek();
  return PHASES.find(p => w >= p.s && w <= p.e) || PHASES[PHASES.length - 1];
}

function todayChecks() { return state.dailyChecks[today()] || {}; }
function todayTotal() { return Object.values(todayChecks()).filter(Boolean).length; }
function totalPossible() { return GOALS.length * 3; }

// ── Day Transition Logic (fixes streak bug) ───────────────────
function processNewDay() {
  const t = today();
  if (state.lastActiveDate && state.lastActiveDate !== t) {
    const lastChecks = state.dailyChecks[state.lastActiveDate] || {};
    const lastCompleted = Object.values(lastChecks).filter(Boolean).length;
    const wasGoodDay = lastCompleted >= totalPossible() * 0.6;

    // Check if yesterday was missed entirely
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().split('T')[0];

    if (state.lastActiveDate !== yKey && state.lastActiveDate !== t) {
      // Missed one or more days
      state.streak = 0;
    } else if (!wasGoodDay) {
      state.streak = 0;
    }
  }
  state.lastActiveDate = t;
  save();
}

// ── Theme ─────────────────────────────────────────────────────
function applyTheme() {
  const t = state.theme;
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else if (t === 'light') document.documentElement.removeAttribute('data-theme');
  else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  state.theme = isDark ? 'light' : 'dark';
  applyTheme();
  save();
  render();
}

// ── DOM Helpers ───────────────────────────────────────────────
const $ = id => document.getElementById(id);
const app = $('app');

function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => {
    if (k.startsWith('on')) el[k] = v;
    else if (k === 'className') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v);
  });
  children.flat(Infinity).forEach(c => {
    if (c == null || c === false) return;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return el;
}

function iconEl(name, size, color) {
  const fn = icons[name];
  return fn ? fn(size, color) : document.createTextNode('');
}

// ── Toggle Habit ──────────────────────────────────────────────
function toggleHabit(goalId, idx) {
  const d = today();
  if (!state.dailyChecks[d]) state.dailyChecks[d] = {};
  const key = goalId + '-' + idx;
  const wasBefore = todayTotal();

  state.dailyChecks[d][key] = !state.dailyChecks[d][key];
  const isAfter = todayTotal();
  const tp = totalPossible();

  if (state.dailyChecks[d][key]) {
    state.totalVotes++;
    haptic('light');
  } else {
    state.totalVotes = Math.max(0, state.totalVotes - 1);
  }

  // Streak logic: threshold is 60%
  const wasGood = wasBefore >= tp * 0.6;
  const isGood = isAfter >= tp * 0.6;
  if (!wasGood && isGood) {
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    showCelebration = true;
    haptic('celebration');
    launchConfetti(2500);
    setTimeout(() => { showCelebration = false; render(); }, 3000);
  } else if (wasGood && !isGood) {
    state.streak = Math.max(0, state.streak - 1);
  }

  save();
  render();

  // Animate the checkbox
  setTimeout(() => {
    const cb = document.querySelector(`[data-habit="${key}"] .checkbox`);
    if (cb && state.dailyChecks[d][key]) cb.classList.add('just-checked');
  }, 10);
}

// ── Render: Navigation ────────────────────────────────────────
function renderNav() {
  const items = [
    { id: 'home', icon: 'home', label: 'Hoje' },
    { id: 'science', icon: 'science', label: 'Ciencia' },
    { id: 'environment', icon: 'environment', label: 'Ambiente' },
    { id: 'journal', icon: 'journal', label: 'Diario' },
    { id: 'coach', icon: 'coach', label: 'Coach' }
  ];
  const nav = h('div', { className: 'nav' });
  items.forEach(it => {
    const btn = h('button', {
      className: 'nav-btn' + (screen === it.id ? ' active' : ''),
      onclick: () => { scrollPositions[screen] = app.scrollTop; screen = it.id; render(); }
    },
      h('span', { className: 'nav-icon' }, iconEl(it.icon, 22)),
      h('span', { className: 'nav-label' }, it.label)
    );
    nav.appendChild(btn);
  });
  return nav;
}

// ── Render: Home ──────────────────────────────────────────────
function renderHome() {
  const tc = todayChecks();
  const tt = todayTotal();
  const tp = totalPossible();
  const pct = Math.min(100, Math.round(tt / tp * 100));
  const ds = daysSinceStart();
  const cp = currentPhase();
  const cw = currentWeek();
  const compassionText = COMPASSION[ds % COMPASSION.length];

  const frag = document.createDocumentFragment();

  // Hero
  frag.appendChild(h('div', { className: 'hero' },
    h('div', { className: 'hero-phase' }, 'Dia ' + ds + ' \u00b7 Semana ' + cw),
    h('div', { className: 'hero-title' }, 'Cada habito e um voto na pessoa que estou a tornar-me'),
    h('span', { className: 'hero-badge', style: { background: cp.color + '40' } },
      'Fase: ' + cp.phase + ' (Sem ' + cp.week + ')')
  ));

  // Stats
  frag.appendChild(h('div', { className: 'stats' },
    h('div', { className: 'stat', style: { background: 'var(--warning-bg)' } },
      h('div', { className: 'stat-val' },
        '' + state.streak + ' ',
        h('span', { className: 'streak-fire' }, iconEl('fire', 18, '#F59E0B'))
      ),
      h('div', { className: 'stat-label' }, 'Streak')
    ),
    h('div', { className: 'stat', style: { background: 'var(--accent-light)' } },
      h('div', { className: 'stat-val' }, '' + state.totalVotes),
      h('div', { className: 'stat-label' }, 'Votos')
    ),
    h('div', { className: 'stat', style: { background: 'var(--success-bg)' } },
      h('div', { className: 'stat-val' }, state.bestStreak + ' dias'),
      h('div', { className: 'stat-label' }, 'Melhor')
    )
  ));

  // Progress
  const pctColor = pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--text-muted)';
  const fillGrad = pct >= 80 ? 'linear-gradient(90deg,#059669,#10B981)'
    : pct >= 40 ? 'linear-gradient(90deg,#D97706,#FBBF24)'
    : 'linear-gradient(90deg,#6366F1,#818CF8)';

  frag.appendChild(h('div', { className: 'progress-card' },
    h('div', { className: 'progress-header' },
      h('span', { className: 'progress-title' }, 'Progresso de Hoje'),
      h('span', { className: 'progress-pct', style: { color: pctColor } },
        tt + '/' + tp + ' (' + pct + '%)')
    ),
    h('div', { className: 'progress-track' },
      h('div', { className: 'progress-fill' + (pct >= 100 ? ' complete' : ''),
        style: { width: pct + '%', background: fillGrad } })
    )
  ));

  // Mindful Practice (before meals - Katterman et al.)
  const mp = MINDFUL_PRACTICES[ds % MINDFUL_PRACTICES.length];
  frag.appendChild(h('div', { className: 'mindful-card' },
    h('div', { className: 'mindful-title' }, iconEl('seedling', 16, '#059669'), ' ' + mp.title),
    h('div', { className: 'mindful-duration' }, mp.duration),
    h('div', { className: 'mindful-instruction' }, mp.instruction)
  ));

  // Goals
  GOALS.forEach(goal => {
    const habits = HABITS[goal.id];
    const checked = habits.filter((_, i) => tc[goal.id + '-' + i]).length;
    const card = h('div', { className: 'goal-card', style: { borderLeftColor: goal.color } });

    card.appendChild(h('div', { className: 'goal-header' },
      h('div', { className: 'goal-info' },
        h('div', { className: 'goal-icon', style: { background: goal.color + '15' } },
          iconEl(goal.icon, 22, goal.color)),
        h('div', null,
          h('div', { className: 'goal-name' }, goal.label),
          h('div', { className: 'goal-identity' }, goal.identity))
      ),
      h('div', { className: 'goal-count',
        style: { background: checked === 3 ? 'var(--success-bg)' : 'var(--border-light)',
                 color: checked === 3 ? 'var(--success)' : 'var(--text-muted)' }
      }, checked + '/3')
    ));

    habits.forEach((hab, i) => {
      const key = goal.id + '-' + i;
      const isDone = !!tc[key];
      const row = h('div', { className: 'habit-row', 'data-habit': key,
        onclick: () => toggleHabit(goal.id, i) });

      const cb = h('div', { className: 'checkbox' + (isDone ? ' checked' : ''),
        style: { '--goal-color': goal.color } });
      if (isDone) {
        cb.style.borderColor = goal.color;
        cb.style.background = goal.color;
        cb.appendChild(iconEl('check', 14, '#fff'));
      }

      const textDiv = h('div', { style: { flex: '1' } },
        h('div', { className: 'habit-text' + (isDone ? ' done' : '') }, hab.text)
      );
      if (hab.min > 0) textDiv.appendChild(h('span', { className: 'habit-time' }, '~' + hab.min + ' min'));

      // Coping plan (Gollwitzer) - show when not done
      if (!isDone && state.copingPlansEnabled && hab.copingPlan) {
        textDiv.appendChild(h('span', { className: 'habit-coping' }, '\u26a1 ' + hab.copingPlan));
      }

      row.appendChild(cb);
      row.appendChild(textDiv);
      card.appendChild(row);
    });
    frag.appendChild(card);
  });

  // Weekly Chart
  const chartCard = h('div', { className: 'chart-card' },
    h('div', { className: 'chart-title' }, 'Ultima Semana')
  );
  const chartContainer = h('div', { className: 'chart-container' });
  chartCard.appendChild(chartContainer);
  frag.appendChild(chartCard);
  setTimeout(() => renderWeeklyChart(chartContainer, state.dailyChecks, totalPossible()), 50);

  // Automaticity Meter (Lally, UCL)
  const autoCard = h('div', { className: 'auto-meter' });
  frag.appendChild(autoCard);
  const autoScore = calculateAutomaticity();
  setTimeout(() => renderAutomaticityMeter(autoCard, autoScore), 50);

  // Compassion (Kristin Neff)
  frag.appendChild(h('div', { className: 'compassion' },
    h('div', { className: 'compassion-label' }, iconEl('heart', 14, '#E11D48'), ' Autocompaixao do dia'),
    h('div', { className: 'compassion-text' }, compassionText)
  ));

  // Failure Recovery (if streak is 0 and was active before)
  if (state.streak === 0 && state.bestStreak > 0) {
    const recoveryMsg = CBT_MESSAGES.streak_broken[ds % CBT_MESSAGES.streak_broken.length];
    frag.appendChild(h('div', { className: 'recovery-card' },
      h('div', { className: 'recovery-label' }, iconEl('sparkle', 14, '#92400E'), ' Recomeco Consciente'),
      h('div', { className: 'recovery-text' }, recoveryMsg)
    ));
  }

  return frag;
}

// ── Automaticity Score ────────────────────────────────────────
function calculateAutomaticity() {
  const scores = Object.values(state.automaticityScores);
  if (scores.length === 0) {
    // Estimate from consistency
    const days = Object.keys(state.dailyChecks).length;
    const goodDays = Object.values(state.dailyChecks).filter(
      d => Object.values(d).filter(Boolean).length >= totalPossible() * 0.6
    ).length;
    return days > 0 ? Math.round((goodDays / days) * 100) : 0;
  }
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ── Render: Science ───────────────────────────────────────────
function renderScience() {
  const frag = document.createDocumentFragment();
  frag.appendChild(h('h2', { className: 'page-title' }, 'A Ciencia por Tras'));
  frag.appendChild(h('p', { className: 'page-desc' },
    'Cada elemento desta aplicacao e baseado em investigacao peer-reviewed.'));

  PILLARS.forEach(p => {
    const card = h('div', { className: 'pillar-card', style: { borderLeftColor: p.color },
      onclick: () => { openPillar = openPillar === p.id ? null : p.id; render(); } });

    card.appendChild(h('div', { className: 'pillar-header' },
      h('span', { className: 'pillar-icon', style: { background: p.color + '15' } },
        iconEl(p.icon, 20, p.color)),
      h('div', { style: { flex: '1' } },
        h('div', { className: 'pillar-title' }, p.title),
        h('div', { className: 'pillar-subtitle', style: { color: p.color } }, p.subtitle)
      ),
      h('span', null, openPillar === p.id ? iconEl('chevronUp', 16, '#9CA3AF') : iconEl('chevronDown', 16, '#9CA3AF'))
    ));

    if (openPillar === p.id) {
      card.appendChild(h('div', { className: 'pillar-body' },
        h('div', { className: 'pillar-desc' }, p.desc),
        h('div', { className: 'pillar-source' }, 'Fonte: ' + p.science)
      ));
    }
    frag.appendChild(card);
  });

  // Phase Timeline
  frag.appendChild(h('h3', { className: 'page-title', style: { marginTop: '28px' } },
    'Fases de Mudanca (12 semanas)'));
  const timeline = h('div', { className: 'timeline' });
  timeline.appendChild(h('div', { className: 'timeline-line' }));
  const cp = currentPhase();
  PHASES.forEach(wp => {
    const isActive = cp.week === wp.week;
    const item = h('div', { className: 'timeline-item' });
    item.appendChild(h('div', { className: 'timeline-dot' + (isActive ? ' active' : ''),
      style: { background: isActive ? wp.color : 'var(--border)',
               boxShadow: isActive ? '0 0 0 3px ' + wp.color + '40' : 'none' } }));
    item.appendChild(h('div', { className: 'timeline-content',
      style: { background: isActive ? wp.color + '10' : 'var(--bg-card)',
               borderColor: isActive ? wp.color + '30' : 'var(--border-light)' } },
      h('div', { className: 'timeline-phase', style: { color: wp.color } },
        'Semana ' + wp.week + ' \u2014 ' + wp.phase + (isActive ? ' \u2190 Aqui' : '')),
      h('div', { className: 'timeline-desc' }, wp.desc)
    ));
    timeline.appendChild(item);
  });
  frag.appendChild(timeline);
  return frag;
}

// ── Render: Environment ───────────────────────────────────────
function renderEnvironment() {
  const frag = document.createDocumentFragment();
  frag.appendChild(h('h2', { className: 'page-title' }, 'Design do Ambiente'));
  frag.appendChild(h('p', { className: 'page-desc' },
    'Wendy Wood (USC): 40-45% dos comportamentos sao automaticos. Muda o contexto, nao a vontade.'));

  GOALS.forEach(goal => {
    const card = h('div', { className: 'env-card' });
    card.appendChild(h('div', { className: 'env-header' },
      h('span', null, iconEl(goal.icon, 22, goal.color)),
      h('span', { className: 'env-title' }, goal.label)
    ));
    ENV_TIPS[goal.id].forEach((tip, i) => {
      const key = goal.id + '-' + i;
      const done = !!state.environmentChecks[key];
      const row = h('div', { className: 'env-row', onclick: () => {
        state.environmentChecks[key] = !state.environmentChecks[key];
        haptic('light'); save(); render();
      }});
      const check = h('div', { className: 'env-check' + (done ? ' done' : '') });
      if (done) {
        check.style.borderColor = goal.color; check.style.background = goal.color;
        check.appendChild(iconEl('check', 12, '#fff'));
      }
      row.appendChild(check);
      row.appendChild(h('div', { className: 'env-text' + (done ? ' done' : '') }, tip));
      card.appendChild(row);
    });
    frag.appendChild(card);
  });
  return frag;
}

// ── Render: Journal ───────────────────────────────────────────
function renderJournal() {
  const frag = document.createDocumentFragment();
  frag.appendChild(h('h2', { className: 'page-title' }, 'Diario de Reflexao'));
  frag.appendChild(h('p', { className: 'page-desc' },
    'Escrever sobre o processo consolida a identidade e processa emocoes (Pennebaker, UT Austin).'));

  // Daily journal
  const dc = h('div', { className: 'journal-card' });
  dc.appendChild(h('div', { className: 'journal-label' }, 'Reflexao diaria'));
  const ta = h('textarea', { className: 'journal-textarea',
    placeholder: 'O que correu bem hoje? O que aprendi? Como me senti?',
    oninput: (e) => { journalText = e.target.value; } });
  ta.value = journalText;
  dc.appendChild(ta);
  const hasText = journalText.trim().length > 0;
  dc.appendChild(h('button', {
    className: 'btn mt-8 ' + (hasText ? 'btn-primary' : 'btn-disabled'),
    onclick: () => {
      if (!journalText.trim()) return;
      state.journal.unshift({ date: today(), text: journalText.trim() });
      if (state.journal.length > 100) state.journal = state.journal.slice(0, 100);
      journalText = ''; haptic('medium'); save(); render();
    }
  }, 'Guardar reflexao'));
  frag.appendChild(dc);

  // Weekly review (structured)
  const wc = h('div', { className: 'weekly-card' });
  wc.appendChild(h('div', { className: 'weekly-label' }, 'Revisao Semanal'));
  const prompt = WEEKLY_REVIEW_PROMPTS[currentWeek() % WEEKLY_REVIEW_PROMPTS.length];
  wc.appendChild(h('div', { className: 'weekly-hint' }, prompt));
  const wta = h('textarea', { className: 'weekly-textarea',
    placeholder: 'A tua revisao semanal...',
    oninput: (e) => { weeklyText = e.target.value; } });
  wta.value = weeklyText;
  wc.appendChild(wta);
  wc.appendChild(h('button', {
    className: 'btn mt-8 ' + (weeklyText.trim() ? 'btn-primary' : 'btn-disabled'),
    style: { background: weeklyText.trim() ? '#3730A3' : '' },
    onclick: () => {
      if (!weeklyText.trim()) return;
      state.weeklyReflections.unshift({ date: today(), text: weeklyText.trim() });
      weeklyText = ''; haptic('medium'); save(); render();
    }
  }, 'Guardar revisao semanal'));
  frag.appendChild(wc);

  // Automaticity check (SRHI - Lally)
  if (currentWeek() >= 2 && new Date().getDay() === 0) {
    const aq = h('div', { className: 'coach-card' });
    aq.appendChild(h('div', { className: 'journal-label' }, 'Avaliacao de Automaticidade (semanal)'));
    aq.appendChild(h('p', { className: 'page-desc', style: { marginBottom: '12px' } },
      'Phillippa Lally (UCL): Responde honestamente para medir o teu progresso.'));
    AUTOMATICITY_QUESTIONS.forEach((q, i) => {
      const key = 'auto-w' + currentWeek() + '-' + i;
      const val = state.automaticityScores[key];
      aq.appendChild(h('div', { style: { marginBottom: '12px' } },
        h('div', { style: { fontSize: '13px', marginBottom: '6px' } }, q),
        h('div', { style: { display: 'flex', gap: '6px' } },
          ...[1, 2, 3, 4, 5].map(n =>
            h('button', {
              className: 'btn ' + (val === n * 20 ? 'btn-primary' : 'btn-secondary'),
              style: { padding: '6px 12px', fontSize: '12px' },
              onclick: () => { state.automaticityScores[key] = n * 20; save(); render(); }
            }, '' + n)
          )
        )
      ));
    });
    frag.appendChild(aq);
  }

  // Past entries
  if (state.journal.length > 0) {
    frag.appendChild(h('div', { style: { fontSize: '14px', fontWeight: '700',
      color: 'var(--text-primary)', marginBottom: '10px', marginTop: '20px' } },
      'Entradas anteriores'));
    state.journal.slice(0, 15).forEach(entry => {
      frag.appendChild(h('div', { className: 'entry-card' },
        h('div', { className: 'entry-date' }, entry.date),
        h('div', { className: 'entry-text' }, entry.text)
      ));
    });
  }

  // Reset
  frag.appendChild(h('div', { className: 'text-center', style: { marginTop: '30px' } },
    h('button', { className: 'btn btn-danger',
      onclick: () => {
        if (confirm('Tens a certeza? Isto apaga todos os dados.')) {
          localStorage.removeItem(STORAGE_KEY);
          state = { ...DEFAULT_STATE };
          screen = 'onboarding'; onboardStep = 0;
          save(); render();
        }
      }
    }, 'Reiniciar tudo')
  ));

  return frag;
}

// ── Render: Coach ─────────────────────────────────────────────
function renderCoach() {
  const frag = document.createDocumentFragment();
  frag.appendChild(h('h2', { className: 'page-title' }, 'Coach IA'));
  frag.appendChild(h('p', { className: 'page-desc' },
    'Reflexao guiada baseada em Motivational Interviewing e CBT. ' +
    (coach.enabled ? 'Gemini AI ativo.' : 'Modo local (sem API).')));

  // API Key setup
  if (!coach.enabled) {
    const setup = h('div', { className: 'coach-card' });
    setup.appendChild(h('div', { className: 'journal-label' }, 'Ativar IA (opcional)'));
    setup.appendChild(h('p', { style: { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' } },
      'Funciona sem IA com mensagens CBT pre-escritas. Para respostas personalizadas, introduz a tua chave Gemini API (gratis em ai.google.dev).'));
    const input = h('input', { className: 'coach-input', type: 'password',
      placeholder: 'Chave API Gemini (opcional)',
      oninput: (e) => { coachInput = e.target.value; } });
    setup.appendChild(input);
    setup.appendChild(h('button', {
      className: 'btn btn-primary mt-8',
      onclick: () => { if (coachInput.trim()) { coach.setApiKey(coachInput.trim()); coachInput = ''; render(); } }
    }, 'Ativar'));
    frag.appendChild(setup);
  }

  // Greeting
  if (coachMessages.length === 0) {
    coachMessages.push({ role: 'coach', text: coach.getGreeting(state) });
  }

  // Chat messages
  coachMessages.forEach(msg => {
    if (msg.role === 'coach') {
      const card = h('div', { className: 'coach-card' });
      card.appendChild(h('div', { className: 'coach-header' },
        h('div', { className: 'coach-avatar' }, iconEl('sparkle', 18, '#fff')),
        h('div', null,
          h('div', { className: 'coach-name' }, 'MindShift Coach'),
          h('div', { className: 'coach-status' }, msg.source === 'ai' ? 'Gemini AI' : 'Baseado em CBT'))
      ));
      card.appendChild(h('div', { className: 'coach-msg' }, msg.text));
      frag.appendChild(card);
    } else {
      frag.appendChild(h('div', { style: {
        background: 'var(--accent)', color: '#fff', padding: '12px 16px',
        borderRadius: '16px 16px 4px 16px', marginBottom: '12px',
        fontSize: '14px', marginLeft: '40px'
      }}, msg.text));
    }
  });

  // Input
  const inputWrap = h('div', { className: 'coach-input-wrap', style: { marginTop: '8px' } });
  const chatInput = h('input', { className: 'coach-input',
    placeholder: 'Como te sentes hoje?',
    oninput: (e) => { coachInput = e.target.value; },
    onkeydown: (e) => { if (e.key === 'Enter') sendCoachMessage(); }
  });
  chatInput.value = coachInput;
  inputWrap.appendChild(chatInput);
  inputWrap.appendChild(h('button', { className: 'coach-send',
    onclick: sendCoachMessage
  }, iconEl('send', 18, '#fff')));
  frag.appendChild(inputWrap);

  // Remove API key option
  if (coach.enabled) {
    frag.appendChild(h('div', { className: 'text-center', style: { marginTop: '16px' } },
      h('button', { className: 'btn btn-danger',
        onclick: () => { coach.removeApiKey(); render(); }
      }, 'Remover chave API')
    ));
  }

  return frag;
}

async function sendCoachMessage() {
  if (!coachInput.trim()) return;
  const msg = coachInput.trim();
  coachMessages.push({ role: 'user', text: msg });
  coachInput = '';
  render();

  const reply = await coach.chat(msg, state);
  coachMessages.push({ role: 'coach', text: reply.text, source: reply.source });
  render();
  // Scroll to bottom
  setTimeout(() => { app.scrollTop = app.scrollHeight; }, 100);
}

// ── Render: Onboarding (TTM-based) ───────────────────────────
function renderOnboarding() {
  const steps = [
    {
      step: 'Passo 1 de 4',
      title: 'Como te chamas?',
      desc: 'Vamos personalizar a tua experiencia.',
      type: 'input'
    },
    {
      step: 'Passo 2 de 4',
      title: 'Em que fase de mudanca estas?',
      desc: 'Baseado no Modelo Transteorico (Prochaska & DiClemente). Isto permite adaptar a experiencia ao teu estagio.',
      type: 'select',
      options: TTM_STAGES
    },
    {
      step: 'Passo 3 de 4',
      title: 'O que te motiva?',
      desc: 'Self-Determination Theory (Deci & Ryan): Motivacao intrinseca e mais duradoura.',
      type: 'select',
      options: [
        { id: 'health', label: 'Saude', desc: 'Quero sentir-me melhor fisicamente' },
        { id: 'energy', label: 'Energia', desc: 'Quero ter mais energia no dia-a-dia' },
        { id: 'identity', label: 'Identidade', desc: 'Quero tornar-me a pessoa que sei que posso ser' },
        { id: 'family', label: 'Familia', desc: 'Quero estar presente e saudavel para quem amo' }
      ]
    },
    {
      step: 'Passo 4 de 4',
      title: 'Vamos comecar pequeno',
      desc: 'BJ Fogg (Stanford): Comeca tao pequeno que e impossivel falhar. Nos primeiros dias, marca apenas 1 habito por dia. Sem pressao.',
      type: 'info'
    }
  ];

  const current = steps[onboardStep];
  const ob = h('div', { className: 'onboarding' });
  const content = h('div', { className: 'onboarding-content' });

  // Dots
  const dots = h('div', { className: 'onboarding-dots' });
  steps.forEach((_, i) => {
    dots.appendChild(h('div', { className: 'onboarding-dot' + (i === onboardStep ? ' active' : i < onboardStep ? ' active' : '') }));
  });
  content.appendChild(dots);

  content.appendChild(h('div', { className: 'onboarding-step' }, current.step));
  content.appendChild(h('div', { className: 'onboarding-title' }, current.title));
  content.appendChild(h('div', { className: 'onboarding-desc' }, current.desc));

  if (current.type === 'input') {
    const input = h('input', { className: 'onboarding-input', placeholder: 'O teu nome',
      value: state.userName || '',
      oninput: (e) => { state.userName = e.target.value; } });
    content.appendChild(input);
  } else if (current.type === 'select') {
    const opts = h('div', { className: 'onboarding-options' });
    current.options.forEach(opt => {
      const isSelected = onboardStep === 1 ? state.ttmStage === opt.id
        : state.motivation === opt.id;
      const el = h('div', {
        className: 'onboarding-option' + (isSelected ? ' selected' : ''),
        onclick: () => {
          if (onboardStep === 1) state.ttmStage = opt.id;
          else state.motivation = opt.id;
          haptic('light'); render();
        }
      },
        h('div', { className: 'onboarding-option-title' }, opt.label),
        h('div', { className: 'onboarding-option-desc' }, opt.desc || opt.approach || '')
      );
      opts.appendChild(el);
    });
    content.appendChild(opts);
  }

  ob.appendChild(content);

  // Footer
  const footer = h('div', { className: 'onboarding-footer' });
  if (onboardStep > 0) {
    footer.appendChild(h('button', { className: 'btn btn-secondary', style: { flex: '1' },
      onclick: () => { onboardStep--; render(); }
    }, 'Voltar'));
  }
  const isLast = onboardStep === steps.length - 1;
  footer.appendChild(h('button', { className: 'btn btn-primary', style: { flex: '1' },
    onclick: () => {
      if (isLast) {
        state.onboarded = true;
        screen = 'home';
        haptic('success');
        save();
      } else {
        onboardStep++;
      }
      render();
    }
  }, isLast ? 'Comecar a Jornada' : 'Seguinte'));
  ob.appendChild(footer);

  return ob;
}

// ── Main Render ───────────────────────────────────────────────
function render() {
  const prevScroll = app.scrollTop;

  if (screen === 'onboarding') {
    app.textContent = '';
    app.appendChild(renderOnboarding());
    document.querySelectorAll('.nav').forEach(n => n.remove());
    return;
  }

  app.textContent = '';

  // Header
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const header = h('div', { className: 'header' },
    h('div', { className: 'header-row' },
      h('div', null,
        h('div', { className: 'logo' }, 'MindShift'),
        h('div', { className: 'logo-sub' }, 'Mudanca baseada em evidencia')
      ),
      h('div', { className: 'header-actions' },
        h('button', { className: 'icon-btn', onclick: toggleTheme },
          isDark ? iconEl('sun', 18) : iconEl('moon', 18)),
        h('div', { className: 'date-text' }, today())
      )
    )
  );
  app.appendChild(header);

  // Content
  const content = h('div', { className: 'content' });
  if (screen === 'home') content.appendChild(renderHome());
  else if (screen === 'science') content.appendChild(renderScience());
  else if (screen === 'environment') content.appendChild(renderEnvironment());
  else if (screen === 'journal') content.appendChild(renderJournal());
  else if (screen === 'coach') content.appendChild(renderCoach());
  app.appendChild(content);

  // Celebration
  if (showCelebration) {
    app.appendChild(h('div', { className: 'celebration' },
      h('div', { className: 'celebration-inner' },
        h('div', { className: 'celebration-emoji' }, '\ud83c\udf89'),
        h('div', { className: 'celebration-title' }, 'Mais um voto!'),
        h('div', { className: 'celebration-sub' }, '+1 dia de consistencia na tua nova identidade')
      )
    ));
  }

  // Nav
  document.querySelectorAll('.nav').forEach(n => n.remove());
  document.body.appendChild(renderNav());

  // Restore scroll or use saved position
  if (scrollPositions[screen]) {
    app.scrollTop = scrollPositions[screen];
    scrollPositions[screen] = 0;
  }
}

// ── Scroll Detection for Header ───────────────────────────────
app.addEventListener('scroll', () => {
  const header = app.querySelector('.header');
  if (header) {
    header.classList.toggle('scrolled', app.scrollTop > 10);
  }
});

// ── Init ──────────────────────────────────────────────────────
applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.theme === 'auto') applyTheme();
});
processNewDay();
render();
