// ══════════════════════════════════════════════════════════════
// MindShift — Physiotherapy SVG Animation System
// Stick figure animations for 24 exercises using CSS keyframes
// Zero dependencies — pure SVG + CSS
// ══════════════════════════════════════════════════════════════

const svgNS = 'http://www.w3.org/2000/svg';

// ── Stick Figure Builder ─────────────────────────────────────

function createSVG(w, h) {
  const s = document.createElementNS(svgNS, 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  s.setAttribute('width', '100%');
  s.setAttribute('height', '100%');
  s.classList.add('physio-anim');
  return s;
}

function circle(cx, cy, r, cls, color) {
  const c = document.createElementNS(svgNS, 'circle');
  c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
  c.setAttribute('fill', color || '#4F46E5');
  if (cls) c.setAttribute('class', cls);
  return c;
}

function line(x1, y1, x2, y2, cls, color, width) {
  const l = document.createElementNS(svgNS, 'line');
  l.setAttribute('x1', x1); l.setAttribute('y1', y1);
  l.setAttribute('x2', x2); l.setAttribute('y2', y2);
  l.setAttribute('stroke', color || '#4F46E5');
  l.setAttribute('stroke-width', width || 4);
  l.setAttribute('stroke-linecap', 'round');
  if (cls) l.setAttribute('class', cls);
  return l;
}

function rect(x, y, w, h, color, rx) {
  const r = document.createElementNS(svgNS, 'rect');
  r.setAttribute('x', x); r.setAttribute('y', y);
  r.setAttribute('width', w); r.setAttribute('height', h);
  r.setAttribute('fill', color || '#E0E7FF');
  if (rx) r.setAttribute('rx', rx);
  return r;
}

function text(x, y, txt, size, color) {
  const t = document.createElementNS(svgNS, 'text');
  t.setAttribute('x', x); t.setAttribute('y', y);
  t.setAttribute('text-anchor', 'middle');
  t.setAttribute('font-size', size || 11);
  t.setAttribute('font-family', 'DM Sans, sans-serif');
  t.setAttribute('font-weight', '600');
  t.setAttribute('fill', color || '#6B7280');
  t.textContent = txt;
  return t;
}

function group(cls, transformOrigin) {
  const g = document.createElementNS(svgNS, 'g');
  if (cls) g.setAttribute('class', cls);
  if (transformOrigin) g.style.transformOrigin = transformOrigin;
  return g;
}

// ── Floor/Mat helper ──────────────────────────────────────────

function addFloor(svg, y) {
  svg.appendChild(rect(10, y, 180, 4, '#E0E7FF', 2));
}

// ── Step Indicators ──────────────────────────────────────────

function addSteps(svg, steps, y) {
  const stepG = group('physio-steps');
  steps.forEach((s, i) => {
    const t = text(30 + i * 50, y || 195, `${i + 1}`, 10, '#9CA3AF');
    t.classList.add('physio-step');
    t.setAttribute('data-step', i);
    stepG.appendChild(t);
  });
  svg.appendChild(stepG);
}

// ══════════════════════════════════════════════════════════════
// Exercise Animation Factories
// Each returns an SVG element with CSS-animated stick figure
// ══════════════════════════════════════════════════════════════

const animations = {

  // ── PHASE I ──────────────────────────────────────────────

  'prone-lying': () => {
    const s = createSVG(200, 160);
    addFloor(s, 120);
    // Lying face down - static relaxation pose
    s.appendChild(circle(55, 105, 10, 'ph-head', '#4F46E5')); // head
    s.appendChild(line(65, 108, 130, 108, 'ph-torso', '#4F46E5', 5)); // torso horizontal
    s.appendChild(line(130, 108, 170, 112, 'ph-leg-r', '#6366F1', 4)); // legs
    s.appendChild(line(130, 108, 170, 104, 'ph-leg-l', '#6366F1', 4));
    s.appendChild(line(65, 108, 45, 118, 'ph-arm-r', '#6366F1', 3)); // arms relaxed
    s.appendChild(line(65, 108, 45, 98, 'ph-arm-l', '#6366F1', 3));
    // Breathing animation - gentle chest rise
    const chest = circle(90, 108, 5, 'prone-breathe', '#818CF8');
    chest.style.opacity = '0.4';
    s.appendChild(chest);
    addSteps(s, ['Deitar', 'Relaxar', 'Respirar'], 155);
    return s;
  },

  'prone-on-elbows': () => {
    const s = createSVG(200, 160);
    addFloor(s, 130);
    // Body prone with upper body propped on elbows
    const torsoG = group('poe-torso-g', '130px 125px');
    torsoG.appendChild(line(130, 125, 80, 90, 'ph-torso', '#4F46E5', 5)); // angled torso
    torsoG.appendChild(circle(75, 82, 10, 'ph-head', '#4F46E5'));
    s.appendChild(torsoG);
    s.appendChild(line(130, 125, 175, 128, 'ph-leg-r', '#6366F1', 4));
    s.appendChild(line(130, 125, 175, 122, 'ph-leg-l', '#6366F1', 4));
    // Elbows on ground
    s.appendChild(line(95, 100, 85, 128, 'ph-arm-r', '#6366F1', 3));
    s.appendChild(line(100, 97, 90, 128, 'ph-arm-l', '#6366F1', 3));
    s.appendChild(circle(85, 128, 3, '', '#818CF8')); // elbow contact
    s.appendChild(circle(90, 128, 3, '', '#818CF8'));
    addSteps(s, ['Apoiar', 'Subir', 'Manter'], 155);
    return s;
  },

  'mckenzie-press-up': () => {
    const s = createSVG(200, 160);
    addFloor(s, 135);
    // Animated press-up: torso rises and lowers
    const bodyG = group('mpu-body', '140px 130px');
    bodyG.appendChild(line(140, 130, 80, 130, 'ph-torso mpu-torso', '#4F46E5', 5));
    bodyG.appendChild(circle(73, 125, 10, 'ph-head mpu-head', '#4F46E5'));
    bodyG.appendChild(line(95, 130, 85, 130, 'ph-arm-r mpu-arm', '#6366F1', 3));
    s.appendChild(bodyG);
    // Static legs
    s.appendChild(line(140, 130, 180, 132, 'ph-leg-r', '#6366F1', 4));
    s.appendChild(line(140, 130, 180, 128, 'ph-leg-l', '#6366F1', 4));
    // Arms pushing
    s.appendChild(line(90, 130, 82, 133, 'mpu-hand-r', '#6366F1', 3));
    // Direction arrow
    const arrow = document.createElementNS(svgNS, 'path');
    arrow.setAttribute('d', 'M 50 115 L 50 85 L 43 92 M 50 85 L 57 92');
    arrow.setAttribute('stroke', '#10B981');
    arrow.setAttribute('stroke-width', '2');
    arrow.setAttribute('fill', 'none');
    arrow.classList.add('mpu-arrow');
    s.appendChild(arrow);
    addSteps(s, ['Maos', 'Subir', 'Manter', 'Descer'], 155);
    return s;
  },

  'standing-extension': () => {
    const s = createSVG(200, 180);
    addFloor(s, 170);
    // Standing figure that leans back
    const upperG = group('se-upper', '100px 120px');
    upperG.appendChild(line(100, 120, 100, 65, 'ph-torso', '#4F46E5', 5)); // torso
    upperG.appendChild(circle(100, 55, 10, 'ph-head', '#4F46E5')); // head
    // Arms on lower back
    upperG.appendChild(line(100, 90, 90, 110, 'ph-arm-r', '#6366F1', 3));
    upperG.appendChild(line(100, 90, 110, 110, 'ph-arm-l', '#6366F1', 3));
    s.appendChild(upperG);
    // Legs static
    s.appendChild(line(100, 120, 85, 168, 'ph-leg-l', '#6366F1', 4));
    s.appendChild(line(100, 120, 115, 168, 'ph-leg-r', '#6366F1', 4));
    // Feet
    s.appendChild(line(80, 168, 92, 168, '', '#4F46E5', 3));
    s.appendChild(line(108, 168, 120, 168, '', '#4F46E5', 3));
    addSteps(s, ['Pe', 'Maos', 'Inclinar', 'Voltar'], 178);
    return s;
  },

  'abdominal-hollowing': () => {
    const s = createSVG(200, 160);
    addFloor(s, 135);
    // Supine with knees bent - belly animation
    s.appendChild(line(40, 125, 130, 125, 'ph-torso', '#4F46E5', 5)); // torso
    s.appendChild(circle(35, 120, 10, 'ph-head', '#4F46E5')); // head
    // Bent knees
    s.appendChild(line(130, 125, 155, 100, 'ph-thigh-r', '#6366F1', 4));
    s.appendChild(line(155, 100, 155, 132, 'ph-shin-r', '#6366F1', 4));
    s.appendChild(line(130, 125, 165, 100, 'ph-thigh-l', '#6366F1', 4));
    s.appendChild(line(165, 100, 165, 132, 'ph-shin-l', '#6366F1', 4));
    // Belly indicator (hollowing animation)
    const belly = document.createElementNS(svgNS, 'ellipse');
    belly.setAttribute('cx', '90');
    belly.setAttribute('cy', '118');
    belly.setAttribute('rx', '15');
    belly.setAttribute('ry', '8');
    belly.setAttribute('fill', 'none');
    belly.setAttribute('stroke', '#10B981');
    belly.setAttribute('stroke-width', '2');
    belly.setAttribute('stroke-dasharray', '4 2');
    belly.classList.add('ah-belly');
    s.appendChild(belly);
    // Arrow pointing inward
    s.appendChild(text(90, 108, 'TrA', 9, '#10B981'));
    addSteps(s, ['Deitar', 'Inspirar', 'Umbigo dentro', 'Manter'], 155);
    return s;
  },

  'sciatic-slider': () => {
    const s = createSVG(200, 160);
    addFloor(s, 135);
    // Supine with one leg raising
    s.appendChild(line(40, 125, 120, 125, 'ph-torso', '#4F46E5', 5));
    s.appendChild(circle(35, 118, 10, 'ph-head', '#4F46E5'));
    // Static leg bent
    s.appendChild(line(120, 125, 140, 105, '', '#6366F1', 4));
    s.appendChild(line(140, 105, 140, 132, '', '#6366F1', 4));
    // Moving leg
    const legG = group('ss-leg', '120px 125px');
    legG.appendChild(line(120, 125, 120, 80, 'ph-thigh ss-thigh', '#4F46E5', 4));
    legG.appendChild(line(120, 80, 130, 55, 'ph-shin ss-shin', '#6366F1', 4));
    // Foot with dorsiflexion indicator
    legG.appendChild(line(130, 55, 138, 48, 'ss-foot', '#10B981', 3));
    s.appendChild(legG);
    // Nerve path indicator
    const nerve = document.createElementNS(svgNS, 'path');
    nerve.setAttribute('d', 'M 120 125 Q 118 100 125 65');
    nerve.setAttribute('stroke', '#F59E0B');
    nerve.setAttribute('stroke-width', '1.5');
    nerve.setAttribute('fill', 'none');
    nerve.setAttribute('stroke-dasharray', '3 3');
    nerve.classList.add('ss-nerve');
    s.appendChild(nerve);
    addSteps(s, ['Perna peito', 'Estender', 'Dorsiflex', 'Voltar'], 155);
    return s;
  },

  // ── PHASE II ─────────────────────────────────────────────

  'mcgill-curl-up': () => {
    const s = createSVG(200, 160);
    addFloor(s, 135);
    // Supine - curl up with hands under lumbar
    const upperG = group('mcu-upper', '85px 125px');
    upperG.appendChild(line(85, 125, 45, 125, 'ph-torso', '#4F46E5', 5));
    upperG.appendChild(circle(40, 118, 10, 'ph-head mcu-head', '#4F46E5'));
    s.appendChild(upperG);
    // Legs
    s.appendChild(line(120, 125, 145, 100, '', '#6366F1', 4)); // bent
    s.appendChild(line(145, 100, 145, 132, '', '#6366F1', 4));
    s.appendChild(line(120, 125, 160, 132, '', '#6366F1', 4)); // straight
    // Hands under lumbar indicator
    s.appendChild(circle(78, 130, 3, '', '#10B981'));
    s.appendChild(text(78, 145, 'Maos aqui', 8, '#10B981'));
    addSteps(s, ['Maos lombar', 'Ativar core', 'Subir 5cm', 'Manter'], 155);
    return s;
  },

  'side-plank': () => {
    const s = createSVG(200, 160);
    addFloor(s, 135);
    // Side plank on elbow
    const bodyG = group('sp-body', '60px 130px');
    bodyG.appendChild(line(60, 130, 155, 130, 'ph-torso', '#4F46E5', 5)); // torso (will rotate up)
    bodyG.appendChild(circle(160, 125, 9, 'ph-head', '#4F46E5'));
    // Top arm up
    bodyG.appendChild(line(120, 130, 120, 105, 'ph-arm-t', '#6366F1', 3));
    s.appendChild(bodyG);
    // Elbow on ground
    s.appendChild(line(60, 130, 55, 133, '', '#4F46E5', 3));
    s.appendChild(circle(55, 133, 3, '', '#818CF8'));
    // Legs
    s.appendChild(line(60, 130, 35, 133, 'ph-leg', '#6366F1', 4));
    addSteps(s, ['De lado', 'Cotovelo', 'Levantar anca', 'Manter'], 155);
    return s;
  },

  'bird-dog': () => {
    const s = createSVG(200, 160);
    addFloor(s, 140);
    // Quadruped position
    s.appendChild(line(70, 105, 130, 105, 'ph-torso', '#4F46E5', 5)); // torso horizontal
    s.appendChild(circle(65, 98, 9, 'ph-head', '#4F46E5')); // head
    // Support limbs (static)
    s.appendChild(line(80, 105, 80, 138, '', '#6366F1', 4)); // left arm
    s.appendChild(line(120, 105, 120, 138, '', '#6366F1', 4)); // right leg
    // Extending limbs (animated)
    const armG = group('bd-arm', '70px 105px');
    armG.appendChild(line(70, 105, 30, 95, 'bd-ext-arm', '#10B981', 4));
    s.appendChild(armG);
    const legG = group('bd-leg', '130px 105px');
    legG.appendChild(line(130, 105, 175, 95, 'bd-ext-leg', '#10B981', 4));
    s.appendChild(legG);
    // Arrow indicators
    s.appendChild(text(25, 88, 'Braco', 8, '#10B981'));
    s.appendChild(text(178, 88, 'Perna', 8, '#10B981'));
    addSteps(s, ['4 apoios', 'Estender', 'Manter 8s', 'Trocar'], 155);
    return s;
  },

  'dead-bug': () => {
    const s = createSVG(200, 160);
    addFloor(s, 135);
    // Supine, arms up, legs at 90
    s.appendChild(line(50, 125, 140, 125, 'ph-torso', '#4F46E5', 5));
    s.appendChild(circle(45, 118, 9, 'ph-head', '#4F46E5'));
    // Arms up (90 deg)
    const armG = group('db-arm', '75px 125px');
    armG.appendChild(line(75, 125, 65, 85, 'db-arm-r', '#6366F1', 3));
    s.appendChild(armG);
    s.appendChild(line(90, 125, 95, 85, '', '#6366F1', 3)); // static arm
    // Legs at 90
    s.appendChild(line(120, 125, 120, 95, '', '#6366F1', 4)); // static thigh
    s.appendChild(line(120, 95, 140, 95, '', '#6366F1', 4)); // static shin
    const legG = group('db-leg', '135px 125px');
    legG.appendChild(line(135, 125, 155, 132, 'db-leg-r', '#10B981', 4));
    s.appendChild(legG);
    s.appendChild(text(100, 115, 'Lombar no chao!', 8, '#EF4444'));
    addSteps(s, ['Bracos teto', '90 graus', 'Estender opostos', 'Voltar'], 155);
    return s;
  },

  'glute-bridge': () => {
    const s = createSVG(200, 160);
    addFloor(s, 140);
    // Supine bridge
    s.appendChild(circle(35, 130, 9, 'ph-head', '#4F46E5'));
    const hipG = group('gb-hip', '110px 135px');
    hipG.appendChild(line(45, 135, 110, 120, 'ph-torso gb-torso', '#4F46E5', 5));
    s.appendChild(hipG);
    // Legs bent
    s.appendChild(line(110, 135, 140, 110, '', '#6366F1', 4));
    s.appendChild(line(140, 110, 140, 138, '', '#6366F1', 4));
    s.appendChild(line(110, 135, 150, 110, '', '#6366F1', 4));
    s.appendChild(line(150, 110, 150, 138, '', '#6366F1', 4));
    // Glute activation indicator
    s.appendChild(text(100, 112, 'Gluteos!', 9, '#10B981'));
    addSteps(s, ['Deitar', 'Pes chao', 'Subir anca', 'Apertar'], 155);
    return s;
  },

  'front-plank': () => {
    const s = createSVG(200, 160);
    addFloor(s, 130);
    // Plank position
    s.appendChild(line(35, 125, 170, 125, 'ph-torso fp-body', '#4F46E5', 5));
    s.appendChild(circle(30, 118, 9, 'ph-head', '#4F46E5'));
    // Elbows
    s.appendChild(line(50, 125, 45, 128, '', '#6366F1', 3));
    s.appendChild(circle(45, 128, 3, '', '#818CF8'));
    // Toes
    s.appendChild(line(170, 125, 175, 128, '', '#6366F1', 3));
    // Alignment line
    const alignLine = document.createElementNS(svgNS, 'line');
    alignLine.setAttribute('x1', '30'); alignLine.setAttribute('y1', '115');
    alignLine.setAttribute('x2', '175'); alignLine.setAttribute('y2', '115');
    alignLine.setAttribute('stroke', '#10B981');
    alignLine.setAttribute('stroke-width', '1');
    alignLine.setAttribute('stroke-dasharray', '4 4');
    alignLine.setAttribute('opacity', '0.6');
    s.appendChild(alignLine);
    s.appendChild(text(100, 110, 'Linha reta!', 9, '#10B981'));
    addSteps(s, ['Cotovelos', 'Pes', 'Core ativo', 'Manter'], 155);
    return s;
  },

  'hamstring-stretch': () => {
    const s = createSVG(200, 160);
    addFloor(s, 140);
    // Supine hamstring stretch with towel
    s.appendChild(line(30, 130, 120, 130, 'ph-torso', '#4F46E5', 5));
    s.appendChild(circle(25, 123, 9, 'ph-head', '#4F46E5'));
    // Bent leg
    s.appendChild(line(120, 130, 140, 110, '', '#6366F1', 4));
    s.appendChild(line(140, 110, 140, 138, '', '#6366F1', 4));
    // Stretched leg (animated up)
    const legG = group('hs-leg', '100px 130px');
    legG.appendChild(line(100, 130, 100, 70, 'hs-straight', '#4F46E5', 4));
    // Towel
    legG.appendChild(line(95, 68, 80, 120, 'hs-towel', '#F59E0B', 2));
    legG.appendChild(line(105, 68, 85, 115, '', '#F59E0B', 2));
    s.appendChild(legG);
    s.appendChild(text(70, 90, 'Toalha', 8, '#F59E0B'));
    addSteps(s, ['Deitar', 'Toalha pe', 'Subir perna', 'Manter 30s'], 155);
    return s;
  },

  'cat-cow': () => {
    const s = createSVG(200, 160);
    addFloor(s, 140);
    // Quadruped with animated spine
    s.appendChild(line(60, 138, 60, 105, '', '#6366F1', 4)); // arms
    s.appendChild(line(70, 138, 70, 105, '', '#6366F1', 4));
    s.appendChild(line(135, 138, 135, 105, '', '#6366F1', 4)); // legs
    s.appendChild(line(145, 138, 145, 105, '', '#6366F1', 4));
    // Animated spine
    const spineG = group('cc-spine', '100px 105px');
    const spine = document.createElementNS(svgNS, 'path');
    spine.setAttribute('d', 'M 60 105 Q 100 105 140 105');
    spine.setAttribute('stroke', '#4F46E5');
    spine.setAttribute('stroke-width', '5');
    spine.setAttribute('fill', 'none');
    spine.classList.add('cc-path');
    spineG.appendChild(spine);
    spineG.appendChild(circle(55, 98, 9, 'ph-head cc-head', '#4F46E5'));
    s.appendChild(spineG);
    s.appendChild(text(100, 80, 'GATO', 10, '#6366F1'));
    s.appendChild(text(100, 155, 'VACA', 10, '#10B981'));
    addSteps(s, ['4 apoios', 'Gato (cima)', 'Vaca (baixo)', 'Repetir'], 155);
    return s;
  },

  // ── PHASE III ────────────────────────────────────────────

  'sciatic-tensioner': () => {
    const s = createSVG(200, 160);
    addFloor(s, 140);
    // Similar to slider but with more tension indication
    s.appendChild(line(30, 128, 110, 128, 'ph-torso', '#4F46E5', 5));
    s.appendChild(circle(25, 120, 9, 'ph-head', '#4F46E5'));
    // Hands behind knee
    s.appendChild(line(80, 128, 110, 100, '', '#6366F1', 3));
    // Moving leg with tension
    const legG = group('st-leg', '110px 128px');
    legG.appendChild(line(110, 128, 115, 75, 'st-thigh', '#4F46E5', 4));
    legG.appendChild(line(115, 75, 130, 50, 'st-shin', '#EF4444', 4));
    legG.appendChild(line(130, 50, 140, 43, 'st-foot', '#EF4444', 3));
    s.appendChild(legG);
    // Tension indicator
    s.appendChild(text(150, 55, 'Tensao!', 9, '#EF4444'));
    // Static leg
    s.appendChild(line(110, 128, 140, 115, '', '#6366F1', 4));
    s.appendChild(line(140, 115, 140, 138, '', '#6366F1', 4));
    addSteps(s, ['Perna peito', 'Estender+Flex', 'Manter 5s', 'Voltar'], 155);
    return s;
  },

  'seated-slump-slider': () => {
    const s = createSVG(200, 170);
    // Chair
    s.appendChild(rect(80, 70, 60, 90, '#E0E7FF', 4));
    s.appendChild(rect(130, 70, 8, 90, '#D1D5DB', 2));
    // Seated figure with slump
    const upperG = group('sss-upper', '100px 110px');
    upperG.appendChild(line(100, 110, 100, 70, 'ph-torso', '#4F46E5', 5));
    upperG.appendChild(circle(100, 58, 9, 'ph-head', '#4F46E5'));
    s.appendChild(upperG);
    // Legs with extending knee
    s.appendChild(line(100, 110, 100, 140, '', '#6366F1', 4));
    const shinG = group('sss-shin', '100px 140px');
    shinG.appendChild(line(100, 140, 120, 155, 'sss-ext', '#10B981', 4));
    s.appendChild(shinG);
    s.appendChild(text(100, 168, 'Cadeira', 9, '#9CA3AF'));
    addSteps(s, ['Sentar', 'Curvar', 'Estender joelho', 'Olhar cima'], 167);
    return s;
  },

  'piriformis-stretch': () => {
    const s = createSVG(200, 160);
    addFloor(s, 140);
    // Supine figure-4
    s.appendChild(line(30, 128, 110, 128, 'ph-torso', '#4F46E5', 5));
    s.appendChild(circle(25, 120, 9, 'ph-head', '#4F46E5'));
    // Bottom leg - bent and pulled to chest
    s.appendChild(line(110, 128, 130, 105, '', '#6366F1', 4));
    s.appendChild(line(130, 105, 120, 128, '', '#6366F1', 4));
    // Top leg - figure 4 (ankle on knee)
    s.appendChild(line(110, 128, 145, 105, '', '#4F46E5', 4));
    s.appendChild(line(145, 105, 130, 100, '', '#4F46E5', 3)); // ankle crossing
    // Hands pulling
    s.appendChild(line(70, 128, 125, 108, '', '#10B981', 2));
    s.appendChild(text(150, 95, 'Figura 4', 9, '#10B981'));
    addSteps(s, ['Deitar', 'Cruzar perna', 'Puxar', 'Manter 30s'], 155);
    return s;
  },

  'hip-flexor-stretch': () => {
    const s = createSVG(200, 180);
    addFloor(s, 170);
    // Half-kneeling lunge
    // Back leg (kneeling)
    s.appendChild(line(120, 120, 145, 165, '', '#6366F1', 4));
    s.appendChild(line(145, 165, 160, 165, '', '#6366F1', 3));
    // Front leg
    s.appendChild(line(120, 120, 90, 145, '', '#6366F1', 4));
    s.appendChild(line(90, 145, 80, 168, '', '#6366F1', 4));
    // Torso upright
    const upperG = group('hfs-upper', '120px 120px');
    upperG.appendChild(line(120, 120, 120, 65, 'ph-torso', '#4F46E5', 5));
    upperG.appendChild(circle(120, 55, 9, 'ph-head', '#4F46E5'));
    upperG.appendChild(line(120, 80, 110, 95, '', '#6366F1', 3));
    upperG.appendChild(line(120, 80, 130, 95, '', '#6366F1', 3));
    s.appendChild(upperG);
    // Stretch indicator
    const stretchZone = document.createElementNS(svgNS, 'ellipse');
    stretchZone.setAttribute('cx', '130'); stretchZone.setAttribute('cy', '125');
    stretchZone.setAttribute('rx', '12'); stretchZone.setAttribute('ry', '8');
    stretchZone.setAttribute('fill', 'none');
    stretchZone.setAttribute('stroke', '#EF4444');
    stretchZone.setAttribute('stroke-width', '1.5');
    stretchZone.setAttribute('stroke-dasharray', '3 2');
    s.appendChild(stretchZone);
    s.appendChild(text(155, 122, 'Iliopsoas', 8, '#EF4444'));
    addSteps(s, ['Cavaleiro', 'Gluteo ativo', 'Anca frente', 'Manter 30s'], 178);
    return s;
  },

  'standing-extension-overpressure': () => {
    const s = createSVG(200, 180);
    addFloor(s, 170);
    // Same as standing extension but with more lean and hand pressure arrows
    const upperG = group('seo-upper', '100px 120px');
    upperG.appendChild(line(100, 120, 100, 65, 'ph-torso', '#4F46E5', 5));
    upperG.appendChild(circle(100, 55, 10, 'ph-head', '#4F46E5'));
    upperG.appendChild(line(100, 90, 90, 115, 'ph-arm-r', '#6366F1', 3));
    upperG.appendChild(line(100, 90, 110, 115, 'ph-arm-l', '#6366F1', 3));
    s.appendChild(upperG);
    s.appendChild(line(100, 120, 85, 168, '', '#6366F1', 4));
    s.appendChild(line(100, 120, 115, 168, '', '#6366F1', 4));
    // Pressure arrows
    s.appendChild(text(80, 105, 'Pressao', 8, '#EF4444'));
    const pressArrow = document.createElementNS(svgNS, 'path');
    pressArrow.setAttribute('d', 'M 88 108 L 95 115');
    pressArrow.setAttribute('stroke', '#EF4444');
    pressArrow.setAttribute('stroke-width', '2');
    pressArrow.setAttribute('marker-end', '');
    s.appendChild(pressArrow);
    addSteps(s, ['Pe', 'Maos lombar', 'Inclinar+Pressao', 'Voltar'], 178);
    return s;
  },

  'child-pose': () => {
    const s = createSVG(200, 140);
    addFloor(s, 125);
    // Child's pose - folded position
    s.appendChild(circle(50, 108, 9, 'ph-head', '#4F46E5'));
    s.appendChild(line(60, 110, 110, 105, 'ph-torso cp-torso', '#4F46E5', 5));
    // Folded legs
    s.appendChild(line(110, 105, 130, 115, '', '#6366F1', 4));
    s.appendChild(line(130, 115, 130, 123, '', '#6366F1', 4));
    // Extended arms
    s.appendChild(line(60, 110, 30, 120, '', '#6366F1', 3));
    s.appendChild(line(60, 110, 28, 115, '', '#6366F1', 3));
    // Breathing indicator
    const breathCircle = circle(85, 100, 6, 'cp-breathe', '#818CF8');
    breathCircle.style.opacity = '0.3';
    s.appendChild(breathCircle);
    addSteps(s, ['Ajoelhar', 'Bracos frente', 'Testa chao', 'Respirar'], 138);
    return s;
  },

  // ── PHASE IV ─────────────────────────────────────────────

  'advanced-mcgill-big3': () => {
    const s = createSVG(200, 160);
    // Three mini figures showing each exercise
    // Curl-up mini
    s.appendChild(text(35, 15, 'Curl-Up', 8, '#4F46E5'));
    s.appendChild(line(15, 40, 55, 40, '', '#4F46E5', 3));
    s.appendChild(circle(12, 35, 6, '', '#4F46E5'));
    // Side plank mini
    s.appendChild(text(100, 15, 'Side Plank', 8, '#4F46E5'));
    s.appendChild(line(75, 40, 125, 30, '', '#4F46E5', 3));
    s.appendChild(circle(128, 27, 6, '', '#4F46E5'));
    // Bird-dog mini
    s.appendChild(text(168, 15, 'Bird-Dog', 8, '#4F46E5'));
    s.appendChild(line(150, 40, 190, 40, '', '#4F46E5', 3));
    s.appendChild(circle(147, 35, 6, '', '#4F46E5'));
    s.appendChild(line(150, 40, 140, 35, '', '#10B981', 2));
    s.appendChild(line(190, 40, 195, 35, '', '#10B981', 2));
    // Pyramid indicator
    s.appendChild(text(100, 70, 'Piramide: 8-6-4-2', 12, '#4F46E5'));
    s.appendChild(rect(50, 80, 100, 60, '#EEF2FF', 8));
    s.appendChild(text(100, 100, '8 → 6 → 4 → 2', 14, '#4F46E5'));
    s.appendChild(text(100, 118, 'repeticoes', 10, '#6B7280'));
    addSteps(s, ['Curl-Up', 'Side Plank', 'Bird-Dog', '20s rest'], 155);
    return s;
  },

  'dynamic-bird-dog': () => {
    const s = createSVG(200, 160);
    addFloor(s, 140);
    // Quadruped with resistance band
    s.appendChild(line(70, 105, 130, 105, 'ph-torso', '#4F46E5', 5));
    s.appendChild(circle(65, 98, 9, 'ph-head', '#4F46E5'));
    s.appendChild(line(80, 105, 80, 138, '', '#6366F1', 4));
    s.appendChild(line(120, 105, 120, 138, '', '#6366F1', 4));
    // Extending limbs with band
    const armG = group('dbd-arm', '70px 105px');
    armG.appendChild(line(70, 105, 30, 90, '', '#10B981', 4));
    s.appendChild(armG);
    const legG = group('dbd-leg', '130px 105px');
    legG.appendChild(line(130, 105, 175, 90, '', '#10B981', 4));
    // Band
    legG.appendChild(line(175, 90, 180, 92, '', '#EF4444', 2));
    legG.appendChild(line(180, 92, 180, 138, '', '#EF4444', 2));
    s.appendChild(legG);
    s.appendChild(text(180, 120, 'Banda', 8, '#EF4444'));
    // Touch under
    s.appendChild(text(100, 125, 'Toca cotovelo-joelho', 8, '#6B7280'));
    addSteps(s, ['4 apoios', 'Estender+Banda', 'Cotov-joelho', 'Repetir'], 155);
    return s;
  },

  'turkish-getup-partial': () => {
    const s = createSVG(200, 180);
    addFloor(s, 170);
    // Three position sequence (mini frames)
    // Position 1: lying
    s.appendChild(text(45, 50, '1', 14, '#4F46E5'));
    s.appendChild(line(20, 70, 70, 70, '', '#4F46E5', 3));
    s.appendChild(circle(17, 65, 6, '', '#4F46E5'));
    s.appendChild(line(35, 65, 35, 45, '', '#10B981', 2)); // arm up
    // Position 2: on elbow
    s.appendChild(text(110, 50, '2', 14, '#F59E0B'));
    s.appendChild(line(90, 70, 130, 60, '', '#F59E0B', 3));
    s.appendChild(circle(87, 62, 6, '', '#F59E0B'));
    s.appendChild(line(100, 57, 100, 40, '', '#10B981', 2));
    // Position 3: seated
    s.appendChild(text(170, 50, '3', 14, '#10B981'));
    s.appendChild(line(155, 70, 165, 50, '', '#10B981', 3));
    s.appendChild(circle(165, 42, 6, '', '#10B981'));
    s.appendChild(line(165, 48, 165, 28, '', '#10B981', 2));
    // Label
    s.appendChild(text(100, 100, 'Deitado → Cotovelo → Sentado', 10, '#4F46E5'));
    s.appendChild(text(100, 115, 'Braco sempre para o teto', 9, '#10B981'));
    addSteps(s, ['Deitado', 'Cotovelo', 'Mao', 'Voltar'], 175);
    return s;
  },

  'maintenance-routine': () => {
    const s = createSVG(200, 160);
    // Overview layout
    s.appendChild(rect(10, 10, 180, 140, '#EEF2FF', 12));
    s.appendChild(text(100, 30, 'Rotina Diaria 15 min', 12, '#4F46E5'));
    // Timeline
    const items = [
      { t: '0-5 min', label: 'McKenzie 3x10', color: '#EF4444' },
      { t: '5-10 min', label: 'McGill Big 3 (6-4-2)', color: '#F59E0B' },
      { t: '10-13 min', label: 'Alongamentos', color: '#10B981' },
      { t: '13-15 min', label: 'Cat-Cow + Child', color: '#6366F1' }
    ];
    items.forEach((item, i) => {
      const y = 50 + i * 25;
      s.appendChild(circle(30, y, 5, '', item.color));
      if (i < items.length - 1) s.appendChild(line(30, y + 5, 30, y + 20, '', '#D1D5DB', 1));
      s.appendChild(text(40, y + 4, item.t, 9, '#6B7280'));
      s.appendChild(text(130, y + 4, item.label, 9, item.color));
    });
    return s;
  }
};

// ── Public API ────────────────────────────────────────────────

export function createExerciseAnimation(exerciseId, container) {
  if (!container) return;
  container.textContent = '';
  const factory = animations[exerciseId];
  if (factory) {
    const svg = factory();
    container.appendChild(svg);
  } else {
    container.textContent = 'Animacao nao disponivel';
  }
}

export function createBodyMap(container, painLog, onZoneClick) {
  if (!container) return;
  container.textContent = '';
  const s = createSVG(120, 200);
  s.classList.add('body-map');

  // Simplified posterior body outline
  // Head
  s.appendChild(circle(60, 20, 12, 'bm-head', '#D1D5DB'));
  // Neck
  s.appendChild(line(60, 32, 60, 40, '', '#D1D5DB', 3));
  // Shoulders
  s.appendChild(line(35, 45, 85, 45, '', '#D1D5DB', 3));
  // Torso
  s.appendChild(rect(38, 45, 44, 55, '#F3F4F6', 4));

  // Pain zones (clickable)
  const zones = [
    { id: 'lombar-central', cx: 60, cy: 85, rx: 15, ry: 8, label: 'Lombar' },
    { id: 'lombar-esq', cx: 42, cy: 85, rx: 8, ry: 8, label: '' },
    { id: 'lombar-dir', cx: 78, cy: 85, rx: 8, ry: 8, label: '' },
    { id: 'gluteo-esq', cx: 45, cy: 105, rx: 10, ry: 7, label: '' },
    { id: 'gluteo-dir', cx: 75, cy: 105, rx: 10, ry: 7, label: '' },
    { id: 'coxa-post-esq', cx: 45, cy: 135, rx: 7, ry: 15, label: '' },
    { id: 'coxa-post-dir', cx: 75, cy: 135, rx: 7, ry: 15, label: '' },
    { id: 'perna-esq', cx: 45, cy: 170, rx: 5, ry: 12, label: '' },
    { id: 'perna-dir', cx: 75, cy: 170, rx: 5, ry: 12, label: '' }
  ];

  zones.forEach(z => {
    const el = document.createElementNS(svgNS, 'ellipse');
    el.setAttribute('cx', z.cx); el.setAttribute('cy', z.cy);
    el.setAttribute('rx', z.rx); el.setAttribute('ry', z.ry);

    // Find pain level for this zone
    const entry = painLog?.slice(-1)[0];
    const painLevel = entry && entry.location === z.id ? entry.level : 0;
    const opacity = Math.min(0.8, painLevel / 10);
    el.setAttribute('fill', painLevel > 0 ? `rgba(239, 68, 68, ${opacity})` : '#F3F4F6');
    el.setAttribute('stroke', '#D1D5DB');
    el.setAttribute('stroke-width', '1');
    el.setAttribute('class', 'bm-zone');
    el.setAttribute('data-zone', z.id);
    el.style.cursor = 'pointer';
    if (onZoneClick) {
      el.addEventListener('click', () => onZoneClick(z.id));
    }
    s.appendChild(el);
  });

  // Legs outline
  s.appendChild(line(45, 100, 45, 190, '', '#D1D5DB', 2));
  s.appendChild(line(75, 100, 75, 190, '', '#D1D5DB', 2));
  // Arms
  s.appendChild(line(35, 45, 25, 100, '', '#D1D5DB', 2));
  s.appendChild(line(85, 45, 95, 100, '', '#D1D5DB', 2));

  container.appendChild(s);
}

export function pauseAnimation(container) {
  const svg = container?.querySelector('.physio-anim');
  if (svg) svg.classList.add('paused');
}

export function resumeAnimation(container) {
  const svg = container?.querySelector('.physio-anim');
  if (svg) svg.classList.remove('paused');
}
