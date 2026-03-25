// ══════════════════════════════════════════════════════════════
// MindShift — SVG Icon System (consistent, no emoji dependency)
// ══════════════════════════════════════════════════════════════

const svgNS = 'http://www.w3.org/2000/svg';

function svg(paths, size, color) {
  const s = document.createElementNS(svgNS, 'svg');
  s.setAttribute('width', size || 20);
  s.setAttribute('height', size || 20);
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', color || 'currentColor');
  s.setAttribute('stroke-width', '2');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  paths.forEach(d => {
    const p = document.createElementNS(svgNS, 'path');
    p.setAttribute('d', d);
    s.appendChild(p);
  });
  return s;
}

function svgFill(paths, size, color) {
  const s = document.createElementNS(svgNS, 'svg');
  s.setAttribute('width', size || 20);
  s.setAttribute('height', size || 20);
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', color || 'currentColor');
  paths.forEach(d => {
    const p = document.createElementNS(svgNS, 'path');
    p.setAttribute('d', d);
    s.appendChild(p);
  });
  return s;
}

export const icons = {
  // Navigation
  home: (s, c) => svg(['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'], s, c),
  science: (s, c) => svg(['M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2m-7-9a3 3 0 11-6 0 3 3 0 016 0zm-3 3v6'], s, c),
  environment: (s, c) => svg(['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'], s, c),
  journal: (s, c) => svg(['M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'], s, c),
  coach: (s, c) => svg(['M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'], s, c),

  // Goals
  scale: (s, c) => svg(['M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3'], s, c),
  droplet: (s, c) => svg(['M12 21c-4-4-8-7.5-8-11a8 8 0 1116 0c0 3.5-4 7-8 11z'], s, c),
  leaf: (s, c) => svg(['M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L17 8z', 'M5 19l2-2', 'M17 8c.5-2.5 1-5 1-8-3 0-5.5.5-8 1l7 7z'], s, c),
  spine: (s, c) => svg(['M12 2v4m0 4v4m0 4v4', 'M8 6h8', 'M6 10h12', 'M8 14h8', 'M6 18h12'], s, c),

  // Pillars
  brain: (s, c) => svg(['M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.2 6H8.2C6.3 13.7 5 11.5 5 9a7 7 0 017-7z', 'M9 22h6', 'M10 18h4', 'M12 2v4'], s, c),
  seedling: (s, c) => svg(['M12 22V12', 'M7 12C7 8 9 4 12 2c3 2 5 6 5 10', 'M4 15c2-1 4-1 6 0', 'M14 15c2 1 4 1 6 0'], s, c),
  heart: (s, c) => svg(['M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z'], s, c),
  target: (s, c) => svg(['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 18a6 6 0 100-12 6 6 0 000 12z', 'M12 14a2 2 0 100-4 2 2 0 000 4z'], s, c),
  stairs: (s, c) => svg(['M3 21h4v-4h4v-4h4v-4h4v-4h2', 'M3 21h18'], s, c),

  // Actions
  check: (s, c) => {
    const el = svg(['M5 13l4 4L19 7'], s || 14, c || '#fff');
    el.setAttribute('stroke-width', '2.5');
    return el;
  },
  sun: (s, c) => svg(['M12 3v1m0 16v1m8.66-14.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71', 'M12 8a4 4 0 100 8 4 4 0 000-8z'], s, c),
  moon: (s, c) => svg(['M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'], s, c),
  send: (s, c) => svg(['M22 2L11 13', 'M22 2l-7 20-4-9-9-4 20-7z'], s, c),
  refresh: (s, c) => svg(['M1 4v6h6', 'M23 20v-6h-6', 'M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15'], s, c),
  chevronDown: (s, c) => svg(['M6 9l6 6 6-6'], s, c),
  chevronUp: (s, c) => svg(['M18 15l-6-6-6 6'], s, c),
  fire: (s, c) => svg(['M12 2c.5 2 2 4 2 6a4 4 0 11-8 0c0-2 1.5-4 2-6 1 1.5 2.5 3 4 0z', 'M10 16a2 2 0 104 0c0-1-1-2-2-3-1 1-2 2-2 3z'], s, c),
  sparkle: (s, c) => svg(['M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z'], s, c),

  // Physiotherapy
  physio: (s, c) => svg(['M12 2v4m0 4v4m0 4v4', 'M8 6h8', 'M6 10h12', 'M7 14h10', 'M8 18h8', 'M4 22h16'], s, c),
  timer: (s, c) => svg(['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 6v6l4 2'], s, c),
  play: (s, c) => svg(['M5 3l14 9-14 9V3z'], s, c),
  pause: (s, c) => svg(['M6 4h4v16H6zM14 4h4v16h-4z'], s, c),
  pain: (s, c) => svg(['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M16 16s-1.5-2-4-2-4 2-4 2', 'M9 9h.01M15 9h.01'], s, c),
  phase: (s, c) => svg(['M13 2L3 14h9l-1 8 10-12h-9l1-8z'], s, c),
  muscle: (s, c) => svg(['M7 4v16', 'M7 8c3-2 7-2 10 0', 'M7 12c3 2 7 2 10 0', 'M17 4v16'], s, c),
  bodyMap: (s, c) => svg(['M12 2a3 3 0 100 6 3 3 0 000-6z', 'M12 8v8', 'M8 10l-3 6', 'M16 10l3 6', 'M9 22l3-6 3 6'], s, c),

  // Fasting
  fasting: (s, c) => svg(['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 6v6l4 2', 'M12 2v2'], s, c),
  eating: (s, c) => svg(['M18 8h1a4 4 0 010 8h-1', 'M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z', 'M6 1v3', 'M10 1v3', 'M14 1v3'], s, c),
  flame: (s, c) => svg(['M12 2c.5 2 2 4 2 6a4 4 0 11-8 0c0-2 1.5-4 2-6 1 1.5 2.5 3 4 0z', 'M10 16a2 2 0 104 0c0-1-1-2-2-3-1 1-2 2-2 3z'], s, c),
  ketone: (s, c) => svg(['M12 2l3 7h-6l3-7z', 'M12 9v13', 'M8 14h8', 'M7 18h10'], s, c),
  autophagy: (s, c) => svg(['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M12 8a4 4 0 100 8 4 4 0 000-8z', 'M12 12l2-2', 'M12 12l-2 2'], s, c),

  // Movement / Exercise
  walking: (s, c) => svg(['M13 4a2 2 0 100-4 2 2 0 000 4z', 'M7 21l3-7', 'M10 14l2-3 3 3 3-4', 'M10 14l-3 3'], s, c),
  running: (s, c) => svg(['M13 4a2 2 0 100-4 2 2 0 000 4z', 'M4 17l4-6 3 3 5-7', 'M4 17l3 4', 'M8 11l-4 6'], s, c),
  cycling: (s, c) => svg(['M12 2a2 2 0 100 4 2 2 0 000-4z', 'M5 18a4 4 0 100-8 4 4 0 000 8z', 'M19 18a4 4 0 100-8 4 4 0 000 8z', 'M5 14l7-4 3 4h4'], s, c),
  swimming: (s, c) => svg(['M2 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0 4 1 6 0', 'M2 16c2-1 4-1 6 0s4 1 6 0 4-1 6 0 4 1 6 0', 'M14 8a2 2 0 100-4 2 2 0 000 4z', 'M10 12l4-4'], s, c),

  // Progress / Profile
  chart: (s, c) => svg(['M18 20V10', 'M12 20V4', 'M6 20v-6'], s, c),
  weight: (s, c) => svg(['M12 3v1m0 16v1m8.66-14.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3', 'M12 8a4 4 0 100 8 4 4 0 000-8z'], s, c),
  profile: (s, c) => svg(['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 11a4 4 0 100-8 4 4 0 000 8z'], s, c),
  notification: (s, c) => svg(['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 01-3.46 0'], s, c),
};
