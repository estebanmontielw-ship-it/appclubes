/* global React, LNBBackground, TeamCrest, LNBLogoPlaceholder, LNB_TEAMS, LNB_SPONSORS */

/* ============================================================
   LNB — PRÓXIMOS PARTIDOS · 3 variantes · hasta 4 partidos/fecha
   Paleta + composición inspirada en flyers oficiales LNB
   ============================================================ */

const MATCHES_FECHA_4 = [
  { home: LNB_TEAMS[0], away: LNB_TEAMS[1], venue: 'Leon Coundou', date: 'JUE 23 DE ABRIL', time: '19:30' },
  { home: LNB_TEAMS[2], away: LNB_TEAMS[3], venue: 'Estadio de la Federación de Basquetbol de Amambay', date: 'JUE 23 DE ABRIL', time: '19:30' },
  { home: LNB_TEAMS[4], away: LNB_TEAMS[5], venue: 'Efigenio Gonzalez', date: 'JUE 23 DE ABRIL', time: '20:30' },
  { home: LNB_TEAMS[6], away: LNB_TEAMS[7], venue: 'Luis Fernandez', date: 'SÁB 25 DE ABRIL', time: '20:00' },
];

/* Sponsor strip — sin fondo, apoyado sobre el flyer (estilo LNBF) */
function SponsorStripWhite() {
  return (
    <div style={{ position: 'absolute', bottom: 26, left: 64, right: 64, zIndex: 4 }}>
      {/* Hairline divisor */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)', marginBottom: 18 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 64 }}>
        {LNB_SPONSORS.map(s => (
          <img
            key={s.name}
            src={s.logo}
            style={{
              height: s.name === 'Molten' ? 26 : s.name === 'Powerade' ? 20 : 28,
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              opacity: 0.88,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   V1 — OFICIAL REFINADO (basado en el flyer real que usan)
   ============================================================ */
function ProxV1() {
  return (
    <div style={{ width: 1080, height: 1350, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', color: '#F2F5FF' }}>
      <LNBBackground variant={1} />

      {/* LNB logo centrado arriba */}
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 3 }}>
        <img src="assets/logo-lnb.png" style={{ height: 100, objectFit: 'contain' }} />
      </div>

      {/* Eyebrow + title */}
      <div style={{ position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', zIndex: 3 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, letterSpacing: '0.22em', color: '#C5D3F2', fontWeight: 500 }}>FASE REGULAR · CUARTA FECHA</div>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 110, lineHeight: 1, letterSpacing: '0.02em', color: '#FFFFFF', marginTop: 10 }}>ENFRENTAMIENTOS</div>
      </div>

      {/* Match cards — 4 */}
      <div style={{ position: 'absolute', top: 390, left: 36, right: 36, display: 'flex', flexDirection: 'column', gap: 14, zIndex: 3 }}>
        {MATCHES_FECHA_4.map((m, i) => (
          <div key={i} style={{
            background: 'linear-gradient(155deg, rgba(30,60,140,0.48) 0%, rgba(14,29,79,0.7) 65%, rgba(8,18,51,0.78) 100%)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(166,190,255,0.18)',
            borderRadius: 18,
            padding: '20px 26px 16px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 14px 34px -18px rgba(0,0,0,0.55)',
          }}>
            {/* textura sutil */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `
                radial-gradient(circle at 12% 18%, rgba(212,175,55,0.12) 0%, transparent 42%),
                repeating-linear-gradient(115deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 7px)
              `,
              mixBlendMode: 'screen',
            }} />
            {/* hairline dorada arriba */}
            <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 2, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.55), transparent)' }} />

            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '84px 1fr auto 1fr 84px', alignItems: 'center', gap: 14 }}>
              <TeamCrest team={m.home} size={76} />
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, lineHeight: 1.02, letterSpacing: '0.01em' }}>{m.home.name}</div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 30, color: '#D4AF37', letterSpacing: '0.2em', padding: '0 14px' }}>VS</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, lineHeight: 1.02, letterSpacing: '0.01em', textAlign: 'right' }}>{m.away.name}</div>
              <div style={{ justifySelf: 'end' }}><TeamCrest team={m.away} size={76} /></div>
            </div>

            {/* info row — 3 bloques ordenados, grilla definida */}
            <div style={{
              position: 'relative',
              marginTop: 14, padding: '12px 10px',
              background: 'rgba(3,8,26,0.62)',
              borderRadius: 10,
              border: '1px solid rgba(166,190,255,0.08)',
              display: 'grid', gridTemplateColumns: '1.6fr 1px 1fr 1px 0.8fr',
              alignItems: 'center', gap: 14,
            }}>
              {/* Venue */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, paddingLeft: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}>
                  <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" stroke="#D4AF37" strokeWidth="1.7" strokeLinejoin="round"/>
                  <circle cx="12" cy="9" r="2.2" stroke="#D4AF37" strokeWidth="1.7"/>
                </svg>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.2em', fontWeight: 800, color: '#8FA3CF', lineHeight: 1 }}>ESTADIO</div>
                  <div style={{ marginTop: 3, fontSize: 13, fontWeight: 700, color: '#F2F5FF', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.venue}</div>
                </div>
              </div>
              <div style={{ width: 1, height: 28, background: 'rgba(166,190,255,0.15)' }} />
              {/* Fecha */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}>
                  <rect x="3.5" y="5.5" width="17" height="15" rx="2" stroke="#D4AF37" strokeWidth="1.7"/>
                  <path d="M3.5 10h17M8 3v4M16 3v4" stroke="#D4AF37" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: '0.2em', fontWeight: 800, color: '#8FA3CF', lineHeight: 1 }}>FECHA</div>
                  <div style={{ marginTop: 3, fontSize: 13, fontWeight: 700, color: '#F2F5FF', lineHeight: 1.15, letterSpacing: '0.02em' }}>{m.date}</div>
                </div>
              </div>
              <div style={{ width: 1, height: 28, background: 'rgba(166,190,255,0.15)' }} />
              {/* Hora */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 8, justifyContent: 'flex-end' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}>
                  <circle cx="12" cy="12" r="8.5" stroke="#D4AF37" strokeWidth="1.7"/>
                  <path d="M12 7.5V12l3 2" stroke="#D4AF37" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.2em', fontWeight: 800, color: '#8FA3CF', lineHeight: 1 }}>HORA</div>
                  <div style={{ marginTop: 2, fontFamily: "'Archivo Black', sans-serif", fontSize: 18, color: '#FFFFFF', lineHeight: 1, letterSpacing: '-0.01em' }}>{m.time} <span style={{ fontSize: 12, color: '#D4AF37', letterSpacing: '0.1em' }}>HS</span></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SponsorStripWhite />
    </div>
  );
}

