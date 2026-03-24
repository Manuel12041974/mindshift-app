// ══════════════════════════════════════════════════════════════
// MindShift — AI Coach (Optional, Privacy-First)
// Uses Gemini API (free tier) with local CBT fallback
// Based on: Motivational Interviewing, CBT, Self-Compassion
// ══════════════════════════════════════════════════════════════

import { CBT_MESSAGES } from './habits.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `Es um coach de mudanca de habitos baseado em ciencia.
Usas tecnicas de: Motivational Interviewing (Miller & Rollnick), CBT (Beck),
Self-Compassion (Kristin Neff), Atomic Habits (James Clear), Tiny Habits (BJ Fogg).

Regras:
- Responde SEMPRE em portugues de Portugal
- Maximo 3-4 frases por resposta
- Nunca julgar ou criticar
- Focar em autocompaixao e pequenos passos
- Celebrar qualquer progresso, por menor que seja
- Quando alguem relata falha, usar autocompaixao primeiro
- Fazer perguntas abertas (Motivational Interviewing)
- Nunca dar conselhos medicos especificos`;

export class AICoach {
  constructor() {
    this.apiKey = localStorage.getItem('mindshift-gemini-key') || '';
    this.history = [];
    this.enabled = !!this.apiKey;
  }

  setApiKey(key) {
    this.apiKey = key;
    this.enabled = !!key;
    localStorage.setItem('mindshift-gemini-key', key);
  }

  removeApiKey() {
    this.apiKey = '';
    this.enabled = false;
    localStorage.removeItem('mindshift-gemini-key');
  }

  getContextSummary(state) {
    const today = new Date().toISOString().split('T')[0];
    const tc = state.dailyChecks[today] || {};
    const completed = Object.values(tc).filter(Boolean).length;
    const total = 12; // 4 goals x 3 habits
    const pct = Math.round((completed / total) * 100);

    return `Contexto do utilizador hoje: ${completed}/${total} habitos completados (${pct}%). ` +
      `Streak atual: ${state.streak} dias. Melhor streak: ${state.bestStreak} dias. ` +
      `Total de votos: ${state.totalVotes}. ` +
      `Dia ${Math.max(1, Math.floor((Date.now() - new Date(state.startDate).getTime()) / 86400000) + 1)} do programa.`;
  }

  async chat(message, state) {
    if (!this.enabled) {
      return this.fallbackResponse(message, state);
    }

    try {
      const context = this.getContextSummary(state);
      this.history.push({ role: 'user', parts: [{ text: message }] });

      const body = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT + '\n\n' + context }] },
        contents: this.history.slice(-6), // Keep last 6 messages for context
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      };

      const res = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error(`API ${res.status}`);
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!reply) throw new Error('Empty response');

      this.history.push({ role: 'model', parts: [{ text: reply }] });
      return { text: reply, source: 'ai' };
    } catch (e) {
      console.warn('AI Coach fallback:', e.message);
      return this.fallbackResponse(message, state);
    }
  }

  fallbackResponse(message, state) {
    const lower = message.toLowerCase();
    let category = 'celebration';

    if (lower.includes('falh') || lower.includes('nao conseg') || lower.includes('desist') || lower.includes('faltar')) {
      category = 'missed_day';
    } else if (lower.includes('motiv') || lower.includes('vontade') || lower.includes('preguic') || lower.includes('cansa')) {
      category = 'low_motivation';
    } else if (lower.includes('streak') || lower.includes('quebr') || lower.includes('perdi')) {
      category = 'streak_broken';
    } else if (lower.includes('plat') || lower.includes('estagna') || lower.includes('nao muda') || lower.includes('igual')) {
      category = 'plateau';
    }

    const msgs = CBT_MESSAGES[category] || CBT_MESSAGES.celebration;
    const text = msgs[Math.floor(Math.random() * msgs.length)];
    return { text, source: 'local' };
  }

  getGreeting(state) {
    const hour = new Date().getHours();
    const today = new Date().toISOString().split('T')[0];
    const tc = state.dailyChecks[today] || {};
    const completed = Object.values(tc).filter(Boolean).length;

    let timeGreeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const name = state.userName || '';

    if (completed === 0) {
      return `${timeGreeting}${name ? ', ' + name : ''}! Pronto para mais um dia de votos na tua nova identidade?`;
    } else if (completed >= 9) {
      return `${timeGreeting}${name ? ', ' + name : ''}! Dia incrivel \u2014 ja completaste ${completed} habitos. Estas a construir quem queres ser.`;
    } else {
      return `${timeGreeting}${name ? ', ' + name : ''}! Ja tens ${completed} habitos hoje. Cada um e um voto. Continua!`;
    }
  }
}
