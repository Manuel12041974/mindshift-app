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
import { EXERCISES, PHYSIO_PHASES, DEFAULT_PHYSIO_STATE, getDailyProgram, getDailyDuration,
         startSession, getSessionState, setPainBefore, setPainAfter, confirmPainPre,
         getCurrentExercise, startHoldTimer, completeSet, completeRep, skipExercise,
         skipRest, confirmPainPost, endSession, shouldAdvancePhase, advancePhase as doAdvancePhase,
         getRecentPainData, formatTime } from './physio.js';
import { createExerciseAnimation, createBodyMap, pauseAnimation, resumeAnimation } from './physio-svg.js';
import { getPhysioMessage, getPainCategory, BREATHING_CUES } from './physio-coach.js';
import { FASTING_PROTOCOLS, METABOLIC_PHASES, CONTRAINDICATIONS, DEFAULT_FASTING_STATE,
         getProtocol, getFastHours, getEatHours, startFast, endFast, getElapsedHours,
         getRemainingMs, getProgressPercent, getCurrentPhase as getFastPhase,
         getEatingWindow, isInEatingWindow, getFastingHistory, formatFastTime,
         formatHoursShort, getOptimalExerciseAdvice, VEGAN_IF_TIPS, getMonthCalendar } from './fasting.js';
import { createFastingTimer, createMiniTimer, createEatingWindowBar, createBodyStateIcon } from './fasting-svg.js';
import { DEFAULT_MOVEMENT_STATE, DEFAULT_EXERCISE_STATE, DEFAULT_WEIGHT_STATE,
         MICRO_EXERCISES, EXERCISE_TYPES, MOVEMENT_PROTOCOLS,
         startMovementTracking, stopMovementTracking, getNextBreakMinutes,
         recordBreak, getBreakProgress, getSuggestedExercise, getSpineFriendlyBreak,
         requestNotificationPermission, logExercise, startExerciseTimer, stopExerciseTimer,
         getTodayExerciseMinutes, getWeekExerciseMinutes, getWeekExerciseByDay,
         logWeight, getMovingAverage, getWeightDelta } from './movement.js';
import { createActivityRing, createMiniActivityRing, createExerciseWeeklyChart, createWeightTrendChart } from './movement-svg.js';
import { loadConfig, isFeatureEnabled, getBrand, t } from './config.js';

