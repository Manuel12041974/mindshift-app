// ══════════════════════════════════════════════════════════════
// MindShift — Progress Charts (Canvas-based, zero dependencies)
// Weekly adherence visualization
// ══════════════════════════════════════════════════════════════

export function renderWeeklyChart(container, dailyChecks, totalPossible) {
  const today = new Date();
  const days = [];
  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

  // Get last 7 days of data
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const checks = dailyChecks[key] || {};
    const completed = Object.values(checks).filter(Boolean).length;
    const pct = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
    days.push({
      label: labels[d.getDay() === 0 ? 6 : d.getDay() - 1],
      pct,
      completed,
      isToday: i === 0,
      date: key
    });
  }

  container.textContent = '';

  const barsDiv = document.createElement('div');
  barsDiv.className = 'chart-bars';

  days.forEach(day => {
    const wrap = document.createElement('div');
    wrap.className = 'chart-bar-wrap';

    const val = document.createElement('div');
    val.className = 'chart-bar-value';
    val.style.color = day.pct >= 60 ? '#059669' : day.pct > 0 ? '#D97706' : '#9CA3AF';
    val.textContent = day.pct > 0 ? day.pct + '%' : '';

    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    const maxH = 100;
    bar.style.height = Math.max(4, (day.pct / 100) * maxH) + 'px';

    if (day.pct >= 80) bar.style.background = 'linear-gradient(180deg, #059669, #10B981)';
    else if (day.pct >= 60) bar.style.background = 'linear-gradient(180deg, #D97706, #FBBF24)';
    else if (day.pct > 0) bar.style.background = 'linear-gradient(180deg, #9CA3AF, #D1D5DB)';
    else bar.style.background = '#F3F4F6';

    if (day.isToday) {
      bar.style.boxShadow = '0 0 8px rgba(99, 102, 241, 0.3)';
      bar.style.border = '2px solid #6366F1';
    }

    const label = document.createElement('div');
    label.className = 'chart-bar-label';
    label.textContent = day.label;
    if (day.isToday) {
      label.style.fontWeight = '700';
      label.style.color = '#4F46E5';
    }

    wrap.appendChild(val);
    wrap.appendChild(bar);
    wrap.appendChild(label);
    barsDiv.appendChild(wrap);
  });

  container.appendChild(barsDiv);
}

export function renderAutomaticityMeter(container, automaticityScore) {
  const score = Math.min(100, Math.max(0, automaticityScore || 0));
  container.textContent = '';

  const title = document.createElement('div');
  title.className = 'auto-title';
  title.textContent = 'Nivel de Automaticidade';

  const subtitle = document.createElement('div');
  subtitle.className = 'auto-subtitle';
  subtitle.textContent = score >= 75 ? 'Os teus habitos estao quase automaticos!'
    : score >= 50 ? 'Bom progresso! Continua consistente.'
    : score >= 25 ? 'A construir a base. Cada dia conta.'
    : 'Inicio da jornada. Foca no mais pequeno.';

  const track = document.createElement('div');
  track.className = 'auto-track';

  const fill = document.createElement('div');
  fill.className = 'auto-fill';
  fill.style.width = score + '%';
  if (score >= 75) fill.style.background = 'linear-gradient(90deg, #059669, #10B981)';
  else if (score >= 50) fill.style.background = 'linear-gradient(90deg, #6366F1, #818CF8)';
  else fill.style.background = 'linear-gradient(90deg, #D97706, #FBBF24)';
  track.appendChild(fill);

  const markers = document.createElement('div');
  markers.className = 'auto-markers';
  ['Consciente', 'Deliberado', 'Facil', 'Automatico'].forEach(m => {
    const s = document.createElement('span');
    s.textContent = m;
    markers.appendChild(s);
  });

  container.appendChild(title);
  container.appendChild(subtitle);
  container.appendChild(track);
  container.appendChild(markers);
}
