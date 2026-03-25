// ══════════════════════════════════════════════════════════════
// MindShift — Intermittent Fasting Module
// Evidence-based IF protocols for visceral fat reduction
// Based on: de Cabo & Mattson 2019 NEJM, Varady 2022,
//           Satchin Panda (circadian), Anton 2018, Ohsumi 2016
// ══════════════════════════════════════════════════════════════

// ── Protocols ─────────────────────────────────────────────────

export const FASTING_PROTOCOLS = [
  { id: '14:10', name: 'Iniciante 14:10', fastHours: 14, eatHours: 10,
    desc: 'Ideal para comecar. Janela alimentar de 10h — facil de manter.',
    science: 'Wilkinson et al. 2020, Cell Metabolism',
    difficulty: 1, recommended: false },
  { id: '16:8', name: 'Classico 16:8', fastHours: 16, eatHours: 8,
    desc: 'O protocolo mais estudado. 16h de jejum, janela de 8h. Optimal para gordura visceral.',
    science: 'de Cabo & Mattson 2019, NEJM; Varady 2022',
    difficulty: 2, recommended: true },
  { id: '18:6', name: 'Avancado 18:6', fastHours: 18, eatHours: 6,
    desc: 'Beneficios amplificados de autofagia e cetose. Para praticantes experientes.',
    science: 'Varady 2022, Nature Reviews Endocrinology',
    difficulty: 3, recommended: false },
  { id: '20:4', name: 'Guerreiro 20:4', fastHours: 20, eatHours: 4,
    desc: 'Protocolo avancado. Janela alimentar curta — apenas para experientes.',
    science: 'Anton et al. 2018, Obesity',
    difficulty: 4, recommended: false },
  { id: '5:2', name: 'Dieta 5:2', fastHours: 0, eatHours: 0,
    specialType: true, // 5 normal days, 2 ~500kcal days
    desc: '5 dias normais + 2 dias com ~500kcal. Mais flexibilidade semanal.',
    science: 'Harvie et al. 2011, IJO',
    difficulty: 2, recommended: false },
  { id: 'custom', name: 'Personalizado', fastHours: 16, eatHours: 8,
    desc: 'Define o teu proprio protocolo de jejum.',
    science: '', difficulty: 0, recommended: false }
];

// ── Metabolic Phases ──────────────────────────────────────────

export const METABOLIC_PHASES = [
  { id: 'fed', name: 'Estado Alimentado', shortName: 'Alimentado',
    startHour: 0, endHour: 4,
    color: '#10B981', bgColor: '#F0FDF4',
    icon: 'eating',
    desc: 'Insulina elevada. Corpo a usar glicose como combustivel principal.',
    science: 'Fisiologia basica — Guyton & Hall' },
  { id: 'catabolic', name: 'Fase Catabolica', shortName: 'Catabolico',
    startHour: 4, endHour: 12,
    color: '#F59E0B', bgColor: '#FFFBEB',
    icon: 'phase',
    desc: 'Reservas de glicogenio a diminuir. Corpo a iniciar transicao para gordura.',
    science: 'Cahill 2006, Annual Review of Nutrition' },
  { id: 'fatburn', name: 'Queima de Gordura', shortName: 'Fat Burn',
    startHour: 12, endHour: 18,
    color: '#EF4444', bgColor: '#FEF2F2',
    icon: 'flame',
    desc: 'Lipolise maximizada. Gordura visceral a ser metabolizada activamente.',
    science: 'de Cabo & Mattson 2019, NEJM' },
  { id: 'ketosis', name: 'Cetose Leve', shortName: 'Cetose',
    startHour: 18, endHour: 24,
    color: '#8B5CF6', bgColor: '#F5F3FF',
    icon: 'ketone',
    desc: 'Producao de corpos cetonicos. Clareza mental aumentada. Gordura como combustivel primario.',
    science: 'Anton et al. 2018, Obesity' },
  { id: 'autophagy', name: 'Autofagia Profunda', shortName: 'Autofagia',
    startHour: 24, endHour: 72,
    color: '#EC4899', bgColor: '#FDF2F8',
    icon: 'autophagy',
    desc: 'Reciclagem celular. Limpeza de proteinas danificadas e organelos disfuncionais.',
    science: 'Yoshinori Ohsumi 2016 (Nobel); Alirezaei 2010, Autophagy' }
];

// ── Contraindications ────────────────────────────────────────

export const CONTRAINDICATIONS = [
  { id: 'pregnancy', label: 'Gravida ou a amamentar', severity: 'absolute' },
  { id: 'diabetes_t1', label: 'Diabetes tipo 1', severity: 'absolute' },
  { id: 'eating_disorder', label: 'Historial de disturbios alimentares', severity: 'absolute' },
  { id: 'underweight', label: 'IMC abaixo de 18.5', severity: 'absolute' },
  { id: 'under18', label: 'Menos de 18 anos', severity: 'absolute' },
  { id: 'diabetes_t2', label: 'Diabetes tipo 2 medicada', severity: 'relative',
    warning: 'Consulta o medico antes de iniciar. Pode ser necessario ajustar medicacao.' },
  { id: 'medication', label: 'Medicacao que requer refeicoes', severity: 'relative',
    warning: 'Verifica com o medico se a janela alimentar e compativel.' },
  { id: 'intense_training', label: 'Treino intenso diario (>1h)', severity: 'caution',
    warning: 'Ajusta o protocolo para cobrir refeicoes peri-treino.' }
];

// ── Default State ────────────────────────────────────────────

export const DEFAULT_FASTING_STATE = {
  protocol: '16:8',
  customFastHours: 16,
  customEatHours: 8,
  isActive: false,
  startTime: null,
  targetEndTime: null,
  history: [],
  currentStreak: 0,
  bestStreak: 0,
  totalFasts: 0,
  contraindChecked: false
};

