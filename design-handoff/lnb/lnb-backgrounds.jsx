/* global React, LNBBackground, TeamCrest, LNB_TEAMS, SponsorStripWhite */

/* ============================================================
   RESULTADO FINAL (1080×1350)
   ============================================================ */
function ResultadoFinal() {
  const home = LNB_TEAMS[0], away = LNB_TEAMS[1];
  const scoreHome = 84, scoreAway = 77;
  return (
    <div style={{ width: 1080, height: 1350, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', color: '#F2F5FF' }}>
      <LNBBackground variant={4} />
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 3 }}>
        <img src="assets/logo-lnb.png" style={{ height: 90 }} />
      </div>
      <div style={{ position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', zIndex: 3 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 20px', borderRadius: 999, background: '#D4AF37', color: '#081233' }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#081233' }} />
          <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.26em' }}>FINAL · FECHA 04</span>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 240, left: 48, right: 48, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16, zIndex: 3 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <TeamCrest team={home} size={170} />
          <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 24, textAlign: 'center', letterSpacing: '-0.01em' }}>{home.name}</div>
          <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 210, lineHeight: 0.86, letterSpacing: '-0.05em', color: scoreHome > scoreAway ? '#D4AF37' : '#FFFFFF' }}>{scoreHome}</div>
        </div>
        <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 130, color: '#A6BEFF', lineHeight: 0.86, paddingBottom: 60 }}>—</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <TeamCrest team={away} size={170} />
          <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 24, textAlign: 'center', letterSpacing: '-0.01em' }}>{away.name}</div>
          <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 210, lineHeight: 0.86, letterSpacing: '-0.05em', color: scoreAway > scoreHome ? '#D4AF37' : '#FFFFFF' }}>{scoreAway}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 900, left: 48, right: 48, background: 'rgba(14,29,79,0.55)', border: '1px solid rgba(166,190,255,0.2)', borderRadius: 16, padding: '16px 24px', zIndex: 3 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr repeat(5, 1fr)', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.22em', fontWeight: 900, color: '#A6BEFF' }}>CUARTOS</div>
          {['Q1','Q2','Q3','Q4','FINAL'].map(q => <div key={q} style={{ textAlign: 'center', fontSize: 12, letterSpacing: '0.2em', fontWeight: 800, color: '#A6BEFF' }}>{q}</div>)}
          <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 18 }}>{home.short}</div>
          {[22, 18, 24, 20, 84].map((n, i) => <div key={i} style={{ textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 22, color: i === 4 ? '#D4AF37' : '#FFFFFF' }}>{n}</div>)}
          <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 18 }}>{away.short}</div>
          {[19, 20, 18, 20, 77].map((n, i) => <div key={i} style={{ textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 22, color: '#FFFFFF' }}>{n}</div>)}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 1060, left: 48, right: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, zIndex: 3 }}>
        <div style={{ padding: 16, background: 'linear-gradient(135deg, #D4AF37, #C8261F)', borderRadius: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 900, opacity: 0.85 }}>MVP DEL PARTIDO</div>
          <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 26, lineHeight: 1, marginTop: 6 }}>J. GIMÉNEZ</div>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>{home.short}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 14, fontSize: 11, fontWeight: 700 }}>
            <div><span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20 }}>22</span> PTS</div>
            <div><span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20 }}>7</span> REB</div>
            <div><span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20 }}>4</span> AST</div>
          </div>
        </div>
        <div style={{ padding: 16, background: 'linear-gradient(135deg, #2D56D4, #132970)', borderRadius: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 900, opacity: 0.85 }}>DESTACADO</div>
          <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 26, lineHeight: 1, marginTop: 6 }}>M. BENÍTEZ</div>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>{away.short}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 14, fontSize: 11, fontWeight: 700 }}>
            <div><span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20 }}>19</span> PTS</div>
            <div><span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20 }}>9</span> REB</div>
            <div><span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20 }}>3</span> AST</div>
          </div>
        </div>
      </div>
      <SponsorStripWhite />
    </div>
  );
}

/* ============================================================
   JORNADA — 4 resultados
   ============================================================ */
