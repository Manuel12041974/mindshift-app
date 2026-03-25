// ══════════════════════════════════════════════════════════════
// MindShift — Movement & Exercise Module
// Sedentary alerts, micro-exercises, aerobic exercise logging
// Based on: Dunstan et al., Wilmot et al., WHO 2020 guidelines,
//           Protocol "20-8-2" (Straker et al.)
// ══════════════════════════════════════════════════════════════

// ── Default States ───────────────────────────────────────────

export const DEFAULT_MOVEMENT_STATE = {
  enabled: true,
  intervalMinutes: 30,
  protocol: '30-sit', // '30-sit' | '20-8-2' | 'custom'
  dailyBreakGoal: 12,
  breaksTaken: {},
  lastBreakTime: null,
  notificationsEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00'
};

export const DEFAULT_EXERCISE_STATE = {
  log: {},
  weeklyGoalMinutes: 150,
  activeTimerStart: null,
  activeTimerType: null
};

export const DEFAULT_WEIGHT_STATE = {
  entries: [],
  unit: 'kg',
  goalWeight: null,
  startWeight: null
};

// ── Micro-Exercises for Breaks ───────────────────────────────

export const MICRO_EXERCISES = [
  { id: 'standing-ext', name: 'Extensao em Pe', duration: 1,
    physioId: 'standing-extension', isSpineFriendly: true,
    desc: '10 extensoes lombares em pe — ideal para hernia discal.',
    science: 'McKenzie R. Treat Your Own Back' },
  { id: 'wall-angels', name: 'Wall Angels', duration: 2,
    physioId: null, isSpineFriendly: true,
    desc: 'Costas contra a parede, bracos em W→Y. 10 repeticoes.',
    science: 'Sahrmann S. Movement System Impairment Syndromes' },
  { id: 'hip-flexor', name: 'Along. Flexores da Anca', duration: 2,
    physioId: 'hip-flexor-stretch', isSpineFriendly: true,
    desc: 'Posicao de cavaleiro, 30 seg cada lado. Combate encurtamento de sentar.',
    science: 'Janda V. Muscles and Motor Control' },
  { id: 'desk-squat', name: 'Agachamento de Secretaria', duration: 1,
    physioId: null, isSpineFriendly: false,
    desc: '10 agachamentos suaves com apoio na secretaria.',
    science: 'WHO 2020 Physical Activity Guidelines' },
  { id: 'neck-circles', name: 'Circulos Cervicais', duration: 1,
    physioId: null, isSpineFriendly: true,
    desc: '5 circulos lentos em cada direcao. Alivia tensao cervical.',
    science: 'Liebenson C. Rehabilitation of the Spine' },
  { id: 'calf-raises', name: 'Elevacoes de Gemeos', duration: 1,
    physioId: null, isSpineFriendly: true,
    desc: '15 elevacoes. Promove circulacao nas pernas.',
    science: 'Peddie et al. 2013, American Journal of Clinical Nutrition' },
  { id: 'walk', name: 'Caminhada Curta', duration: 3,
    physioId: null, isSpineFriendly: true,
    desc: 'Caminha 2-3 minutos. O mais eficaz para quebrar sedentarismo.',
    science: 'Dunstan et al. 2012, Diabetes Care' }
];

// ── Aerobic Exercise Types ───────────────────────────────────

export const EXERCISE_TYPES = [
  { id: 'walking', name: 'Caminhada', icon: 'walking', metPerMin: 3.5, color: '#10B981' },
  { id: 'running', name: 'Corrida', icon: 'running', metPerMin: 8.0, color: '#EF4444' },
  { id: 'cycling', name: 'Ciclismo', icon: 'cycling', metPerMin: 6.0, color: '#F59E0B' },
  { id: 'swimming', name: 'Natacao', icon: 'swimming', metPerMin: 7.0, color: '#0EA5E9' },
  { id: 'other', name: 'Outro', icon: 'exercise', metPerMin: 4.0, color: '#6366F1' }
];

// ── Sedentary Protocol Info ──────────────────────────────────

export const MOVEMENT_PROTOCOLS = [
  { id: '30-sit', name: 'Pausa cada 30 min', intervalMin: 30,
    desc: 'A cada 30 minutos sentado, levanta-te e move-te 2-3 minutos.',
    science: 'Dunstan et al. 2012 — quebras frequentes reduzem glicose pos-prandial e circunferencia abdominal' },
  { id: '20-8-2', name: 'Protocolo 20-8-2', intervalMin: 30,
    desc: '20 min sentado → 8 min em pe → 2 min a mover. Ciclo de 30 min.',
    science: 'Straker et al. 2023 — maior reducao de fadiga e desconforto vs sentado continuo' },
  { id: 'custom', name: 'Personalizado', intervalMin: 45,
    desc: 'Define o teu proprio intervalo de pausas.', science: '' }
];

// ── Movement Timer ───────────────────────────────────────────

let movementTimer = null;
let movementCallback = null;

export function startMovementTracking(state, onAlert) {
  stopMovementTracking();
  if (!state.enabled) return;
  movementCallback = onAlert;
  const intervalMs = (state.intervalMinutes || 30) * 60 * 1000;
  state.lastBreakTime = Date.now();
  movementTimer = setInterval(() => {
    if (shouldAlert(state)) {
      if (onAlert) onAlert(getSuggestedExercise(state));
      sendBreakNotification(state);
    }
  }, intervalMs);
}

export function stopMovementTracking() {
  if (movementTimer) clearInterval(movementTimer);
  movementTimer = null;
}

export function getTimeSinceLastBreak(state) {
  if (!state.lastBreakTime) return 0;
  return Date.now() - state.lastBreakTime;
}