// ── Fasting Engine ───────────────────────────────────────────

export function getProtocol(state) {
  return FASTING_PROTOCOLS.find(p => p.id === state.protocol) || FASTING_PROTOCOLS[1]; // default 16:8
}

export function getFastHours(state) {
  const proto = getProtocol(state);
  if (proto.id === 'custom') return state.customFastHours || 16;
  return proto.fastHours;
}

export function getEatHours(state) {
  const proto = getProtocol(state);
  if (proto.id === 'custom') return state.customEatHours || 8;
  return proto.eatHours;
}

export function startFast(state) {
  const now = Date.now();
  const fastH = getFastHours(state);
  state.isActive = true;
  state.startTime = now;
  state.targetEndTime = now + fastH * 3600000;
}

export function endFast(state) {
  if (!state.isActive || !state.startTime) return null;
  const now = Date.now();
  const duration = (now - state.startTime) / 3600000; // hours
  const fastH = getFastHours(state);
  const completed = duration >= fastH * 0.9; // 90% threshold for "completed"
  const entry = {
    date: new Date(state.startTime).toISOString().split('T')[0],
    startTime: state.startTime,
    endTime: now,
    duration: Math.round(duration * 10) / 10,
    protocol: state.protocol,
    completed
  };
  state.history.push(entry);
  state.totalFasts++;

  if (completed) {
    state.currentStreak++;
    state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
  } else {
    state.currentStreak = 0;
  }

  state.isActive = false;
  state.startTime = null;
  state.targetEndTime = null;
  return entry;
}

export function getElapsedMs(state) {
  if (!state.isActive || !state.startTime) return 0;
  return Date.now() - state.startTime;
}

export function getElapsedHours(state) {
  return getElapsedMs(state) / 3600000;
}

export function getRemainingMs(state) {
  if (!state.isActive || !state.targetEndTime) return 0;
  return Math.max(0, state.targetEndTime - Date.now());
}

export function getProgressPercent(state) {
  if (!state.isActive || !state.startTime) return 0;
  const total = getFastHours(state) * 3600000;
  const elapsed = getElapsedMs(state);
  return Math.min(100, (elapsed / total) * 100);
}

export function getCurrentPhase(elapsedHours) {
  for (let i = METABOLIC_PHASES.length - 1; i >= 0; i--) {
    if (elapsedHours >= METABOLIC_PHASES[i].startHour) return METABOLIC_PHASES[i];
  }
  return METABOLIC_PHASES[0];
}

export function getEatingWindow(state) {
  const fastH = getFastHours(state);
  const eatH = getEatHours(state);
  // Default: eating window from noon to 8pm (for 16:8)
  const endHour = 20; // 8pm default end
  const startHour = endHour - eatH;
  return {
    start: `${String(startHour).padStart(2, '0')}:00`,
    end: `${String(endHour).padStart(2, '0')}:00`,
    startHour, endHour
  };
}

export function isInEatingWindow(state) {
  const { startHour, endHour } = getEatingWindow(state);
  const now = new Date().getHours();
  return now >= startHour && now < endHour;
}

// ── History Helpers ──────────────────────────────────────────

export function getFastingHistory(state, days) {
  const now = new Date();
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const entry = state.history.find(h => h.date === key);
    result.push({
      date: key,
      completed: entry?.completed || false,
      duration: entry?.duration || 0,
      protocol: entry?.protocol || null,
      dayOfWeek: d.getDay()
    });
  }
  return result;
}

export function getMonthCalendar(state, year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const key = date.toISOString().split('T')[0];
    const entry = state.history.find(h => h.date === key);
    days.push({
      date: d, key, dayOfWeek: date.getDay(),
      completed: entry?.completed || false,
      partial: entry && !entry.completed,
      duration: entry?.duration || 0
    });
  }
  return { year, month, monthName: firstDay.toLocaleString('pt', { month: 'long' }), days };
}

// ── Exercise Timing Integration ──────────────────────────────

export function getOptimalExerciseAdvice(state) {
  if (!state.isActive) return { advice: 'Podes treinar normalmente fora do jejum.', types: ['all'] };
  const elapsed = getElapsedHours(state);
  if (elapsed < 12) {
    return { advice: 'Podes treinar normalmente nesta fase do jejum.',
      types: ['walking', 'running', 'cycling'], science: 'Schoenfeld 2014, JISSN' };
  }
  if (elapsed < 18) {
    return { advice: 'Exercicio leve recomendado (caminhada). Evita treino intenso.',
      types: ['walking'], science: 'Vieira et al. 2016, BJSM' };
  }
  return { advice: 'Jejum prolongado: apenas caminhada suave.',
    types: ['walking'], science: 'de Cabo & Mattson 2019, NEJM' };
}

// ── Vegan + IF Guidance ──────────────────────────────────────

export const VEGAN_IF_TIPS = [
  'Abre a janela alimentar com proteina vegetal: tofu, tempeh, leguminosas ou seitan.',
  'Distribui a proteina (~0.8-1g/kg) ao longo da janela alimentar, nao toda numa refeicao.',
  'Inclui fontes de ferro heme-like (lentilhas, espinafres) com vitamina C para absorcao.',
  'B12 e essencial — suplementa independentemente do protocolo de jejum.',
  'Omega-3: sementes de chia, linhaca ou suplemento de alga na primeira refeicao.',
  'No final da janela: refeicao rica em fibra (aveia, legumes) para saciedade durante o jejum.'
];

// ── Time Formatting ──────────────────────────────────────────

export function formatFastTime(ms) {
  if (ms <= 0) return '0:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatHoursShort(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
