// ══════════════════════════════════════════════════════════════
// MindShift — White-Label Configuration & Feature Flags
// Supports: custom branding, feature toggling, i18n, theming
// ══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  brand: { name: 'MindShift', tagline: 'Mudanca baseada em evidencia', logo: null },
  theme: {
    primary: '#4F46E5', primaryLight: '#E0E7FF', accent: '#818CF8',
    success: '#059669', warning: '#D97706', danger: '#E11D48',
    fontHeading: 'Fraunces', fontBody: 'DM Sans', borderRadius: '14px'
  },
  features: {
    habits: true, fasting: true, physio: true, movement: true,
    exercise: true, coach: true, journal: true, science: true
  },
  goals: ['weight', 'water', 'vegan', 'spine'],
  lang: 'pt'
};

let appConfig = { ...DEFAULT_CONFIG };

export async function loadConfig() {
  try {
    const res = await fetch('/config.json');
    if (res.ok) {
      const custom = await res.json();
      appConfig = { ...DEFAULT_CONFIG, ...custom,
        brand: { ...DEFAULT_CONFIG.brand, ...custom.brand },
        theme: { ...DEFAULT_CONFIG.theme, ...custom.theme },
        features: { ...DEFAULT_CONFIG.features, ...custom.features }
      };
    }
  } catch { /* use defaults */ }
  applyThemeTokens(appConfig.theme);
  return appConfig;
}

export function getConfig() { return appConfig; }
export function isFeatureEnabled(f) { return appConfig.features[f] !== false; }
export function getBrand() { return appConfig.brand; }

function applyThemeTokens(t) {
  const r = document.documentElement.style;
  if (t.primary) r.setProperty('--accent', t.primary);
  if (t.primaryLight) r.setProperty('--accent-light', t.primaryLight);
  if (t.success) r.setProperty('--success', t.success);
  if (t.warning) r.setProperty('--warning', t.warning);
  if (t.danger) r.setProperty('--danger', t.danger);
  if (t.borderRadius) r.setProperty('--radius-md', t.borderRadius);
}

// ── i18n (basic) ──────────────────────────────────────────────

const STRINGS = {
  pt: {
    nav: { home: 'Hoje', fasting: 'Jejum', physio: 'Fisio', progress: 'Progresso', profile: 'Perfil' },
    fasting: {
      start: 'Iniciar Jejum', stop: 'Terminar Jejum', elapsed: 'Tempo decorrido',
      remaining: 'Tempo restante', eatingWindow: 'Janela Alimentar', protocol: 'Protocolo',
      phase: 'Fase Metabolica', history: 'Historico', streak: 'Streak de Jejum',
      contraWarn: 'Aviso: Consulta um medico antes de iniciar jejum intermitente.',
      selectProtocol: 'Escolhe o teu protocolo'
    },
    movement: {
      breakTime: 'Hora de mover!', breaks: 'Pausas hoje', nextBreak: 'Proxima pausa em',
      weeklyGoal: 'Meta semanal', exercise: 'Exercicio', startTimer: 'Iniciar Timer',
      logExercise: 'Registar Exercicio'
    },
    progress: {
      weight: 'Peso', trend: 'Tendencia', goal: 'Objetivo', addWeight: 'Registar Peso',
      weeklyExercise: 'Exercicio Semanal', fastingCalendar: 'Calendario de Jejum'
    },
    profile: {
      settings: 'Definicoes', coach: 'Coach IA', journal: 'Diario',
      science: 'Ciencia', environment: 'Ambiente'
    },
    common: {
      min: 'min', hours: 'horas', days: 'dias', today: 'Hoje',
      save: 'Guardar', cancel: 'Cancelar', back: 'Voltar', next: 'Seguinte'
    }
  }
};

export function t(key) {
  const lang = appConfig.lang || 'pt';
  const keys = key.split('.');
  let val = STRINGS[lang];
  for (const k of keys) { val = val?.[k]; if (!val) return key; }
  return val;
}
