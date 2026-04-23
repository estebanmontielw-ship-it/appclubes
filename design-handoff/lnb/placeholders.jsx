/* global React */
const { useMemo } = React;

/* ============================================================
   LNB BACKGROUNDS — Azul marino + rojo/naranja acentos
   Inspirados en los flyers oficiales (navy + scratchy texture)
   ============================================================ */

const LNB_BG_BASE = 'radial-gradient(ellipse 140% 85% at 50% 15%, #1E3FA8 0%, #0E1D4F 38%, #081233 70%, #03081A 100%)';

/* Scratchy texture — líneas finas como los flyers oficiales */
function ScratchTexture({ opacity = 0.08 }) {
  const lines = useMemo(() => {
    const arr = [];
    let seed = 13;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 80; i++) {
      const x1 = rnd() * 1080;
      const y1 = rnd() * 1350;
      const angle = rnd() * Math.PI * 2;
      const len = 60 + rnd() * 220;
      const x2 = x1 + Math.cos(angle) * len;
      const y2 = y1 + Math.sin(angle) * len;
      arr.push({ x1, y1, x2, y2, o: 0.3 + rnd() * 0.7 });
    }
    return arr;
  }, []);
  return (
    <svg viewBox="0 0 1080 1350" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#A6BEFF" strokeWidth="0.8" opacity={opacity * l.o} />
      ))}
    </svg>
  );
}

function CourtLinesLNB({ opacity = 0.08 }) {
  return (
    <svg viewBox="0 0 1080 1350" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="court-fade-lnb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A6BEFF" stopOpacity={opacity * 1.4} />
          <stop offset="100%" stopColor="#A6BEFF" stopOpacity={opacity * 0.3} />
        </linearGradient>
      </defs>
      <path d="M -100 1350 Q 540 600 1180 1350" stroke="url(#court-fade-lnb)" strokeWidth="3" fill="none" />
      <path d="M -100 1500 Q 540 750 1180 1500" stroke="url(#court-fade-lnb)" strokeWidth="2" fill="none" opacity="0.5" />
      <rect x="390" y="1100" width="300" height="250" stroke="url(#court-fade-lnb)" strokeWidth="3" fill="none" />
      <circle cx="540" cy="1100" r="120" stroke="url(#court-fade-lnb)" strokeWidth="3" fill="none" />
      <path d="M -100 -150 Q 540 600 1180 -150" stroke="url(#court-fade-lnb)" strokeWidth="2" fill="none" opacity="0.4" />
    </svg>
  );
}

function BasketGrainDotsLNB({ count = 220, opacity = 0.12 }) {
  const dots = useMemo(() => {
    const arr = [];
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < count; i++) {
      arr.push({ x: rnd() * 1080, y: rnd() * 1350, r: 1 + rnd() * 2.2 });
    }
    return arr;
  }, [count]);
  return (
    <svg viewBox="0 0 1080 1350" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#A6BEFF" opacity={opacity} />
      ))}
    </svg>
  );
}

function HalftoneLNB({ opacity = 0.10, color = '#FFFFFF' }) {
  const dots = [];
  const cols = 36, rows = 45;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = (c + 0.5) * (1080 / cols);
      const y = (r + 0.5) * (1350 / rows);
      const d = Math.hypot(x - 540, y - 400);
      const size = Math.max(0, 4 - d / 260);
      if (size > 0.4) dots.push({ x, y, size });
    }
  }
  return (
    <svg viewBox="0 0 1080 1350" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.size} fill={color} opacity={opacity * (d.size / 4)} />
      ))}
    </svg>
  );
}

function DiagonalSpeedLinesLNB({ opacity = 0.14 }) {
  const lines = [];
  for (let i = -20; i < 60; i++) {
    const x = i * 40;
    lines.push({ x1: x, y1: 0, x2: x - 400, y2: 1350, o: (i % 3 === 0 ? 1 : 0.4) });
  }
  return (
    <svg viewBox="0 0 1080 1350" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#5A83F2" strokeWidth="1.5" opacity={opacity * l.o} />
      ))}
    </svg>
  );
}

function RadialGlowLNB({ x = 30, y = 0, color = '#2D56D4', size = 70 }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x - size/2}%`, top: `${y - size/2}%`,
      width: `${size}%`, height: `${size}%`,
      background: `radial-gradient(circle, ${color}55 0%, ${color}00 65%)`,
      pointerEvents: 'none',
    }} />
  );
}

/* ============================================================
   LNBBackground — variants 1..8
   v1 — Clean official (navy + scratchy)  ← el matching con los flyers oficiales
   ============================================================ */
function LNBBackground({ variant = 1, children, style }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: LNB_BG_BASE,
      overflow: 'hidden',
      ...style,
    }}>
      {variant === 1 && <><ScratchTexture /><RadialGlowLNB x={50} y={15} size={90} /></>}
      {variant === 2 && <><RadialGlowLNB x={80} y={10} color="#5A83F2" size={60} /><BasketGrainDotsLNB /></>}
      {variant === 3 && <><ScratchTexture opacity={0.06} /><HalftoneLNB opacity={0.08} /><RadialGlowLNB x={50} y={20} size={80} /></>}
      {variant === 4 && <><HalftoneLNB /><RadialGlowLNB x={80} y={90} color="#E63322" size={50} /></>}
      {variant === 5 && <><DiagonalSpeedLinesLNB /><RadialGlowLNB x={50} y={0} size={90} /></>}
      {variant === 6 && <><CourtLinesLNB /><ScratchTexture opacity={0.05} /><RadialGlowLNB x={30} y={30} /></>}
      {variant === 7 && <><CourtLinesLNB opacity={0.06} /><BasketGrainDotsLNB count={120} opacity={0.08} /><RadialGlowLNB /></>}
      {variant === 8 && <><ScratchTexture opacity={0.1} /><HalftoneLNB opacity={0.06} /><RadialGlowLNB x={50} y={10} size={70} color="#E63322" /></>}
      {children}
    </div>
  );
}

function BasketballSVGLNB({ size = 200, color = '#D4AF37', stroke = '#081233' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: 'block' }}>
      <circle cx="100" cy="100" r="92" fill={color} stroke={stroke} strokeWidth="4" />
      <path d="M 100 8 Q 100 100 100 192" stroke={stroke} strokeWidth="3.5" fill="none" />
      <path d="M 8 100 Q 100 100 192 100" stroke={stroke} strokeWidth="3.5" fill="none" />
      <path d="M 25 35 Q 100 100 175 165" stroke={stroke} strokeWidth="3" fill="none" />
      <path d="M 175 35 Q 100 100 25 165" stroke={stroke} strokeWidth="3" fill="none" />
    </svg>
  );
}

window.LNBBackground = LNBBackground;
window.BasketballSVGLNB = BasketballSVGLNB;
window.LNB_BG_BASE = LNB_BG_BASE;