function ResultadosJornada() {
  const results = [
    { home: LNB_TEAMS[0], away: LNB_TEAMS[1], hs: 84, as: 77 },
    { home: LNB_TEAMS[2], away: LNB_TEAMS[3], hs: 71, as: 89 },
    { home: LNB_TEAMS[4], away: LNB_TEAMS[5], hs: 92, as: 88 },
    { home: LNB_TEAMS[6], away: LNB_TEAMS[7], hs: 78, as: 82 },
  ];
  return (
    <div style={{ width: 1080, height: 1350, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', color: '#F2F5FF' }}>
      <LNBBackground variant={1} />
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 3 }}>
        <img src="assets/logo-lnb.png" style={{ height: 90 }} />
      </div>
      <div style={{ position: 'absolute', top: 180, left: 0, right: 0, textAlign: 'center', zIndex: 3 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 24, letterSpacing: '0.3em', color: '#C5D3F2', fontWeight: 500 }}>FASE REGULAR · FECHA 04</div>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 110, lineHeight: 1, color: '#FFFFFF', marginTop: 8 }}>RESULTADOS</div>
      </div>
      <div style={{ position: 'absolute', top: 400, left: 36, right: 36, display: 'flex', flexDirection: 'column', gap: 14, zIndex: 3 }}>
        {results.map((r, i) => {
          const homeWins = r.hs > r.as;
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '68px 1.3fr auto auto auto 1.3fr 68px',
              alignItems: 'center', gap: 12, padding: '16px 20px',
              background: 'rgba(14,29,79,0.55)', borderRadius: 14, border: '1px solid rgba(166,190,255,0.18)',
            }}>
              <TeamCrest team={r.home} size={68} />
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, lineHeight: 1, opacity: homeWins ? 1 : 0.6 }}>{r.home.name}</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 50, lineHeight: 1, color: homeWins ? '#D4AF37' : '#FFFFFF', minWidth: 66, textAlign: 'center' }}>{r.hs}</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: '#A6BEFF' }}>—</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 50, lineHeight: 1, color: !homeWins ? '#D4AF37' : '#FFFFFF', minWidth: 66, textAlign: 'center' }}>{r.as}</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, lineHeight: 1, textAlign: 'right', opacity: !homeWins ? 1 : 0.6 }}>{r.away.name}</div>
              <div style={{ justifySelf: 'end' }}><TeamCrest team={r.away} size={68} /></div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 110, left: 0, right: 0, textAlign: 'center', zIndex: 3 }}>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, letterSpacing: '0.34em', color: '#D4AF37' }}>#LNB2026 · WWW.CPB.COM.PY · @CPB_PY</div>
      </div>
      <SponsorStripWhite />
    </div>
  );
}

/* ============================================================
   TABLA 8 equipos — con PJ/G/P/Pts/%/PF/PC/Dif
   Sombreado por zonas: 1-2 verde, 3-6 azul neutro, 7-8 rojo suave
   ============================================================ */
