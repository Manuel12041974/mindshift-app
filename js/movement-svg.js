// ══════════════════════════════════════════════════════════════
// MindShift — Movement SVG Visualizations
// Activity rings (Apple Watch style), exercise charts
// ══════════════════════════════════════════════════════════════

const svgNS = 'http://www.w3.org/2000/svg';

function createSVG(w, h) {
  const s = document.createElementNS(svgNS, 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${h || w}`);
  s.setAttribute('width', '100%');
  s.setAttribute('height', '100%');
  return s;
}

function circle(cx, cy, r, attrs) {
  const c = document.createElementNS(svgNS, 'circle');
  c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => c.setAttribute(k, v));
  return c;
}

function text(x, y, txt, size, color, weight) {
  const t = document.createElementNS(svgNS, 'text');
  t.setAttribute('x', x); t.setAttribute('y', y);
  t.setAttribute('text-anchor', 'middle');
  t.setAttribute('font-size', size || 12);
  t.setAttribute('font-family', 'DM Sans, sans-serif');
  t.setAttribute('font-weight', weight || '400');
  t.setAttribute('fill', color || '#6B7280');
  t.textContent = txt;
  return t;
}

// ── Activity Ring ────────────────────────────────────────────

export function createActivityRing(container, breaksTaken, breakGoal, size) {
  if (!container) return;
  container.textContent = '';

  const sz = size || 120;
  const cx = sz / 2, cy = sz / 2;
  const r = sz * 0.38;
  const s = createSVG(sz);
  s.classList.add('activity-ring-svg');

  const circumference = 2 * Math.PI * r;
  const percent = Math.min(100, (breaksTaken / Math.max(1, breakGoal)) * 100);
  const dashOffset = circumference * (1 - percent / 100);

  // Background ring
  s.appendChild(circle(cx, cy, r, {
    fill: 'none', stroke: '#E5E7EB', 'stroke-width': String(sz * 0.08), opacity: '0.3'
  }));

  // Progress ring
  const progressCircle = circle(cx, cy, r, {
    fill: 'none',
    stroke: percent >= 100 ? '#10B981' : '#4F46E5',
    'stroke-width': String(sz * 0.08),
    'stroke-linecap': 'round',
    'stroke-dasharray': String(circumference),
    'stroke-dashoffset': String(dashOffset),
    transform: `rotate(-90 ${cx} ${cy})`,
    'class': 'activity-ring-progress'
  });
  s.appendChild(progressCircle);

  // Center text
  s.appendChild(text(cx, cy - 2, String(breaksTaken), sz * 0.22, percent >= 100 ? '#10B981' : '#4F46E5', '800'));
  s.appendChild(text(cx, cy + sz * 0.12, `/${breakGoal}`, sz * 0.1, '#9CA3AF', '500'));

  // Completion check
  if (percent >= 100) {
    s.appendChild(text(cx, cy + sz * 0.28, '\u2713', sz * 0.12, '#10B981', '700'));
  }

  container.appendChild(s);
}

// ── Mini Activity Ring (for dashboard) ───────────────────────

export function createMiniActivityRing(container, breaksTaken, breakGoal) {
  createActivityRing(container, breaksTaken, breakGoal, 60);
}

// ── Exercise Weekly Chart ────────────────────────────────────

export function createExerciseWeeklyChart(container, weekData, weeklyGoal) {
  if (!container) return;
  container.textContent = '';

  const w = 280, h = 120;
  const s = createSVG(w, h);
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const barW = 24, gap = 16;
  const startX = 20;
  const maxH = 80;
  const barY = 95;
  const maxMin = Math.max(weeklyGoal / 7, ...weekData.map(d => d.minutes), 30);

  // Goal line
  const goalPerDay = weeklyGoal / 7;
  const goalY = barY - (goalPerDay / maxMin) * maxH;
  const goalLine = document.createElementNS(svgNS, 'line');
  goalLine.setAttribute('x1', startX - 5); goalLine.setAttribute('y1', goalY);
  goalLine.setAttribute('x2', startX + 7 * (barW + gap)); goalLine.setAttribute('y2', goalY);
  goalLine.setAttribute('stroke', '#EF4444');
  goalLine.setAttribute('stroke-width', '1');
  goalLine.setAttribute('stroke-dasharray', '4 3');
  goalLine.setAttribute('opacity', '0.5');
  s.appendChild(goalLine);
  s.appendChild(text(startX + 7 * (barW + gap) + 5, goalY + 3, `${Math.round(goalPerDay)}m`, 8, '#EF4444'));

  weekData.forEach((day, i) => {
    const x = startX + i * (barW + gap);
    const barH = Math.max(2, (day.minutes / maxMin) * maxH);

    // Bar
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', barY - barH);
    rect.setAttribute('width', barW); rect.setAttribute('height', barH);
    rect.setAttribute('rx', '4');
    rect.setAttribute('fill', day.minutes >= goalPerDay ? '#10B981' : day.minutes > 0 ? '#6366F1' : '#E5E7EB');
    if (day.isToday) {
      rect.setAttribute('stroke', '#4F46E5');
      rect.setAttribute('stroke-width', '2');
    }
    s.appendChild(rect);

    // Value
    if (day.minutes > 0) {
      s.appendChild(text(x + barW / 2, barY - barH - 4, String(day.minutes) + 'm', 8, '#6B7280', '500'));
    }

    // Day label
    s.appendChild(text(x + barW / 2, barY + 14, day.label, 9, day.isToday ? '#4F46E5' : '#9CA3AF', day.isToday ? '700' : '400'));
  });

  container.appendChild(s);
}

// ── Weight Trend Chart ───────────────────────────────────────

export function createWeightTrendChart(container, trendData, goalWeight) {
  if (!container) return;
  container.textContent = '';

  const w = 300, h = 140;
  const s = createSVG(w, h);
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const padding = { left: 35, right: 15, top: 15, bottom: 25 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  // Get weight range
  const weights = trendData.filter(d => d.weight !== null).map(d => d.weight);
  const avgWeights = trendData.filter(d => d.movingAvg !== null).map(d => d.movingAvg);
  const allW = [...weights, ...avgWeights, goalWeight].filter(v => v !== null && v !== undefined);
  if (allW.length === 0) {
    s.appendChild(text(w / 2, h / 2, 'Sem dados de peso', 12, '#9CA3AF'));
    container.appendChild(s);
    return;
  }

  const minW = Math.floor(Math.min(...allW) - 1);
  const maxW = Math.ceil(Math.max(...allW) + 1);
  const range = maxW - minW || 1;

  function xPos(i) { return padding.left + (i / (trendData.length - 1 || 1)) * chartW; }
  function yPos(val) { return padding.top + (1 - (val - minW) / range) * chartH; }

  // Y-axis labels
  for (let v = minW; v <= maxW; v += Math.ceil(range / 4)) {
    const y = yPos(v);
    s.appendChild(text(padding.left - 5, y + 3, String(v), 9, '#9CA3AF', '400', 'end'));
    const gridLine = document.createElementNS(svgNS, 'line');
    gridLine.setAttribute('x1', padding.left); gridLine.setAttribute('y1', y);
    gridLine.setAttribute('x2', w - padding.right); gridLine.setAttribute('y2', y);
    gridLine.setAttribute('stroke', '#E5E7EB'); gridLine.setAttribute('stroke-width', '0.5');
    s.appendChild(gridLine);
  }

  // Goal line
  if (goalWeight) {
    const gy = yPos(goalWeight);
    const gl = document.createElementNS(svgNS, 'line');
    gl.setAttribute('x1', padding.left); gl.setAttribute('y1', gy);
    gl.setAttribute('x2', w - padding.right); gl.setAttribute('y2', gy);
    gl.setAttribute('stroke', '#10B981'); gl.setAttribute('stroke-width', '1.5');
    gl.setAttribute('stroke-dasharray', '6 3');
    s.appendChild(gl);
    s.appendChild(text(w - padding.right + 2, gy - 4, 'Meta', 8, '#10B981', '600', 'start'));
  }

  // Moving average line
  let maPath = '';
  trendData.forEach((d, i) => {
    if (d.movingAvg !== null) {
      const x = xPos(i), y = yPos(d.movingAvg);
      maPath += (maPath ? ' L' : 'M') + ` ${x} ${y}`;
    }
  });
  if (maPath) {
    const maLine = document.createElementNS(svgNS, 'path');
    maLine.setAttribute('d', maPath);
    maLine.setAttribute('stroke', '#4F46E5');
    maLine.setAttribute('stroke-width', '2.5');
    maLine.setAttribute('fill', 'none');
    maLine.setAttribute('stroke-linecap', 'round');
    maLine.setAttribute('stroke-linejoin', 'round');
    s.appendChild(maLine);
  }

  // Raw data points
  trendData.forEach((d, i) => {
    if (d.weight !== null) {
      const x = xPos(i), y = yPos(d.weight);
      s.appendChild(circle(x, y, 3, {
        fill: '#fff', stroke: '#6366F1', 'stroke-width': '2'
      }));
    }
  });

  // X-axis labels (every other day for readability)
  trendData.forEach((d, i) => {
    if (i % Math.max(1, Math.floor(trendData.length / 7)) === 0 || d.isToday) {
      s.appendChild(text(xPos(i), h - 5, d.label, 8, d.isToday ? '#4F46E5' : '#9CA3AF', d.isToday ? '700' : '400'));
    }
  });

  container.appendChild(s);
}