export function getMinutesSinceBreak(state) {
  return Math.floor(getTimeSinceLastBreak(state) / 60000);
}

export function getNextBreakMinutes(state) {
  const interval = state.intervalMinutes || 30;
  const since = getMinutesSinceBreak(state);
  return Math.max(0, interval - since);
}

function shouldAlert(state) {
  if (!state.enabled) return false;
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const nowStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  if (state.quietHoursStart && state.quietHoursEnd) {
    if (nowStr >= state.quietHoursStart || nowStr < state.quietHoursEnd) return false;
  }
  return true;
}

// ── Break Recording ──────────────────────────────────────────

export function recordBreak(state, type, durationMin) {
  const today = new Date().toISOString().split('T')[0];
  if (!state.breaksTaken[today]) state.breaksTaken[today] = [];
  state.breaksTaken[today].push({
    time: Date.now(),
    duration: durationMin || 2,
    type: type || 'general'
  });
  state.lastBreakTime = Date.now();
}

export function getTodayBreaks(state) {
  const today = new Date().toISOString().split('T')[0];
  return state.breaksTaken[today] || [];
}

export function getBreakProgress(state) {
  const taken = getTodayBreaks(state).length;
  const goal = state.dailyBreakGoal || 12;
  return { taken, goal, percent: Math.min(100, Math.round((taken / goal) * 100)) };
}

// ── Suggested Exercise ───────────────────────────────────────

export function getSuggestedExercise(physioState) {
  const spineFriendly = MICRO_EXERCISES.filter(e => e.isSpineFriendly);
  return spineFriendly[Math.floor(Math.random() * spineFriendly.length)];
}

export function getSpineFriendlyBreak(physioPhase) {
  if (physioPhase <= 1) {
    return MICRO_EXERCISES.find(e => e.physioId === 'standing-extension') || MICRO_EXERCISES[0];
  }
  const options = MICRO_EXERCISES.filter(e => e.isSpineFriendly);
  return options[Math.floor(Math.random() * options.length)];
}

// ── Notification API ─────────────────────────────────────────

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

function sendBreakNotification(state) {
  if (!state.notificationsEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const exercise = getSuggestedExercise();
  try {
    new Notification('MindShift — Hora de Mover!', {
      body: `${exercise.name}: ${exercise.desc} (${exercise.duration} min)`,
      icon: '/icons/icon-192.png',
      tag: 'movement-break',
      requireInteraction: false
    });
  } catch { /* notification failed silently */ }
}

// ── Exercise Logging ─────────────────────────────────────────

export function logExercise(exerciseState, type, durationMin, notes) {
  const today = new Date().toISOString().split('T')[0];
  if (!exerciseState.log[today]) exerciseState.log[today] = [];
  exerciseState.log[today].push({
    type, duration: durationMin,
    time: Date.now(),
    notes: notes || ''
  });
}

export function startExerciseTimer(exerciseState, type) {
  exerciseState.activeTimerStart = Date.now();
  exerciseState.activeTimerType = type;
}

export function stopExerciseTimer(exerciseState) {
  if (!exerciseState.activeTimerStart) return 0;
  const duration = Math.round((Date.now() - exerciseState.activeTimerStart) / 60000);
  logExercise(exerciseState, exerciseState.activeTimerType || 'other', duration);
  exerciseState.activeTimerStart = null;
  exerciseState.activeTimerType = null;
  return duration;
}

export function getTodayExerciseMinutes(exerciseState) {
  const today = new Date().toISOString().split('T')[0];
  const entries = exerciseState.log[today] || [];
  return entries.reduce((sum, e) => sum + (e.duration || 0), 0);
}

export function getWeekExerciseMinutes(exerciseState) {
  const now = new Date();
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const entries = exerciseState.log[key] || [];
    total += entries.reduce((sum, e) => sum + (e.duration || 0), 0);
  }
  return total;
}

export function getWeekExerciseByDay(exerciseState) {
  const now = new Date();
  const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const entries = exerciseState.log[key] || [];
    const minutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    result.push({
      date: key, label: labels[d.getDay()],
      minutes, isToday: i === 0
    });
  }
  return result;
}

// ── Weight Tracking ──────────────────────────────────────────

export function logWeight(weightState, weight) {
  const today = new Date().toISOString().split('T')[0];
  // Remove existing entry for today
  weightState.entries = weightState.entries.filter(e => e.date !== today);
  weightState.entries.push({ date: today, weight });
  weightState.entries.sort((a, b) => a.date.localeCompare(b.date));
  if (!weightState.startWeight) weightState.startWeight = weight;
}

export function getWeightTrend(weightState, days) {
  const now = new Date();
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const entry = weightState.entries.find(e => e.date === key);
    result.push({
      date: key,
      label: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][d.getDay()],
      weight: entry?.weight || null,
      isToday: i === 0
    });
  }
  return result;
}

export function getMovingAverage(weightState, days, windowSize) {
  const trend = getWeightTrend(weightState, days);
  const weights = trend.map(d => d.weight);
  const ma = [];
  for (let i = 0; i < weights.length; i++) {
    const window = weights.slice(Math.max(0, i - windowSize + 1), i + 1).filter(w => w !== null);
    ma.push(window.length > 0 ? window.reduce((s, w) => s + w, 0) / window.length : null);
  }
  return trend.map((d, i) => ({ ...d, movingAvg: ma[i] }));
}

export function getWeightDelta(weightState) {
  const entries = weightState.entries;
  if (entries.length < 2) return null;
  const first = entries[0].weight;
  const last = entries[entries.length - 1].weight;
  return { delta: Math.round((last - first) * 10) / 10, direction: last < first ? 'down' : last > first ? 'up' : 'same' };
}