function TablaPosiciones() {
  const table = [
    { pos: 1, t: LNB_TEAMS[1], pj: 3, g: 3, p: 0, pts: 6, pf: 273, pc: 198 },
    { pos: 2, t: LNB_TEAMS[0], pj: 2, g: 2, p: 0, pts: 4, pf: 184, pc: 146 },
    { pos: 3, t: LNB_TEAMS[5], pj: 3, g: 1, p: 2, pts: 4, pf: 219, pc: 264 },
    { pos: 4, t: LNB_TEAMS[6], pj: 3, g: 1, p: 2, pts: 4, pf: 232, pc: 238 },
    { pos: 5, t: LNB_TEAMS[3], pj: 3, g: 1, p: 2, pts: 4, pf: 221, pc: 250 },
    { pos: 6, t: LNB_TEAMS[2], pj: 3, g: 1, p: 2, pts: 4, pf: 194, pc: 219 },
    { pos: 7, t: LNB_TEAMS[4], pj: 3, g: 1, p: 2, pts: 4, pf: 247, pc: 265 },
    { pos: 8, t: LNB_TEAMS[7], pj: 2, g: 1, p: 1, pts: 3, pf: 159, pc: 149 },
  ];
  const zoneStyle = (pos) => {
    if (pos <= 2)   return { bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.22)', accent: '#22C55E' }; // top
    if (pos <= 6)   return { bg: 'rgba(45,86,212,0.10)',  border: 'rgba(166,190,255,0.14)', accent: '#A6BEFF' }; // mid
    return              { bg: 'rgba(230,51,34,0.08)',   border: 'rgba(230,51,34,0.20)', accent: '#FF7369' }; // bottom
  };
  const diffColor = (pf, pc) => (pf - pc) >= 0 ? '#22C55E' : '#FF7369';

  return (
    <div style={{ width: 1080, height: 1350, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', color: '#F2F5FF' }}>
      <LNBBackground variant={6} />
      <div style={{ position: 'absolute', top: 50, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 3 }}>
        <img src="assets/logo-lnb.png" style={{ height: 72 }} />
      </div>
      <div style={{ position: 'absolute', top: 160, left: 0, right: 0, textAlign: 'center', zIndex: 3 }}>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 78, lineHeight: 1, letterSpacing: '0.01em', color: '#FFFFFF' }}>TABLA DE POSICIONES</div>
      </div>

      {/* Header columnas */}
      <div style={{ position: 'absolute', top: 290, left: 36, right: 36, zIndex: 3 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '42px 60px 1.5fr 48px 44px 44px 60px 62px 60px 60px 78px',
          alignItems: 'center', gap: 8, padding: '10px 18px',
          fontSize: 12, letterSpacing: '0.2em', fontWeight: 800, color: '#8FA3CF',
          borderBottom: '1px solid rgba(166,190,255,0.18)',
        }}>
          <div>#</div><div></div><div></div>
          <div style={{ textAlign: 'center' }}>PJ</div>
          <div style={{ textAlign: 'center' }}>G</div>
          <div style={{ textAlign: 'center' }}>P</div>
          <div style={{ textAlign: 'center' }}>PTS</div>
          <div style={{ textAlign: 'center' }}>%</div>
          <div style={{ textAlign: 'center' }}>PF</div>
          <div style={{ textAlign: 'center' }}>PC</div>
          <div style={{ textAlign: 'center' }}>DIF</div>
        </div>

        {table.map(r => {
          const z = zoneStyle(r.pos);
          const pct = Math.round((r.g / r.pj) * 100);
          const diff = r.pf - r.pc;
          return (
            <div key={r.pos} style={{
              display: 'grid', gridTemplateColumns: '42px 60px 1.5fr 48px 44px 44px 60px 62px 60px 60px 78px',
              alignItems: 'center', gap: 8, padding: '14px 18px', marginTop: 6,
              background: z.bg, border: `1px solid ${z.border}`, borderRadius: 12,
            }}>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, color: z.accent }}>{r.pos}</div>
              <TeamCrest team={r.t} size={52} />
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 19, letterSpacing: '-0.01em', color: '#FFFFFF' }}>{r.t.name}</div>
              <div style={{ textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: '#C5D3F2' }}>{r.pj}</div>
              <div style={{ textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 20 }}>{r.g}</div>
              <div style={{ textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: '#8FA3CF' }}>{r.p}</div>
              <div style={{ textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 26, color: '#FFFFFF' }}>{r.pts}</div>
              <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#C5D3F2' }}>{pct}%</div>
              <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#C5D3F2' }}>{r.pf}</div>
              <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#C5D3F2' }}>{r.pc}</div>
              <div style={{ textAlign: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: 16, color: diffColor(r.pf, r.pc) }}>{diff > 0 ? '+' : ''}{diff}</div>
            </div>
          );
        })}
      </div>

      {/* Leyenda de zonas — solo puntos de color, sin texto */}
      <div style={{ position: 'absolute', bottom: 126, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18, zIndex: 3 }}>
        <div style={{ width: 48, height: 6, background: '#22C55E', borderRadius: 3 }} />
        <div style={{ width: 48, height: 6, background: '#A6BEFF', borderRadius: 3 }} />
        <div style={{ width: 48, height: 6, background: '#FF7369', borderRadius: 3 }} />
      </div>
      <SponsorStripWhite />
    </div>
  );
}