/* ============================================================
   V2 — MATCHUP POSTER (logos verticales, fecha gigante)
   ============================================================ */
function ProxV2() {
  return (
    <div style={{ width: 1080, height: 1350, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', color: '#F2F5FF' }}>
      <LNBBackground variant={5} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 48, left: 48, right: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 3 }}>
        <img src="assets/logo-lnb.png" style={{ height: 72 }} />
        <div style={{ padding: '10px 20px', borderRadius: 999, background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.5)', fontSize: 13, fontWeight: 800, letterSpacing: '0.24em', color: '#D4AF37' }}>FECHA 04 · JORNADA</div>
      </div>

      {/* Hero */}
      <div style={{ position: 'absolute', top: 170, left: 48, right: 48, zIndex: 3 }}>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 32, letterSpacing: '0.32em', color: '#A6BEFF' }}>ESTA SEMANA</div>
        <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 170, lineHeight: 0.86, letterSpacing: '-0.045em', color: '#FFFFFF' }}>PRÓXIMOS</div>
        <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 170, lineHeight: 0.86, letterSpacing: '-0.045em', color: '#D4AF37' }}>PARTIDOS</div>
      </div>

      {/* 4 match grid 2x2 */}
      <div style={{ position: 'absolute', top: 620, left: 36, right: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, zIndex: 3 }}>
        {MATCHES_FECHA_4.map((m, i) => (
          <div key={i} style={{
            background: 'linear-gradient(145deg, rgba(45,86,212,0.18) 0%, rgba(14,29,79,0.62) 100%)',
            border: '1px solid rgba(166,190,255,0.22)',
            borderRadius: 18,
            padding: 18,
          }}>
            <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 900, color: '#D4AF37' }}>JUEGO {String(i+1).padStart(2, '0')}</div>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TeamCrest team={m.home} size={92} />
                <div style={{ marginTop: 6, fontFamily: "'Archivo Black', sans-serif", fontSize: 14, textAlign: 'center', letterSpacing: '-0.01em', lineHeight: 1.05 }}>{m.home.name}</div>
              </div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 34, letterSpacing: '0.1em', color: '#D4AF37' }}>VS</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TeamCrest team={m.away} size={92} />
                <div style={{ marginTop: 6, fontFamily: "'Archivo Black', sans-serif", fontSize: 14, textAlign: 'center', letterSpacing: '-0.01em', lineHeight: 1.05 }}>{m.away.name}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(3,8,26,0.55)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 700, color: '#A6BEFF' }}>{m.date}</span>
              <span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: '#FFFFFF' }}>{m.time}</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 10, letterSpacing: '0.14em', fontWeight: 600, color: '#8FA3CF', textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.venue}</div>
          </div>
        ))}
      </div>

      <SponsorStripWhite />
    </div>
  );
}

