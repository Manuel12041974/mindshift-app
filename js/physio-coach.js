// ══════════════════════════════════════════════════════════════
// MindShift — Physiotherapy AI Coach Extension
// Pain-aware messages, exercise modifications, breathing cues
// Based on: McKenzie, McGill, CBT for chronic pain
// ══════════════════════════════════════════════════════════════

export const PHYSIO_CBT = {
  high_pain: [
    "A dor esta mais alta hoje — e normal haver flutuacoes. Vamos adaptar: faz apenas os exercicios mais suaves e com menos repeticoes.",
    "Quando a dor aumenta, o corpo esta a pedir cuidado, nao paragem total. Movimentos suaves como prone lying ajudam mais que repouso absoluto.",
    "A investigacao mostra que manter algum movimento e melhor que parar completamente. Vamos reduzir a intensidade, nao a consistencia."
  ],
  pain_improving: [
    "A tua dor esta a diminuir — sinal de que o programa esta a funcionar. O corpo esta a adaptar-se e a ficar mais forte.",
    "A tendencia e positiva! A cada sessao, estas a construir resiliencia na coluna. Continua com a mesma consistencia.",
    "Menos dor significa que podes comecar a desafiar um pouco mais. Quando te sentires pronto, vamos progredir."
  ],
  pain_stable: [
    "A dor esta estavel — isso e bom. O proximo passo e manter a consistencia e deixar o tempo trabalhar a teu favor.",
    "Plateaus de dor sao normais na reabilitacao. O corpo esta a consolidar. Confia no processo.",
    "Manter-se estavel e progresso. Nem sempre vemos melhoria linear, mas a base esta a ser construida."
  ],
  session_complete: [
    "Sessao concluida! Cada exercicio e um investimento na saude da tua coluna. O corpo agradece.",
    "Mais uma sessao feita. A reabilitacao e uma maratona, nao um sprint. Estas no caminho certo.",
    "Excelente trabalho! A consistencia e o ingrediente secreto da recuperacao. Volta amanha."
  ],
  phase_advance: [
    "Parabens! Avancaste para uma nova fase. O teu corpo provou que esta pronto para mais desafio.",
    "Nova fase desbloqueada! Isto significa que a dor diminuiu e a forca aumentou. Progresso real.",
    "Estas a progredir na reabilitacao. Novos exercicios vao desafiar-te de forma segura e progressiva."
  ],
  first_session: [
    "Bem-vindo ao programa de fisioterapia! Comecamos suave — o mais importante hoje e aprender os movimentos.",
    "Primeira sessao! Nao te preocupes com a perfeicao. O objectivo e mover-se com consciencia e sem dor aguda."
  ],
  skipped_day: [
    "Nao fizeste a sessao ontem — sem problema. A coluna beneficia de consistencia, nao de perfeicao. Volta hoje.",
    "Um dia sem exercicios nao e um passo atras. E uma pausa. O que importa e o padrao semanal."
  ]
};

export const BREATHING_CUES = {
  inhale: "Inspira pelo nariz...",
  exhale: "Expira pela boca...",
  hold: "Mantem a posicao...",
  brace: "Ativa o core — umbigo para dentro...",
  relax: "Relaxa e respira normalmente..."
};

export function getPhysioMessage(category) {
  const msgs = PHYSIO_CBT[category] || PHYSIO_CBT.session_complete;
  return msgs[Math.floor(Math.random() * msgs.length)];
}

export function getPainCategory(painLog) {
  if (!painLog || painLog.length < 2) return 'pain_stable';
  const recent = painLog.slice(-5);
  const avg = recent.reduce((s, p) => s + p.level, 0) / recent.length;
  const last = recent[recent.length - 1].level;

  if (last >= 7) return 'high_pain';
  if (recent.length >= 3) {
    const olderAvg = recent.slice(0, -2).reduce((s, p) => s + p.level, 0) / (recent.length - 2);
    if (avg < olderAvg - 1) return 'pain_improving';
  }
  return 'pain_stable';
}

export function getExerciseModification(exercise, painLevel) {
  if (painLevel <= 3) return null; // No modification needed
  if (painLevel <= 5 && exercise.modifications?.easier) {
    return { type: 'reduce', message: `Dor moderada: reduz para ${Math.ceil(exercise.reps / 2)} repeticoes` };
  }
  if (painLevel >= 6 && exercise.modifications?.easier) {
    return { type: 'swap', easierId: exercise.modifications.easier,
      message: 'Dor alta: vamos trocar por um exercicio mais suave' };
  }
  if (painLevel >= 8) {
    return { type: 'skip', message: 'Dor muito alta: salta este exercicio e faz respiracao profunda 1 minuto' };
  }
  return null;
}

export function getPhysioContext(state) {
  if (!state.physio) return '';
  const p = state.physio;
  const recentPain = p.painLog.slice(-3);
  const avgPain = recentPain.length > 0
    ? (recentPain.reduce((s, e) => s + e.level, 0) / recentPain.length).toFixed(1) : 'sem dados';
  return `Fisioterapia: Fase ${p.currentPhase}/4. ` +
    `Sessoes: ${p.sessions.length}. Dor media recente: ${avgPain}/10.`;
}