function LegendChip({ color, label }) {
  return null; // no se usa más
}

/* ============================================================
   LÍDERES ESTADÍSTICOS — ranking top-10 estilo LNBF
   Foto grande izquierda, fade degradado hacia el centro tintado con color del equipo
   ============================================================ */
function LiderCard({ label, unit, leader, ranking }) {
  const team = ranking[0].team;
  // Color tinte derivado del team
  const tint = team.color === '#FFB400' ? '#FFB400' : team.color;
  return (
    <div style={{ width: 1080, height: 1350, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', color: '#F2F5FF', background: '#050B1F' }}>
      {/* Fondo base: azul noche con textura */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, #0F1E47 0%, #060D25 60%, #030815 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.06, mixBlendMode: 'screen', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 9px)' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 56, left: 56, right: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 6 }}>
        <img src="assets/logo-lnb.png" style={{ height: 54 }} />
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, letterSpacing: '0.34em', color: '#8FA3CF', fontWeight: 500 }}>{label}</div>
      </div>

      {/* Título grande derecha */}
      <div style={{ position: 'absolute', top: 110, right: 56, textAlign: 'right', zIndex: 6, maxWidth: 560 }}>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 110, lineHeight: 0.92, letterSpacing: '-0.01em', color: '#FFFFFF', fontWeight: 400 }}>Líder en</div>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 110, lineHeight: 0.92, letterSpacing: '-0.01em', color: '#FFFFFF', fontWeight: 400 }}>{unit.toLowerCase()}</div>
        <div style={{ marginTop: 10, fontSize: 12, letterSpacing: '0.3em', color: '#8FA3CF', fontWeight: 600 }}>{unit === 'PUNTOS' ? 'PTS/PJ' : unit === 'REBOTES' ? 'REB/PJ' : 'AST/PJ'}</div>
      </div>

      {/* Foto FULL HEIGHT izquierda, sangrada top→bottom con degradado al fondo azul */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 640, height: 1350, zIndex: 4, overflow: 'hidden' }}>
        {leader.photoPath ? (
          <img src={leader.photoPath} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 22%' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(30,50,110,0.4), rgba(8,18,51,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#6B7DA8', fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: 13, letterSpacing: '0.22em' }}>FOTO JUGADOR</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>recorte · fondo removido</div>
            </div>
          </div>
        )}
        {/* Degradado horizontal que funde la foto con el azul noche del fondo (no tinte amarillo) */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, transparent 28%, rgba(15,30,71,0.35) 50%, rgba(8,16,44,0.75) 75%, rgba(5,11,31,0.98) 100%)',
        }} />
        {/* Fade superior e inferior sutil */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(180deg, rgba(5,11,31,0.7) 0%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(0deg, #050B1F 0%, transparent 100%)' }} />
      </div>

      {/* Ranking top-10 derecha */}
      <div style={{ position: 'absolute', top: 470, right: 56, width: 500, display: 'flex', flexDirection: 'column', gap: 7, zIndex: 6 }}>
        {ranking.map((r, i) => {
          const isLeader = i === 0;
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '28px 24px 1fr auto', alignItems: 'center', gap: 12,
              padding: '9px 16px', borderRadius: 10,
              background: isLeader ? 'linear-gradient(90deg, rgba(34,197,94,0.18), rgba(34,197,94,0.04))' : 'rgba(255,255,255,0.03)',
              border: isLeader ? '1px solid rgba(34,197,94,0.48)' : '1px solid rgba(166,190,255,0.08)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: isLeader ? '#22C55E' : '#6B7DA8', textAlign: 'center' }}>{String(i + 1).padStart(2, '0')}</div>
              <TeamCrest team={r.team} size={22} />
              <div style={{ fontSize: 15, fontWeight: 800, color: isLeader ? '#22C55E' : '#E3E9F7', letterSpacing: '0.01em' }}>{r.player}</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 18, color: isLeader ? '#22C55E' : '#FFFFFF', letterSpacing: '-0.01em' }}>{r.value}</div>
            </div>
          );
        })}
      </div>

      <SponsorStripWhite />
    </div>
  );
}

