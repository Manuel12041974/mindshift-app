// ══════════════════════════════════════════════════════════════
// MindShift — Fasting SVG Visualizations
// Circular timer ring, metabolic phase indicators, body icons
// ══════════════════════════════════════════════════════════════

import { METABOLIC_PHASES } from './fasting.js';

const svgNS = 'http://www.w3.org/2000/svg';

function createSVG(size) {
  const s = document.createElementNS(svgNS, 'svg');
  s.setAttribute('viewBox', `0 0 ${size} ${size}`);
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

function arc(cx, cy, r, startAngle, endAngle, color, width) {
  const path = document.createElementNS(svgNS, 'path');
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const d = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  path.setAttribute('d', d);
  path.setAttribute('stroke', color || '#4F46E5');
  path.setAttribute('stroke-width', width || 8);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  return path;
}

function polarToCartesian(cx, cy, r, degrees) {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function text(x, y, txt, size, color, weight, anchor) {
  const t = document.createElementNS(svgNS, 'text');
  t.setAttribute('x', x); t.setAttribute('y', y);
  t.setAttribute('text-anchor', anchor || 'middle');
  t.setAttribute('font-size', size || 14);
  t.setAttribute('font-family', 'DM Sans, sans-serif');
  t.setAttribute('font-weight', weight || '400');
  t.setAttribute('fill', color || '#111827');
  t.textContent = txt;
  return t;
}

// ── Circular Fasting Timer ───────────────────────────────────

export function createFastingTimer(container, percent, elapsedHours, remainingStr, currentPhase, totalHours) {
  if (!container) return;
  container.textContent = '';

  const size = 260;
  const cx = size / 2, cy = size / 2;
  const outerR = 110;
  const innerR = 95;
  const s = createSVG(size);
  s.classList.add('fasting-timer-svg');

  // Background track
  s.appendChild(circle(cx, cy, outerR, {
    fill: 'none', stroke: '#E5E7EB', 'stroke-width': '10', opacity: '0.3'
  }));

  // Phase segments (thin ring behind progress)
  const phaseR = outerR + 8;
  METABOLIC_PHASES.forEach((phase, i) => {
    const next = METABOLIC_PHASES[i + 1];
    const startDeg = (phase.startHour / Math.max(totalHours, 24)) * 360;
    const endDeg = ((next ? next.startHour : Math.max(totalHours, 24)) / Math.max(totalHours, 24)) * 360;
    if (endDeg > startDeg) {
      const segArc = arc(cx, cy, phaseR, startDeg, Math.min(endDeg, 360), phase.color, 3);
      segArc.setAttribute('opacity', '0.4');
      s.appendChild(segArc);
    }
  });

  // Progress arc
  if (percent > 0) {
    const progressAngle = Math.min(359.9, (percent / 100) * 360);
    const progressArc = arc(cx, cy, outerR, 0, progressAngle, currentPhase?.color || '#4F46E5', 10);
    progressArc.classList.add('fasting-progress-arc');
    s.appendChild(progressArc);

    // Glowing dot at end of progress
    const dotPos = polarToCartesian(cx, cy, outerR, progressAngle);
    s.appendChild(circle(dotPos.x, dotPos.y, 6, {
      fill: currentPhase?.color || '#4F46E5',
      filter: 'url(#glow)',
      'class': 'fasting-dot'
    }));
  }

  // Glow filter
  const defs = document.createElementNS(svgNS, 'defs');
  const filter = document.createElementNS(svgNS, 'filter');
  filter.setAttribute('id', 'glow');
  const blur = document.createElementNS(svgNS, 'feGaussianBlur');
  blur.setAttribute('stdDeviation', '3');
  blur.setAttribute('result', 'blur');
  const merge = document.createElementNS(svgNS, 'feMerge');
  const m1 = document.createElementNS(svgNS, 'feMergeNode');
  m1.setAttribute('in', 'blur');
  const m2 = document.createElementNS(svgNS, 'feMergeNode');
  m2.setAttribute('in', 'SourceGraphic');
  merge.appendChild(m1); merge.appendChild(m2);
  filter.appendChild(blur); filter.appendChild(merge);
  defs.appendChild(filter);
  s.appendChild(defs);

  // Center content
  // Time display
  s.appendChild(text(cx, cy - 15, remainingStr, 32, 'var(--text, #111827)', '800'));

  // Phase name
  if (currentPhase) {
    s.appendChild(text(cx, cy + 12, currentPhase.shortName, 13, currentPhase.color, '600'));
  }

  // Elapsed hours
  const elapsedStr = elapsedHours >= 1 ? `${Math.floor(elapsedHours)}h ${Math.round((elapsedHours % 1) * 60)}m` : `${Math.round(elapsedHours * 60)}m`;
  s.appendChild(text(cx, cy + 35, elapsedStr + ' decorridas', 11, '#9CA3AF', '400'));

  container.appendChild(s);
}

// ── Mini Timer (for dashboard widget) ────────────────────────

export function createMiniTimer(container, percent, currentPhase, timeStr) {
  if (!container) return;
  container.textContent = '';

  const size = 70;
  const cx = size / 2, cy = size / 2;
  const r = 28;
  const s = createSVG(size);

  // Background
  s.appendChild(circle(cx, cy, r, {
    fill: 'none', stroke: '#E5E7EB', 'stroke-width': '5', opacity: '0.3'
  }));

  // Progress
  if (percent > 0) {
    const angle = Math.min(359.9, (percent / 100) * 360);
    s.appendChild(arc(cx, cy, r, 0, angle, currentPhase?.color || '#4F46E5', 5));
  }

  // Center time
  s.appendChild(text(cx, cy + 4, timeStr, 11, 'var(--text, #111827)', '700'));

  container.appendChild(s);
}

// ── Eating Window Bar ────────────────────────────────────────

export function createEatingWindowBar(container, startHour, endHour, currentHour) {
  if (!container) return;
  container.textContent = '';

  const s = createSVG(280, 40);
  s.setAttribute('viewBox', '0 0 280 40');

  // 24-hour bar background
  const barY = 15, barH = 12;
  const rect = document.createElementNS(svgNS, 'rect');
  rect.setAttribute('x', 10); rect.setAttribute('y', barY);
  rect.setAttribute('width', 260); rect.setAttribute('height', barH);
  rect.setAttribute('rx', 6); rect.setAttribute('fill', '#FEE2E2');
  s.appendChild(rect);

  // Eating window (green segment)
  const eatStart = 10 + (startHour / 24) * 260;
  const eatWidth = ((endHour - startHour) / 24) * 260;
  const eatRect = document.createElementNS(svgNS, 'rect');
  eatRect.setAttribute('x', eatStart); eatRect.setAttribute('y', barY);
  eatRect.setAttribute('width', eatWidth); eatRect.setAttribute('height', barH);
  eatRect.setAttribute('rx', 6); eatRect.setAttribute('fill', '#D1FAE5');
  s.appendChild(eatRect);

  // Current time indicator
  if (currentHour !== null && currentHour !== undefined) {
    const nowX = 10 + (currentHour / 24) * 260;
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', nowX); line.setAttribute('y1', barY - 3);
    line.setAttribute('x2', nowX); line.setAttribute('y2', barY + barH + 3);
    line.setAttribute('stroke', '#4F46E5'); line.setAttribute('stroke-width', '2');
    s.appendChild(line);
    s.appendChild(circle(nowX, barY - 5, 3, { fill: '#4F46E5' }));
  }

  // Labels
  s.appendChild(text(10, 38, '0h', 9, '#9CA3AF'));
  s.appendChild(text(75, 38, '6h', 9, '#9CA3AF'));
  s.appendChild(text(140, 38, '12h', 9, '#9CA3AF'));
  s.appendChild(text(205, 38, '18h', 9, '#9CA3AF'));
  s.appendChild(text(265, 38, '24h', 9, '#9CA3AF'));

  // Eating window label
  const eatMid = eatStart + eatWidth / 2;
  s.appendChild(text(eatMid, barY + barH / 2 + 4, 'Comer', 8, '#059669', '600'));

  container.appendChild(s);
}

// ── Body State Icons ─────────────────────────────────────────

export function createBodyStateIcon(phase, size) {
  const s = createSVG(size || 40);
  const cx = (size || 40) / 2, cy = (size || 40) / 2;

  switch (phase?.id) {
    case 'fed':
      // Stomach icon
      s.appendChild(circle(cx, cy, 12, { fill: 'none', stroke: '#10B981', 'stroke-width': '2' }));
      s.appendChild(text(cx, cy + 5, '\u{1F34E}', 14, '#10B981')); // apple
      break;
    case 'catabolic':
      // Arrow down icon
      s.appendChild(circle(cx, cy, 12, { fill: 'none', stroke: '#F59E0B', 'stroke-width': '2' }));
      s.appendChild(text(cx, cy + 5, '\u{26A1}', 14, '#F59E0B')); // lightning
      break;
    case 'fatburn':
      // Flame
      s.appendChild(circle(cx, cy, 12, { fill: 'none', stroke: '#EF4444', 'stroke-width': '2' }));
      s.appendChild(text(cx, cy + 5, '\u{1F525}', 14, '#EF4444')); // fire
      break;
    case 'ketosis':
      // Ketone molecule
      s.appendChild(circle(cx, cy, 12, { fill: 'none', stroke: '#8B5CF6', 'stroke-width': '2' }));
      s.appendChild(text(cx, cy + 5, '\u{1F9EA}', 14, '#8B5CF6')); // test tube
      break;
    case 'autophagy':
      // Cell recycling
      s.appendChild(circle(cx, cy, 12, { fill: 'none', stroke: '#EC4899', 'stroke-width': '2' }));
      s.appendChild(text(cx, cy + 5, '\u{1F52C}', 14, '#EC4899')); // microscope
      break;
    default:
      s.appendChild(circle(cx, cy, 12, { fill: 'none', stroke: '#9CA3AF', 'stroke-width': '2' }));
      s.appendChild(text(cx, cy + 5, '\u{23F0}', 14, '#9CA3AF')); // clock
  }

  return s;
}