/* ============================================================
   V3 — POSTER EDITORIAL (band dorado + type pesado, sin rojo)
   ============================================================ */
function ProxV3() {
  return (
    <div style={{ width: 1080, height: 1350, position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif', color: '#F2F5FF' }}>
      <LNBBackground variant={3} />

      {/* Header oscuro */}
      <div style={{ position: 'absolute', top: 40, left: 48, right: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 3 }}>
        <img src="assets/logo-lnb.png" style={{ height: 72 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', border: '1px solid rgba(212,175,55,0.5)', borderRadius: 4 }}>
          <div style={{ width: 6, height: 6, background: '#D4AF37' }} />
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, letterSpacing: '0.32em', color: '#D4AF37' }}>FECHA 04 · 2026</span>
        </div>
      </div>

      {/* Title hero — type driven, sin fondos */}
      <div style={{ position: 'absolute', top: 170, left: 48, right: 48, zIndex: 3 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, letterSpacing: '0.3em', color: '#8FA3CF', fontWeight: 500, marginBottom: 12 }}>LIGA NACIONAL DE BASQUETBOL · APERTURA</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div style={{ width: 10, height: 180, background: '#D4AF37' }} />
          <div>
            <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 118, lineHeight: 0.86, letterSpacing: '-0.045em', color: '#FFFFFF' }}>PRÓXIMOS</div>
            <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 118, lineHeight: 0.86, letterSpacing: '-0.045em', color: '#D4AF37', marginTop: 6 }}>PARTIDOS</div>
          </div>
        </div>
      </div>

      {/* 4 cards editoriales, mínimos */}
      <div style={{ position: 'absolute', top: 590, left: 36, right: 36, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 3 }}>
        {MATCHES_FECHA_4.map((m, i) => (
          <div key={i} style={{
            background: '#FFFFFF',
            borderRadius: 10,
            padding: '14px 18px',
            color: '#081233',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#D4AF37' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '40px 60px 1fr auto 1fr 60px 110px', alignItems: 'center', gap: 12, marginLeft: 10 }}>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 30, color: '#1E2A44', lineHeight: 1 }}>{String(i+1).padStart(2, '0')}</div>
              <TeamCrest team={m.home} size={56} />
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 18, lineHeight: 1, letterSpacing: '-0.01em' }}>{m.home.name}</div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, letterSpacing: '0.14em', color: '#8FA3CF' }}>VS</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 18, lineHeight: 1, letterSpacing: '-0.01em', textAlign: 'right' }}>{m.away.name}</div>
              <TeamCrest team={m.away} size={56} />
              <div style={{ textAlign: 'center', background: '#081233', color: '#FFFFFF', padding: '8px 10px', borderRadius: 6 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.22em', fontWeight: 900, color: '#D4AF37' }}>{m.date.split(' ')[0]}</div>
                <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, lineHeight: 1, marginTop: 2 }}>{m.time}</div>
              </div>
            </div>
            <div style={{ marginLeft: 10, marginTop: 6, fontSize: 10, letterSpacing: '0.14em', fontWeight: 700, color: '#47577A' }}>{m.venue.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <SponsorStripWhite />
    </div>
  );
}

window.ProxV1 = ProxV1;
window.ProxV2 = ProxV2;
window.ProxV3 = ProxV3;
window.SponsorStripWhite = SponsorStripWhite;
window.MATCHES_FECHA_4 = MATCHES_FECHA_4;