// Data mock (vendrá de Genius Sports)
const RANK_PTS = [
  { player: 'J. GIMÉNEZ',   team: LNB_TEAMS[7], value: '24.6' },
  { player: 'F. BENÍTEZ',   team: LNB_TEAMS[1], value: '22.1' },
  { player: 'R. PERRY',     team: LNB_TEAMS[0], value: '21.4' },
  { player: 'J. WOOD',      team: LNB_TEAMS[2], value: '20.8' },
  { player: 'M. URNAU',     team: LNB_TEAMS[5], value: '19.7' },
  { player: 'V. DA COSTA',  team: LNB_TEAMS[6], value: '18.9' },
  { player: 'D. SILVA',     team: LNB_TEAMS[7], value: '17.5' },
  { player: 'J. ARGÜELLO',  team: LNB_TEAMS[3], value: '17.2' },
  { player: 'T. IHENACHO',  team: LNB_TEAMS[4], value: '16.8' },
  { player: 'J. ABEIRO',    team: LNB_TEAMS[6], value: '16.1' },
];
const RANK_REB = [
  { player: 'A. JUÁREZ',    team: LNB_TEAMS[7], value: '10.5' },
  { player: 'F. BENÍTEZ',   team: LNB_TEAMS[1], value: '10.5' },
  { player: 'J. ABEIRO',    team: LNB_TEAMS[6], value: '9.7'  },
  { player: 'J. WOOD',      team: LNB_TEAMS[2], value: '9.0'  },
  { player: 'M. URNAU',     team: LNB_TEAMS[5], value: '8.7'  },
  { player: 'R. PERRY',     team: LNB_TEAMS[0], value: '8.0'  },
  { player: 'J. ARGÜELLO',  team: LNB_TEAMS[3], value: '7.7'  },
  { player: 'V. DA COSTA',  team: LNB_TEAMS[6], value: '7.7'  },
  { player: 'D. SILVA',     team: LNB_TEAMS[7], value: '7.5'  },
  { player: 'T. IHENACHO',  team: LNB_TEAMS[4], value: '7.3'  },
];
const RANK_AST = [
  { player: 'D. RIVEROS',   team: LNB_TEAMS[7], value: '7.2'  },
  { player: 'M. PAREDES',   team: LNB_TEAMS[0], value: '6.8'  },
  { player: 'C. GONZÁLEZ',  team: LNB_TEAMS[1], value: '6.4'  },
  { player: 'L. TORRES',    team: LNB_TEAMS[2], value: '5.9'  },
  { player: 'E. VERA',      team: LNB_TEAMS[3], value: '5.7'  },
  { player: 'H. CABRERA',   team: LNB_TEAMS[4], value: '5.3'  },
  { player: 'S. PEÑA',      team: LNB_TEAMS[5], value: '5.1'  },
  { player: 'P. ACOSTA',    team: LNB_TEAMS[6], value: '4.9'  },
  { player: 'N. DUARTE',    team: LNB_TEAMS[7], value: '4.6'  },
  { player: 'F. OJEDA',     team: LNB_TEAMS[1], value: '4.4'  },
];

function LiderPuntos()      { return <LiderCard label="PUNTOS"   unit="PUNTOS"     leader={{ photoPath: 'assets/player-colonias-13.jpeg' }}  ranking={RANK_PTS} />; }
function LiderRebotes()     { return <LiderCard label="REBOTES"  unit="REBOTES"    leader={{ photoPath: 'assets/player-colonias-reb.png' }}    ranking={RANK_REB} />; }
function LiderAsistencias() { return <LiderCard label="ASISTENCIAS" unit="ASISTENCIAS" leader={{ photoPath: 'assets/player-colonias-30.jpeg' }} ranking={RANK_AST} />; }

window.ResultadoFinal = ResultadoFinal;
window.ResultadosJornada = ResultadosJornada;
window.TablaPosiciones = TablaPosiciones;
window.LiderPuntos = LiderPuntos;
window.LiderRebotes = LiderRebotes;
window.LiderAsistencias = LiderAsistencias;
window.RANK_PTS = RANK_PTS;
window.RANK_REB = RANK_REB;
window.RANK_AST = RANK_AST;