// ── State ─────────────────────────────────────────────────────
const STORAGE_KEY = 'mindshift-v3';
const DEFAULT_STATE = {
  version: 3,
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
  theme: 'auto',
  physio: { ...DEFAULT_PHYSIO_STATE },
  fasting: { ...DEFAULT_FASTING_STATE },
  movement: { ...DEFAULT_MOVEMENT_STATE },
  exercise: { ...DEFAULT_EXERCISE_STATE },
  weight: { ...DEFAULT_WEIGHT_STATE }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const s = JSON.parse(raw);
    // Schema migration / validation
    const merged = { ...DEFAULT_STATE, ...s, version: 3 };
    // Ensure all domain states exist
    if (!merged.physio) merged.physio = { ...DEFAULT_PHYSIO_STATE };
    if (!merged.fasting) merged.fasting = { ...DEFAULT_FASTING_STATE };
    if (!merged.movement) merged.movement = { ...DEFAULT_MOVEMENT_STATE };
    if (!merged.exercise) merged.exercise = { ...DEFAULT_EXERCISE_STATE };
    if (!merged.weight) merged.weight = { ...DEFAULT_WEIGHT_STATE };
    return merged;
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
let physioView = 'dashboard'; // dashboard | session | library
let physioLibFilter = 0; // 0 = all, 1-4 = phase
let showPhaseAdvance = false;
let animPaused = false;
let profileSub = null; // null | 'coach' | 'journal' | 'science' | 'environment' | 'settings'
let fastingTimerInterval = null;
let exerciseTimerInterval = null;

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
  if (state.physio) state.physio.dailyProgramDone = false;
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
    else if (v != null) el.setAttribute(k, v);
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
    { id: 'fasting', icon: 'fasting', label: 'Jejum' },
    { id: 'physio', icon: 'physio', label: 'Fisio' },
    { id: 'progress', icon: 'chart', label: 'Progresso' },
    { id: 'profile', icon: 'profile', label: 'Perfil' }
  ].filter(it => {
    if (it.id === 'fasting') return isFeatureEnabled('fasting');
    if (it.id === 'physio') return isFeatureEnabled('physio');
    return true;
  });
  const nav = h('div', { className: 'nav' });
  items.forEach(it => {
    const btn = h('button', {
      className: 'nav-btn' + (screen === it.id ? ' active' : ''),
      onclick: () => { scrollPositions[screen] = app.scrollTop; screen = it.id; profileSub = null; if (it.id !== 'fasting' && fastingTimerInterval) { clearInterval(fastingTimerInterval); fastingTimerInterval = null; } render(); }
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

  // ── Fasting Widget (if active) ──
  if (isFeatureEnabled('fasting') && state.fasting) {
    const f = state.fasting;
    const fastWidget = h('div', { class: 'widget-card', style: 'margin-bottom:12px' });
    fastWidget.onclick = () => { screen = 'fasting'; render(); };
    if (f.isActive) {
      const elapsed = getElapsedHours(f);
      const remaining = getRemainingMs(f);
      const percent = getProgressPercent(f);
      const phase = getFastPhase(elapsed);
      fastWidget.appendChild(h('div', { class: 'widget-title' }, '\u{23F1}\uFE0F JEJUM ATIVO'));
      const row = h('div', { style: 'display:flex;align-items:center;gap:12px' });
      const miniContainer = h('div', { style: 'width:60px;height:60px' });
      row.appendChild(miniContainer);
      row.appendChild(h('div', {},
        h('div', { class: 'widget-value', style: `color:${phase.color}` }, formatFastTime(remaining)),
        h('div', { class: 'widget-sub' }, `${phase.shortName} — ${Math.round(percent)}%`)
      ));
      fastWidget.appendChild(row);
      setTimeout(() => createMiniTimer(miniContainer, percent, phase, formatFastTime(remaining)), 0);
    } else {
      fastWidget.appendChild(h('div', { class: 'widget-title' }, '\u{23F1}\uFE0F JEJUM'));
      fastWidget.appendChild(h('div', { class: 'widget-sub' }, `${f.currentStreak || 0} streak \u00B7 Toca para iniciar`));
    }
    frag.appendChild(fastWidget);
  }

  // ── Movement Widget ──
  if (isFeatureEnabled('movement') && state.movement) {
    const bp = getBreakProgress(state.movement);
    const nextMin = getNextBreakMinutes(state.movement);
    const widgetRow = h('div', { class: 'widget-row' });

    // Breaks widget
    const breakW = h('div', { class: 'widget-card' });
    breakW.appendChild(h('div', { class: 'widget-title' }, '\u{1F6B6} PAUSAS'));
    const ringContainer = h('div', { style: 'width:60px;height:60px;margin:4px auto' });
    breakW.appendChild(ringContainer);
    breakW.appendChild(h('div', { class: 'widget-sub', style: 'text-align:center' },
      state.movement.enabled ? `Proxima em ${nextMin}min` : 'Desativado'));
    setTimeout(() => createMiniActivityRing(ringContainer, bp.taken, bp.goal), 0);
    widgetRow.appendChild(breakW);

    // Exercise widget
    const exMin = getTodayExerciseMinutes(state.exercise || DEFAULT_EXERCISE_STATE);
    const weekMin = getWeekExerciseMinutes(state.exercise || DEFAULT_EXERCISE_STATE);
    const exW = h('div', { class: 'widget-card' });
    exW.onclick = () => { screen = 'progress'; render(); };
    exW.appendChild(h('div', { class: 'widget-title' }, '\u{1F3C3} EXERCICIO'));
    exW.appendChild(h('div', { class: 'widget-value' }, `${exMin} min`));
    exW.appendChild(h('div', { class: 'widget-sub' }, `Hoje \u00B7 ${weekMin}/150 semana`));
    widgetRow.appendChild(exW);

    frag.appendChild(widgetRow);
  }

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

  // ── Physio Widget ──
  if (isFeatureEnabled('physio') && state.physio) {
    const physioW = h('div', { class: 'widget-card', style: 'margin-bottom:12px' });
    physioW.onclick = () => { screen = 'physio'; render(); };
    const p = state.physio;
    const prog = getDailyProgram(p);
    const dur = getDailyDuration(p);
    physioW.appendChild(h('div', { class: 'widget-title' }, '\u{1F9D8} FISIOTERAPIA'));
    physioW.appendChild(h('div', { class: 'widget-value', style: 'font-size:15px' },
      `${prog.length} exercicios \u00B7 ~${dur} min`));
    physioW.appendChild(h('div', { class: 'widget-sub' },
      `Fase ${p.currentPhase || 1} \u00B7 Toca para iniciar`));
    frag.appendChild(physioW);
  }

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

// ── Render: Fasting ──────────────────────────────────────────
function renderFasting() {
  if (!state.fasting) state.fasting = { ...DEFAULT_FASTING_STATE };
  const f = state.fasting;
  const wrap = h('div', { class: 'screen-content' });

  // Header
  wrap.appendChild(h('div', { class: 'section-header' },
    h('h2', { class: 'section-title', style: 'font-family:Fraunces,serif;font-size:22px' }, 'Jejum Intermitente'),
    h('p', { class: 'section-subtitle' }, 'Protocolo baseado em evidencia para reducao de gordura visceral')
  ));

  // Active fasting timer
  if (f.isActive) {
    const elapsed = getElapsedHours(f);
    const remaining = getRemainingMs(f);
    const percent = getProgressPercent(f);
    const phase = getFastPhase(elapsed);
    const totalH = getFastHours(f);

    const timerWrap = h('div', { class: 'fasting-timer-wrap' });
    const timerContainer = h('div', { class: 'fasting-timer-container' });
    timerWrap.appendChild(timerContainer);

    // Render timer after DOM insert
    setTimeout(() => createFastingTimer(timerContainer, percent, elapsed, formatFastTime(remaining), phase, totalH), 0);

    // Phase info card
    const phaseCard = h('div', { class: 'phase-info-card', style: `--phase-color:${phase.color}` },
      h('div', { class: 'phase-info-header' },
        h('div', { class: 'phase-info-icon', style: `background:${phase.bgColor}; font-size:18px; text-align:center; line-height:36px` },
          phase.id === 'fed' ? '\u{1F34E}' : phase.id === 'catabolic' ? '\u26A1' : phase.id === 'fatburn' ? '\u{1F525}' : phase.id === 'ketosis' ? '\u{1F9EA}' : '\u{1F52C}'),
        h('span', { class: 'phase-info-name' }, phase.name)
      ),
      h('p', { class: 'phase-info-desc' }, phase.desc),
      h('p', { class: 'phase-info-science' }, phase.science)
    );
    timerWrap.appendChild(phaseCard);

    // Phase timeline
    const timeline = h('div', { class: 'phase-timeline-h' });
    METABOLIC_PHASES.forEach(p => {
      const isActive = p.id === phase.id;
      const seg = h('div', { class: 'phase-segment' + (isActive ? ' active' : ''), style: `background:${p.bgColor}; color:${p.color}` },
        h('div', {}, p.shortName),
        h('div', { class: 'phase-segment-time' }, `${p.startHour}h`)
      );
      timeline.appendChild(seg);
    });
    timerWrap.appendChild(timeline);

    // Stop button
    const actions = h('div', { class: 'fasting-actions' });
    const stopBtn = h('button', { class: 'fasting-btn stop' }, 'Terminar Jejum');
    stopBtn.onclick = () => { endFast(f); clearInterval(fastingTimerInterval); fastingTimerInterval = null; save(); render(); };
    actions.appendChild(stopBtn);
    timerWrap.appendChild(actions);

    wrap.appendChild(timerWrap);

    // Start real-time update
    if (!fastingTimerInterval) {
      fastingTimerInterval = setInterval(() => {
        const tc = document.querySelector('.fasting-timer-container');
        if (tc && f.isActive) {
          const el = getElapsedHours(f);
          const rem = getRemainingMs(f);
          const pct = getProgressPercent(f);
          const ph = getFastPhase(el);
          createFastingTimer(tc, pct, el, formatFastTime(rem), ph, getFastHours(f));
        }
      }, 1000);
    }

    // Eating window
    const ew = getEatingWindow(f);
    const ewContainer = h('div', { class: 'eating-window-container' },
      h('div', { class: 'eating-window-title' }, 'Janela Alimentar'),
      h('div', { id: 'eating-window-bar' }),
      h('div', { class: 'eating-window-times' },
        h('span', { class: 'eating-window-time' }, h('span', { class: 'dot eat' }), ` Comer: ${ew.start} — ${ew.end}`),
        h('span', { class: 'eating-window-time' }, h('span', { class: 'dot fast' }), ' Jejum: restante')
      )
    );
    wrap.appendChild(ewContainer);
    setTimeout(() => {
      const bar = document.getElementById('eating-window-bar');
      if (bar) createEatingWindowBar(bar, ew.startHour, ew.endHour, new Date().getHours());
    }, 0);

    // Exercise advice
    const advice = getOptimalExerciseAdvice(f);
    wrap.appendChild(h('div', { class: 'phase-info-card', style: '--phase-color:#6366F1' },
      h('div', { class: 'phase-info-name' }, '\u{1F3C3} Exercicio durante o Jejum'),
      h('p', { class: 'phase-info-desc' }, advice.advice),
      advice.science ? h('p', { class: 'phase-info-science' }, advice.science) : ''
    ));

    // Vegan tip
    const tipIdx = Math.floor(elapsed) % VEGAN_IF_TIPS.length;
    wrap.appendChild(h('div', { class: 'vegan-if-card' },
      h('div', { class: 'vegan-if-label' }, '\u{1F331} Dica Vegan + Jejum'),
      h('p', { class: 'vegan-if-text' }, VEGAN_IF_TIPS[tipIdx])
    ));

  } else {
    // Not fasting — show protocol selector
    wrap.appendChild(h('h3', { style: 'font-family:Fraunces,serif;font-size:17px;margin:16px 0 8px' }, 'Escolhe o teu Protocolo'));

    const grid = h('div', { class: 'protocol-grid' });
    FASTING_PROTOCOLS.forEach(p => {
      if (p.id === '5:2') return; // skip 5:2 for now (special type)
      const card = h('div', { class: 'protocol-card' + (f.protocol === p.id ? ' selected' : '') + (p.recommended ? ' recommended' : '') },
        h('div', { class: 'protocol-name' }, p.name),
        h('div', { class: 'protocol-desc' }, p.desc),
        h('div', { class: 'protocol-difficulty' },
          ...Array.from({ length: 4 }, (_, i) => h('span', { class: 'protocol-diff-dot' + (i < p.difficulty ? ' filled' : '') }))
        ),
        p.science ? h('p', { style: 'font-size:10px;color:#9CA3AF;margin-top:4px;font-style:italic' }, p.science) : ''
      );
      card.onclick = () => { f.protocol = p.id; save(); render(); };
      grid.appendChild(card);
    });
    wrap.appendChild(grid);

    // Start button
    const actions = h('div', { class: 'fasting-actions', style: 'margin-top:16px' });
    const startBtn = h('button', { class: 'fasting-btn start' }, `Iniciar Jejum ${getProtocol(f).name}`);
    startBtn.onclick = () => { startFast(f); save(); render(); };
    actions.appendChild(startBtn);
    wrap.appendChild(actions);

    // Eating window preview
    const ew = getEatingWindow(f);
    const ewPrev = h('div', { class: 'eating-window-container' },
      h('div', { class: 'eating-window-title' }, `Janela Alimentar: ${ew.start} — ${ew.end}`),
      h('div', { id: 'eating-window-bar-preview' })
    );
    wrap.appendChild(ewPrev);
    setTimeout(() => {
      const bar = document.getElementById('eating-window-bar-preview');
      if (bar) createEatingWindowBar(bar, ew.startHour, ew.endHour, new Date().getHours());
    }, 0);
  }

  // Stats
  const stats = h('div', { class: 'fasting-stats' },
    h('div', { class: 'fasting-stat-card' },
      h('div', { class: 'fasting-stat-value' }, String(f.currentStreak || 0)),
      h('div', { class: 'fasting-stat-label' }, 'Streak')),
    h('div', { class: 'fasting-stat-card' },
      h('div', { class: 'fasting-stat-value' }, String(f.totalFasts || 0)),
      h('div', { class: 'fasting-stat-label' }, 'Total Jejuns')),
    h('div', { class: 'fasting-stat-card' },
      h('div', { class: 'fasting-stat-value' }, String(f.bestStreak || 0)),
      h('div', { class: 'fasting-stat-label' }, 'Melhor Streak'))
  );
  wrap.appendChild(stats);

  // Contraindications warning
  if (!f.contraindChecked) {
    const contraCard = h('div', { class: 'notification-card' },
      h('p', { style: 'font-weight:700' }, '\u26A0\uFE0F Aviso Importante'),
      h('p', {}, 'O jejum intermitente nao e adequado para todos. Verifica as contraindicacoes antes de comecar.'),
      h('ul', { class: 'contra-list' },
        ...CONTRAINDICATIONS.filter(c => c.severity === 'absolute').map(c =>
          h('li', { class: 'contra-item' },
            h('span', { class: 'contra-icon absolute' }, '\u2716'),
            h('div', {},
              h('div', { class: 'contra-label' }, c.label))
          )
        )
      )
    );
    const ackBtn = h('button', { class: 'notification-btn', style: 'margin-top:8px' }, 'Li e Compreendi');
    ackBtn.onclick = () => { f.contraindChecked = true; save(); render(); };
    contraCard.appendChild(ackBtn);
    wrap.appendChild(contraCard);
  }

  return wrap;
}

// ── Render: Progress ─────────────────────────────────────────
function renderProgress() {
  const wrap = h('div', { class: 'screen-content' });

  wrap.appendChild(h('div', { class: 'section-header' },
    h('h2', { class: 'section-title', style: 'font-family:Fraunces,serif;font-size:22px' }, 'Progresso'),
    h('p', { class: 'section-subtitle' }, 'Peso, exercicio e jejum — tudo num so lugar')
  ));

  // Weight section
  const w = state.weight || DEFAULT_WEIGHT_STATE;
  const lastEntry = w.entries.length > 0 ? w.entries[w.entries.length - 1] : null;
  const delta = getWeightDelta(w);

  const weightCard = h('div', { class: 'weight-card' },
    h('div', { class: 'weight-header' },
      h('div', { class: 'weight-title' }, '\u2696\uFE0F Peso'),
      lastEntry ? h('div', { class: 'weight-current' }, `${lastEntry.weight} kg`) : h('div', { class: 'weight-current', style: 'color:#9CA3AF' }, '-- kg')
    ),
    delta ? h('span', { class: `weight-delta ${delta.direction}` },
      (delta.direction === 'down' ? '\u2193 ' : delta.direction === 'up' ? '\u2191 ' : '') + Math.abs(delta.delta) + ' kg') : ''
  );

  // Weight input
  const inputRow = h('div', { class: 'weight-input-row' });
  const weightInput = h('input', { type: 'number', class: 'weight-input', placeholder: 'Peso (kg)', step: '0.1', min: '30', max: '300' });
  const saveBtn = h('button', { class: 'weight-save-btn' }, 'Guardar');
  saveBtn.onclick = () => {
    const val = parseFloat(weightInput.value);
    if (val > 0 && val < 500) {
      if (!state.weight) state.weight = { ...DEFAULT_WEIGHT_STATE };
      logWeight(state.weight, val);
      save(); render();
    }
  };
  inputRow.appendChild(weightInput);
  inputRow.appendChild(saveBtn);
  weightCard.appendChild(inputRow);

  // Weight chart
  const chartContainer = h('div', { class: 'weight-chart-container', id: 'weight-trend-chart' });
  weightCard.appendChild(chartContainer);
  wrap.appendChild(weightCard);

  setTimeout(() => {
    const chartEl = document.getElementById('weight-trend-chart');
    if (chartEl && w.entries.length > 0) {
      const trendData = getMovingAverage(w, 30, 7);
      createWeightTrendChart(chartEl, trendData, w.goalWeight);
    }
  }, 0);

  // Set goal weight
  if (!w.goalWeight) {
    const goalCard = h('div', { class: 'exercise-log-card' },
      h('div', { class: 'exercise-log-title' }, '\u{1F3AF} Definir Peso Objetivo'),
      h('div', { class: 'weight-input-row' })
    );
    const goalInput = h('input', { type: 'number', class: 'weight-input', placeholder: 'Peso objetivo (kg)', step: '0.1' });
    const goalBtn = h('button', { class: 'weight-save-btn' }, 'Definir');
    goalBtn.onclick = () => {
      const val = parseFloat(goalInput.value);
      if (val > 0) { state.weight.goalWeight = val; save(); render(); }
    };
    goalCard.lastChild.appendChild(goalInput);
    goalCard.lastChild.appendChild(goalBtn);
    wrap.appendChild(goalCard);
  }

  // Exercise weekly chart
  const ex = state.exercise || DEFAULT_EXERCISE_STATE;
  const weekData = getWeekExerciseByDay(ex);
  const weekTotal = getWeekExerciseMinutes(ex);
  const weekGoal = ex.weeklyGoalMinutes || 150;
  const onTrack = weekTotal >= weekGoal * (new Date().getDay() / 7);

  const exerciseCard = h('div', { class: 'exercise-weekly-card' },
    h('div', { class: 'exercise-weekly-header' },
      h('div', { class: 'exercise-weekly-title' }, '\u{1F3C3} Exercicio Semanal'),
      h('div', { class: 'exercise-weekly-total ' + (onTrack ? 'on-track' : 'behind') }, `${weekTotal}/${weekGoal} min`)
    ),
    h('div', { id: 'exercise-weekly-chart', style: 'height:120px' })
  );
  wrap.appendChild(exerciseCard);

  setTimeout(() => {
    const chartEl = document.getElementById('exercise-weekly-chart');
    if (chartEl) createExerciseWeeklyChart(chartEl, weekData, weekGoal);
  }, 0);

  // Exercise log button
  const logCard = h('div', { class: 'exercise-log-card' },
    h('div', { class: 'exercise-log-title' }, '\u{1F4DD} Registar Exercicio')
  );
  const typeGrid = h('div', { class: 'exercise-type-grid' });
  const exerciseIcons = { walking: '\u{1F6B6}', running: '\u{1F3C3}', cycling: '\u{1F6B4}', swimming: '\u{1F3CA}', other: '\u{1F4AA}' };
  EXERCISE_TYPES.forEach(et => {
    const btn = h('button', { class: 'exercise-type-btn' },
      h('span', { class: 'exercise-type-icon' }, exerciseIcons[et.id] || '\u{1F4AA}'),
      h('span', { class: 'exercise-type-name' }, et.name)
    );
    btn.onclick = () => {
      const dur = prompt(`Quantos minutos de ${et.name}?`, '30');
      if (dur && parseInt(dur) > 0) {
        if (!state.exercise) state.exercise = { ...DEFAULT_EXERCISE_STATE };
        logExercise(state.exercise, et.id, parseInt(dur));
        save(); render();
      }
    };
    typeGrid.appendChild(btn);
  });
  logCard.appendChild(typeGrid);
  wrap.appendChild(logCard);

  // Fasting calendar
  if (state.fasting && state.fasting.history.length > 0) {
    const now = new Date();
    const cal = getMonthCalendar(state.fasting, now.getFullYear(), now.getMonth());
    const calCard = h('div', { class: 'fasting-calendar' },
      h('div', { class: 'calendar-header' },
        h('div', { class: 'calendar-month' }, cal.monthName + ' ' + cal.year)
      )
    );
    const grid = h('div', { class: 'calendar-grid' });
    ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].forEach(d => grid.appendChild(h('div', { class: 'calendar-day-header' }, d)));

    // Offset for first day
    const firstDow = cal.days[0]?.dayOfWeek || 0;
    for (let i = 0; i < firstDow; i++) grid.appendChild(h('div', { class: 'calendar-day empty' }));

    const todayDate = now.getDate();
    cal.days.forEach(d => {
      const cls = 'calendar-day' + (d.completed ? ' completed' : d.partial ? ' partial' : '') + (d.date === todayDate ? ' today' : '');
      grid.appendChild(h('div', { class: cls }, String(d.date)));
    });
    calCard.appendChild(grid);
    wrap.appendChild(calCard);
  }

  // Automaticity meter
  wrap.appendChild(renderAutomaticitySection());

  return wrap;
}

function renderAutomaticitySection() {
  const card = h('div', { class: 'exercise-log-card' },
    h('div', { class: 'exercise-log-title' }, '\u{1F9E0} Automaticidade dos Habitos')
  );
  const meterContainer = h('div', { id: 'automaticity-meter-progress' });
  card.appendChild(meterContainer);
  setTimeout(() => {
    const el = document.getElementById('automaticity-meter-progress');
    if (el) renderAutomaticityMeter(el, state);
  }, 0);
  return card;
}

// ── Render: Profile ──────────────────────────────────────────
function renderProfile() {
  const wrap = h('div', { class: 'screen-content' });

  // If sub-screen is active, render it
  if (profileSub === 'coach') return renderCoach();
  if (profileSub === 'journal') return renderJournal();
  if (profileSub === 'science') return renderScience();
  if (profileSub === 'environment') return renderEnvironment();

  // Profile header
  wrap.appendChild(h('div', { class: 'section-header' },
    h('h2', { class: 'section-title', style: 'font-family:Fraunces,serif;font-size:22px' }, 'Perfil'),
    h('p', { class: 'section-subtitle' }, `${state.userName || 'Utilizador'} — Dia ${state.currentDay}`)
  ));

  // Stats summary
  const statsRow = h('div', { class: 'fasting-stats' },
    h('div', { class: 'fasting-stat-card' },
      h('div', { class: 'fasting-stat-value' }, String(state.streak || 0) + '\u{1F525}'),
      h('div', { class: 'fasting-stat-label' }, 'Streak')),
    h('div', { class: 'fasting-stat-card' },
      h('div', { class: 'fasting-stat-value' }, String(state.totalVotes || 0)),
      h('div', { class: 'fasting-stat-label' }, 'Votos')),
    h('div', { class: 'fasting-stat-card' },
      h('div', { class: 'fasting-stat-value' }, String(state.bestStreak || 0)),
      h('div', { class: 'fasting-stat-label' }, 'Melhor'))
  );
  wrap.appendChild(statsRow);

  // Menu items
  const menu = h('ul', { class: 'profile-menu' });
  const menuItems = [
    { id: 'coach', icon: '\u{1F9E0}', label: 'Coach IA', desc: 'Conversa com o teu coach pessoal' },
    { id: 'journal', icon: '\u{1F4D3}', label: 'Diario', desc: 'Reflexoes e notas pessoais' },
    { id: 'science', icon: '\u{1F52C}', label: 'Ciencia', desc: 'Evidencia por tras dos habitos' },
    { id: 'environment', icon: '\u{1F33F}', label: 'Ambiente', desc: 'Otimiza o teu ambiente para o sucesso' }
  ];
  menuItems.forEach(item => {
    const li = h('li', { class: 'profile-menu-item' },
      h('div', { class: 'profile-menu-icon' }, h('span', { style: 'font-size:18px' }, item.icon)),
      h('div', {},
        h('div', { class: 'profile-menu-label' }, item.label),
        h('div', { style: 'font-size:11px;color:#9CA3AF' }, item.desc)
      ),
      h('span', { class: 'profile-menu-chevron' }, '\u203A')
    );
    li.onclick = () => { profileSub = item.id; render(); };
    menu.appendChild(li);
  });
  wrap.appendChild(menu);

  // Movement settings
  const mv = state.movement || DEFAULT_MOVEMENT_STATE;
  const movCard = h('div', { class: 'exercise-log-card', style: 'margin-top:16px' },
    h('div', { class: 'exercise-log-title' }, '\u{1F514} Lembretes de Movimento')
  );

  const toggleRow = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px' },
    h('span', { style: 'font-size:13px;font-weight:600' }, 'Alertas de sedentarismo'),
    h('label', { style: 'position:relative;display:inline-block;width:44px;height:24px' },
      Object.assign(h('input', { type: 'checkbox' }), {
        checked: mv.enabled,
        style: 'opacity:0;width:0;height:0',
        onchange: function() {
          state.movement.enabled = this.checked;
          if (this.checked) startMovementTracking(state.movement, onMovementAlert);
          else stopMovementTracking();
          save();
        }
      }),
      h('span', { style: `position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${mv.enabled ? '#4F46E5' : '#D1D5DB'};border-radius:24px;transition:.3s` },
        h('span', { style: `position:absolute;height:18px;width:18px;left:${mv.enabled ? '22px' : '3px'};bottom:3px;background:#fff;border-radius:50%;transition:.3s` })
      )
    )
  );
  movCard.appendChild(toggleRow);

  // Notification permission
  if (mv.enabled && !mv.notificationsEnabled) {
    const notifCard = h('div', { class: 'notification-card' },
      h('p', {}, 'Ativa notificacoes para receber lembretes de pausa.'));
    const notifBtn = h('button', { class: 'notification-btn' }, 'Ativar Notificacoes');
    notifBtn.onclick = async () => {
      const granted = await requestNotificationPermission();
      if (granted) { state.movement.notificationsEnabled = true; save(); render(); }
    };
    notifCard.appendChild(notifBtn);
    movCard.appendChild(notifCard);
  }

  // Interval setting
  const intervalRow = h('div', { style: 'display:flex;align-items:center;gap:8px;margin-top:8px' },
    h('span', { style: 'font-size:12px;color:#6B7280' }, 'Intervalo:'),
    h('select', {
      style: 'padding:6px 10px;border:1px solid #E5E7EB;border-radius:8px;font-size:13px;background:var(--card-bg,#fff);color:var(--text,#111)',
      onchange: function() { state.movement.intervalMinutes = parseInt(this.value); save(); }
    },
      ...[20, 30, 45, 60, 90].map(m =>
        Object.assign(h('option', { value: String(m) }, `${m} min`), { selected: mv.intervalMinutes === m })
      )
    )
  );
  movCard.appendChild(intervalRow);
  wrap.appendChild(movCard);

  // Theme toggle
  const themeCard = h('div', { class: 'exercise-log-card' },
    h('div', { class: 'exercise-log-title' }, '\u{1F3A8} Tema')
  );
  const themeRow = h('div', { style: 'display:flex;gap:8px' });
  ['auto', 'light', 'dark'].forEach(t => {
    const btn = h('button', {
      class: 'exercise-type-btn' + (state.theme === t ? ' selected' : ''),
      style: 'flex:1'
    },
      h('span', { style: 'font-size:16px' }, t === 'auto' ? '\u{1F312}' : t === 'light' ? '\u2600\uFE0F' : '\u{1F319}'),
      h('span', { class: 'exercise-type-name' }, t === 'auto' ? 'Auto' : t === 'light' ? 'Claro' : 'Escuro')
    );
    btn.onclick = () => { state.theme = t; applyTheme(); save(); render(); };
    themeRow.appendChild(btn);
  });
  themeCard.appendChild(themeRow);
  wrap.appendChild(themeCard);

  return wrap;
}

function onMovementAlert(exercise) {
  // Re-render to show break suggestion
  if (screen === 'home') render();
}

// ── Render: Physiotherapy ─────────────────────────────────────
function renderPhysio() {
  // Ensure physio state exists
  if (!state.physio) state.physio = { ...DEFAULT_PHYSIO_STATE };
  if (!state.physio.phaseStartDate) state.physio.phaseStartDate = today();

  const ss = getSessionState();
  // If session is active, render session UI
  if (ss.status !== 'idle') return renderPhysioSession();

  const wrap = h('div', { className: 'physio-wrap' });

  // Sub-navigation
  const subnav = h('div', { className: 'physio-subnav' });
  [{ id: 'dashboard', label: 'Programa' }, { id: 'library', label: 'Exercicios' }].forEach(tab => {
    subnav.appendChild(h('button', {
      className: 'physio-subnav-btn' + (physioView === tab.id ? ' active' : ''),
      onclick: () => { physioView = tab.id; render(); }
    }, tab.label));
  });
  wrap.appendChild(subnav);

  if (physioView === 'library') return renderPhysioLibrary(wrap);

  // ── Dashboard ──
  const phase = PHYSIO_PHASES.find(p => p.id === state.physio.currentPhase) || PHYSIO_PHASES[0];
  const daysSince = state.physio.phaseStartDate
    ? Math.floor((Date.now() - new Date(state.physio.phaseStartDate).getTime()) / 86400000) : 0;
  const minDays = phase.criteria?.minDays || 999;
  const phasePct = Math.min(100, Math.round((daysSince / minDays) * 100));

  // Phase Hero
  const hero = h('div', { className: 'physio-hero' },
    h('div', { className: 'physio-hero-phase' }, `FASE ${phase.id} · ${phase.period}`),
    h('div', { className: 'physio-hero-title' }, phase.name),
    h('div', { className: 'physio-hero-desc' }, phase.description),
    h('div', { className: 'physio-hero-progress' },
      h('div', { className: 'physio-hero-progress-fill', style: { width: phasePct + '%' } })
    ),
    h('div', { className: 'physio-hero-meta' },
      h('span', null, `Dia ${daysSince + 1}`),
      h('span', null, `${state.physio.sessions.length} sessoes`)
    )
  );
  wrap.appendChild(hero);

  // AI Coach message
  const painCat = getPainCategory(state.physio.painLog);
  const sessions = state.physio.sessions;
  let msgCategory = sessions.length === 0 ? 'first_session' : painCat;
  if (sessions.length > 0) {
    const lastDate = sessions[sessions.length - 1].date;
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().split('T')[0];
    if (lastDate !== today() && lastDate !== yKey) msgCategory = 'skipped_day';
  }
  const coachMsg = h('div', { className: 'physio-coach-msg' },
    h('div', { className: 'physio-coach-label' }, 'Coach Fisio'),
    h('p', null, getPhysioMessage(msgCategory))
  );
  wrap.appendChild(coachMsg);

  // Daily Program Card
  const program = getDailyProgram(state.physio);
  const duration = getDailyDuration(state.physio);
  const done = state.physio.dailyProgramDone;
  const progCard = h('div', { className: 'physio-program' },
    h('div', { className: 'physio-program-header' },
      h('div', { className: 'physio-program-title' }, 'Programa de Hoje'),
      h('div', { className: 'physio-program-badge' + (done ? ' done' : '') },
        done ? 'Concluido' : 'Pendente')
    ),
    h('div', { className: 'physio-program-info' },
      h('div', { className: 'physio-program-stat' },
        iconEl('timer', 16, '#6B7280'), h('span', null, `~${duration} min`)),
      h('div', { className: 'physio-program-stat' },
        iconEl('muscle', 16, '#6B7280'), h('span', null, `${program.length} exercicios`))
    ),
    h('button', {
      className: 'physio-start-btn',
      disabled: done ? 'disabled' : null,
      onclick: () => {
        startSession(state.physio, null);
        render();
      }
    }, done ? 'Sessao concluida hoje' : 'Iniciar Sessao')
  );
  wrap.appendChild(progCard);

  // Pain Quick Log
  const lastPain = state.physio.painLog.length > 0
    ? state.physio.painLog[state.physio.painLog.length - 1].level : null;
  const painCard = h('div', { className: 'pain-card' },
    h('div', { className: 'pain-title' }, 'Nivel de Dor'),
    h('div', { className: 'pain-faces' },
      h('span', null, '\u{1F600}'), h('span', null, '\u{1F610}'),
      h('span', null, '\u{1F615}'), h('span', null, '\u{1F61F}'), h('span', null, '\u{1F62B}')
    ),
    (() => {
      const slider = document.createElement('input');
      slider.type = 'range'; slider.min = '0'; slider.max = '10';
      slider.value = lastPain !== null ? lastPain : '5';
      slider.className = 'pain-slider';
      const valDiv = h('div', {
        className: 'pain-value ' + (slider.value <= 3 ? 'low' : slider.value <= 6 ? 'mid' : 'high')
      }, slider.value + '/10');
      slider.oninput = () => {
        valDiv.textContent = slider.value + '/10';
        valDiv.className = 'pain-value ' + (slider.value <= 3 ? 'low' : slider.value <= 6 ? 'mid' : 'high');
      };
      slider.onchange = () => {
        state.physio.painLog.push({
          date: today(), level: parseInt(slider.value),
          location: 'lombar-central', context: 'manual', notes: ''
        });
        save();
        render();
      };
      const wrap = h('div', null, valDiv, slider);
      return wrap;
    })(),
    h('div', { className: 'pain-labels' },
      h('span', null, 'Sem dor'), h('span', null, 'Moderada'), h('span', null, 'Maxima'))
  );
  wrap.appendChild(painCard);

  // Pain Trend Chart (7 days)
  if (state.physio.painLog.length > 0) {
    const chartCard = h('div', { className: 'pain-card' },
      h('div', { className: 'pain-title' }, 'Tendencia da Dor (7 dias)')
    );
    const chartArea = h('div', { className: 'pain-chart' });
    const painData = getRecentPainData(state.physio.painLog, 7);
    const barsDiv = h('div', { className: 'pain-chart-bars' });
    painData.forEach(day => {
      const dayCol = h('div', { className: 'pain-chart-day' });
      const barWrap = h('div', { className: 'pain-chart-bar-wrap' });
      if (day.pre !== null) {
        const preBar = h('div', { className: 'pain-chart-bar pre' });
        preBar.style.height = Math.max(2, (day.pre / 10) * 55) + 'px';
        preBar.style.background = day.pre <= 3 ? '#10B981' : day.pre <= 6 ? '#F59E0B' : '#EF4444';
        barWrap.appendChild(preBar);
      }
      if (day.post !== null) {
        const postBar = h('div', { className: 'pain-chart-bar post' });
        postBar.style.height = Math.max(2, (day.post / 10) * 55) + 'px';
        postBar.style.background = day.post <= 3 ? '#10B981' : day.post <= 6 ? '#F59E0B' : '#EF4444';
        barWrap.appendChild(postBar);
      }
      dayCol.appendChild(barWrap);
      dayCol.appendChild(h('div', { className: 'pain-chart-label' + (day.isToday ? ' today' : '') }, day.label));
      barsDiv.appendChild(dayCol);
    });
    chartArea.appendChild(barsDiv);
    chartCard.appendChild(chartArea);
    wrap.appendChild(chartCard);
  }

  // Phase Timeline
  const timeline = h('div', { className: 'physio-timeline' },
    h('div', { className: 'physio-timeline-title' }, 'Fases de Reabilitacao')
  );
  PHYSIO_PHASES.forEach(p => {
    const isActive = p.id === state.physio.currentPhase;
    const isCompleted = p.id < state.physio.currentPhase;
    const isLocked = p.id > state.physio.currentPhase;
    const item = h('div', {
      className: 'physio-phase-item' + (isActive ? ' active' : '')
    },
      h('div', {
        className: 'physio-phase-dot ' + (isCompleted ? 'completed' : isActive ? 'active' : 'locked'),
        style: { background: isCompleted ? '#10B981' : isActive ? p.color : '#D1D5DB' }
      }, isCompleted ? '\u2713' : String(p.id)),
      h('div', { className: 'physio-phase-info' },
        h('h4', null, p.name),
        h('p', null, p.period + (isActive ? ' (atual)' : ''))
      )
    );
    timeline.appendChild(item);
  });
  wrap.appendChild(timeline);

  // Check phase advance
  if (shouldAdvancePhase(state.physio) && !showPhaseAdvance) {
    showPhaseAdvance = true;
  }
  if (showPhaseAdvance) {
    const nextPhase = PHYSIO_PHASES.find(p => p.id === state.physio.currentPhase + 1);
    if (nextPhase) {
      const modal = h('div', { className: 'phase-advance-modal' },
        h('div', { className: 'phase-advance-content' },
          h('div', { className: 'phase-advance-emoji' }, '\u{1F389}'),
          h('div', { className: 'phase-advance-title' }, 'Parabens!'),
          h('div', { className: 'phase-advance-desc' },
            `Cumpriste os criterios para avancar para a ${nextPhase.name}. Novos exercicios vao ser desbloqueados!`),
          h('div', { className: 'session-actions' },
            h('button', { className: 'session-btn primary', onclick: () => {
              doAdvancePhase(state, save);
              showPhaseAdvance = false;
              render();
            }}, 'Avancar'),
            h('button', { className: 'session-btn secondary', onclick: () => {
              showPhaseAdvance = false;
              render();
            }}, 'Ainda nao')
          )
        )
      );
      wrap.appendChild(modal);
    }
  }

  return wrap;
}

// ── Render: Physio Session ────────────────────────────────────
function renderPhysioSession() {
  const ss = getSessionState();
  const wrap = h('div', { className: 'physio-session' });

  // Close button
  const header = h('div', { className: 'session-header' },
    h('button', { className: 'session-close-btn', onclick: () => {
      endSession(); render();
    }}, '\u2715'),
    h('div', { className: 'session-progress' },
      ss.status === 'pain-pre' ? 'Check-in de Dor' :
      ss.status === 'pain-post' ? 'Check-out de Dor' :
      ss.status === 'complete' ? 'Concluido' :
      `${ss.currentIndex + 1}/${ss.exercises.length}`)
  );
  wrap.appendChild(header);

  // Progress bar
  const pct = ss.exercises.length > 0
    ? Math.round((ss.completedExercises.length / ss.exercises.length) * 100) : 0;
  wrap.appendChild(h('div', { className: 'session-progress-bar' },
    h('div', { className: 'session-progress-fill', style: { width: pct + '%' } })
  ));

  // ── Pain Pre-Check ──
  if (ss.status === 'pain-pre') {
    const painVal = h('div', {
      className: 'pain-value ' + (ss.painBefore <= 3 ? 'low' : ss.painBefore <= 6 ? 'mid' : 'high')
    }, ss.painBefore + '/10');
    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = '0'; slider.max = '10';
    slider.value = ss.painBefore; slider.className = 'pain-slider';
    slider.oninput = () => {
      setPainBefore(parseInt(slider.value));
      painVal.textContent = slider.value + '/10';
      painVal.className = 'pain-value ' + (slider.value <= 3 ? 'low' : slider.value <= 6 ? 'mid' : 'high');
    };
    wrap.appendChild(h('div', { style: { textAlign: 'center', padding: '20px 0' } },
      h('div', { style: { fontSize: '48px', marginBottom: '12px' } }, '\u{1F4CA}'),
      h('div', { className: 'pain-title', style: { textAlign: 'center', fontSize: '18px' } },
        'Como esta a tua dor agora?'),
      h('div', { className: 'pain-faces' },
        h('span', null, '\u{1F600}'), h('span', null, '\u{1F610}'), h('span', null, '\u{1F62B}')
      ),
      painVal, slider,
      h('div', { className: 'pain-labels' },
        h('span', null, 'Sem dor'), h('span', null, 'Moderada'), h('span', null, 'Maxima')),
      h('div', { className: 'session-actions', style: { marginTop: '24px' } },
        h('button', { className: 'session-btn primary', onclick: () => {
          confirmPainPre(() => render());
        }}, 'Comecar Exercicios'))
    ));
    return wrap;
  }

  // ── Pain Post-Check ──
  if (ss.status === 'pain-post') {
    const painVal = h('div', {
      className: 'pain-value ' + (ss.painAfter <= 3 ? 'low' : ss.painAfter <= 6 ? 'mid' : 'high')
    }, ss.painAfter + '/10');
    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = '0'; slider.max = '10';
    slider.value = ss.painAfter; slider.className = 'pain-slider';
    slider.oninput = () => {
      setPainAfter(parseInt(slider.value));
      painVal.textContent = slider.value + '/10';
      painVal.className = 'pain-value ' + (slider.value <= 3 ? 'low' : slider.value <= 6 ? 'mid' : 'high');
    };
    wrap.appendChild(h('div', { style: { textAlign: 'center', padding: '20px 0' } },
      h('div', { style: { fontSize: '48px', marginBottom: '12px' } }, '\u{1F3C1}'),
      h('div', { className: 'pain-title', style: { textAlign: 'center', fontSize: '18px' } },
        'Como esta a dor agora?'),
      painVal, slider,
      h('div', { className: 'pain-labels' },
        h('span', null, 'Sem dor'), h('span', null, 'Moderada'), h('span', null, 'Maxima')),
      h('div', { className: 'session-actions', style: { marginTop: '24px' } },
        h('button', { className: 'session-btn primary', onclick: () => {
          confirmPainPost(state, save, () => render());
        }}, 'Concluir Sessao'))
    ));
    return wrap;
  }

  // ── Session Complete ──
  if (ss.status === 'complete') {
    const duration = Math.round((Date.now() - ss.startTime) / 60000);
    const delta = ss.painBefore - ss.painAfter;
    wrap.appendChild(h('div', { className: 'session-complete' },
      h('div', { className: 'session-complete-icon' }, '\u{1F389}'),
      h('div', { className: 'session-complete-title' }, 'Sessao Concluida!'),
      h('div', { className: 'session-complete-sub' },
        getPhysioMessage('session_complete')),
      h('div', { className: 'session-stats' },
        h('div', { className: 'session-stat' },
          h('div', { className: 'session-stat-value' }, String(ss.completedExercises.length)),
          h('div', { className: 'session-stat-label' }, 'Exercicios')),
        h('div', { className: 'session-stat' },
          h('div', { className: 'session-stat-value' }, duration + 'min'),
          h('div', { className: 'session-stat-label' }, 'Duracao')),
        h('div', { className: 'session-stat' },
          h('div', { className: 'session-stat-value' }, String(ss.painBefore) + '\u2192' + String(ss.painAfter)),
          h('div', { className: 'session-stat-label' }, 'Dor'))
      ),
      h('div', {
        className: 'pain-delta ' + (delta > 0 ? 'improved' : delta < 0 ? 'worse' : 'same')
      }, delta > 0 ? `Dor diminuiu ${delta} pontos` : delta < 0 ? `Dor aumentou ${Math.abs(delta)} pontos` : 'Dor manteve-se'),
      h('div', { className: 'session-actions' },
        h('button', { className: 'session-btn primary', onclick: () => {
          endSession(); physioView = 'dashboard'; render();
        }}, 'Voltar ao Programa'))
    ));
    return wrap;
  }

  // ── Resting ──
  if (ss.status === 'resting') {
    const next = ss.exercises[ss.currentIndex];
    wrap.appendChild(h('div', { className: 'rest-screen' },
      h('div', { className: 'rest-title' }, 'Descanso'),
      h('div', { className: 'session-timer' },
        h('div', { className: 'timer-circle rest' },
          h('div', { className: 'timer-value' }, formatTime(ss.restRemaining))
        ),
        h('div', { className: 'timer-label' }, 'ate o proximo exercicio')
      ),
      next ? h('div', { className: 'rest-next' }, 'Proximo: ' + next.name) : null,
      h('div', { className: 'session-actions' },
        h('button', { className: 'session-btn skip', onclick: () => skipRest(() => render()) },
          'Saltar descanso'))
    ));
    return wrap;
  }

  // ── Exercising ──
  const ex = getCurrentExercise();
  if (!ex) { endSession(); render(); return wrap; }

  const card = h('div', { className: 'exercise-card' });

  // Animation
  const animContainer = h('div', { className: 'exercise-anim-container' });
  card.appendChild(animContainer);
  setTimeout(() => createExerciseAnimation(ex.id, animContainer), 10);

  // Play/pause
  card.appendChild(h('button', { className: 'exercise-play-btn', onclick: () => {
    animPaused = !animPaused;
    if (animPaused) pauseAnimation(animContainer);
    else resumeAnimation(animContainer);
  }}, animPaused ? '\u25B6' : '\u23F8'));

  card.appendChild(h('div', { className: 'exercise-name' }, ex.name));
  card.appendChild(h('div', { className: 'exercise-muscles' }, ex.targetMuscles.join(' · ')));

  // Counter
  const counter = h('div', { className: 'exercise-counter' },
    h('div', { className: 'exercise-counter-item' }, `Serie ${ss.currentSet}/${ex.sets}`),
    ex.holdSeconds > 0
      ? h('div', { className: 'exercise-counter-item' }, `Manter ${ex.holdSeconds}s`)
      : h('div', { className: 'exercise-counter-item' }, `${ex.reps} reps`)
  );
  card.appendChild(counter);

  // Breathing cue
  card.appendChild(h('div', { className: 'exercise-breathing' }, ex.breathingCue));

  // Steps
  const stepList = h('ol', { className: 'exercise-steps' });
  ex.steps.forEach((step, i) => {
    stepList.appendChild(h('li', null,
      h('span', { className: 'step-num' }, String(i + 1)),
      step));
  });
  card.appendChild(stepList);

  // Timer for isometric holds
  if (ex.holdSeconds > 0) {
    const timerDiv = h('div', { className: 'session-timer' });
    const timerCircle = h('div', { className: 'timer-circle' + (ss.holdRemaining > 0 ? ' active' : '') },
      h('div', { className: 'timer-value', id: 'physio-timer-display' },
        ss.holdRemaining > 0 ? formatTime(ss.holdRemaining) : formatTime(ex.holdSeconds))
    );
    timerDiv.appendChild(timerCircle);
    card.appendChild(timerDiv);
  }

  // Science reference
  card.appendChild(h('div', { className: 'exercise-science' }, ex.scienceRef));

  wrap.appendChild(card);

  // Action buttons
  const actions = h('div', { className: 'session-actions' });
  if (ex.holdSeconds > 0) {
    if (ss.holdRemaining <= 0) {
      actions.appendChild(h('button', { className: 'session-btn primary', onclick: () => {
        startHoldTimer(
          (rem) => {
            const el = document.getElementById('physio-timer-display');
            if (el) el.textContent = formatTime(rem);
          },
          () => { completeSet(() => render()); }
        );
        render();
      }}, 'Iniciar Hold'));
    } else {
      actions.appendChild(h('button', { className: 'session-btn primary', disabled: 'disabled' }, 'A manter...'));
    }
  } else {
    actions.appendChild(h('button', { className: 'session-btn primary', onclick: () => {
      completeSet(() => render());
    }}, ss.currentSet < ex.sets ? 'Proxima Serie' : 'Concluir Exercicio'));
  }
  actions.appendChild(h('button', { className: 'session-btn skip', onclick: () => {
    skipExercise(() => render());
  }}, 'Saltar'));
  wrap.appendChild(actions);

  return wrap;
}

// ── Render: Exercise Library ──────────────────────────────────
function renderPhysioLibrary(wrap) {
  // Filter buttons
  const filters = h('div', { className: 'library-filters' });
  [{ id: 0, label: 'Todos' }, ...PHYSIO_PHASES.map(p => ({ id: p.id, label: 'Fase ' + p.id }))].forEach(f => {
    filters.appendChild(h('button', {
      className: 'library-filter-btn' + (physioLibFilter === f.id ? ' active' : ''),
      onclick: () => { physioLibFilter = f.id; render(); }
    }, f.label));
  });
  wrap.appendChild(filters);

  // Exercise list
  const filtered = physioLibFilter === 0
    ? EXERCISES
    : EXERCISES.filter(e => e.phase === physioLibFilter);

  filtered.forEach(ex => {
    const isLocked = !state.physio.unlockedExercises.includes(ex.id);
    const card = h('div', { className: 'library-exercise-card' + (isLocked ? ' locked' : '') });

    // Preview
    const preview = h('div', { className: 'library-exercise-preview' });
    if (!isLocked) {
      setTimeout(() => createExerciseAnimation(ex.id, preview), 10);
    } else {
      preview.appendChild(h('span', { className: 'library-lock-icon' }, '\u{1F512}'));
    }
    card.appendChild(preview);

    // Info
    const info = h('div', { className: 'library-exercise-info' },
      h('div', { className: 'library-exercise-name' }, ex.name),
      h('div', { className: 'library-exercise-meta' },
        h('span', null, `~${ex.totalMinutes} min`),
        h('span', null, ex.category),
        (() => {
          const dots = h('div', { className: 'library-exercise-difficulty' });
          for (let i = 0; i < 5; i++) {
            dots.appendChild(h('div', { className: 'difficulty-dot' + (i < ex.difficulty ? ' filled' : '') }));
          }
          return dots;
        })()
      )
    );
    card.appendChild(info);
    wrap.appendChild(card);
  });

  return wrap;
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
  else if (screen === 'fasting') content.appendChild(renderFasting());
  else if (screen === 'physio') content.appendChild(renderPhysio());
  else if (screen === 'progress') content.appendChild(renderProgress());
  else if (screen === 'profile') content.appendChild(renderProfile());
  // Legacy screens (accessible from profile)
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
loadConfig().then(() => {
  applyTheme();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.theme === 'auto') applyTheme();
  });
  processNewDay();
  // Start movement tracking if enabled
  if (state.movement?.enabled) {
    startMovementTracking(state.movement, onMovementAlert);
  }
  render();
});
