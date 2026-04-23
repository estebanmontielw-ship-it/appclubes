"use client"

// Mini-previews reales de cada template (no solo el gradiente). Cada thumbnail
// imita el layout con elementos CSS/divs posicionados como placeholders del
// diseño final. Así el usuario puede elegir por layout, no solo por nombre.

import type { TemplateKey } from "../_lib/templates"
import type { V3Theme } from "../_lib/themes"
import { hexToRgba } from "../_lib/color-utils"

interface Props {
  templateKey: TemplateKey
  theme: V3Theme
}

export default function TemplateThumbnail({ templateKey, theme }: Props) {
  const bg = theme.bgGradient || `linear-gradient(135deg, ${theme.accentAlt}, ${theme.bgAlt} 40%, ${theme.bg})`
  const fg = theme.fg
  const fgMuted = theme.fgMuted
  const accent = theme.accent
  const altBg = theme.bgAlt

  const wrap: React.CSSProperties = {
    background: bg,
    position: "relative",
    overflow: "hidden",
  }

  const glowA: React.CSSProperties = {
    position: "absolute",
    top: "-20%", left: "-20%",
    width: "60%", height: "60%",
    background: `radial-gradient(circle, ${hexToRgba(accent, 0.4)} 0%, transparent 60%)`,
    pointerEvents: "none",
  }
  const glowB: React.CSSProperties = {
    position: "absolute",
    bottom: "-30%", right: "-30%",
    width: "70%", height: "70%",
    background: `radial-gradient(circle, ${hexToRgba(theme.accentAlt, 0.4)} 0%, transparent 60%)`,
    pointerEvents: "none",
  }

  const badge: React.CSSProperties = {
    position: "absolute",
    top: "5%", left: "50%", transform: "translateX(-50%)",
    width: "28%", height: "5%",
    borderRadius: 999,
    border: `1px solid ${accent}`,
    background: hexToRgba(theme.bg, 0.5),
  }

  const strip: React.CSSProperties = {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: "9%",
    background: hexToRgba(theme.bg, 0.88),
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "6%",
  }

  const Slot = () => (
    <div style={{
      width: "12%", height: "55%",
      background: hexToRgba(fg, 0.08),
      borderRadius: 2,
    }} />
  )

  function Common() {
    return (
      <>
        <div style={glowA} />
        <div style={glowB} />
        <div style={badge} />
      </>
    )
  }

  function PreLayout() {
    return (
      <>
        <Common />
        {/* eyebrow */}
        <div style={{ position: "absolute", top: "13%", left: "50%", transform: "translateX(-50%)", width: "60%", height: "2%", background: hexToRgba(accent, 0.6), borderRadius: 1 }} />
        {/* titles 2 lines */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "55%", height: "8%", background: fg, borderRadius: 2 }} />
        <div style={{ position: "absolute", top: "29%", left: "50%", transform: "translateX(-50%)", width: "48%", height: "8%", background: fg, borderRadius: 2 }} />
        {/* VS circle */}
        <div style={{ position: "absolute", top: "47%", left: "50%", transform: "translate(-50%,-50%)", width: "14%", height: "11%", borderRadius: "50%", border: `1.5px solid ${accent}`, background: hexToRgba(theme.bg, 0.7), color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 900 }}>VS</div>
        {/* 2 cards */}
        <div style={{ position: "absolute", top: "42%", left: "6%", width: "36%", height: "18%", border: `1px solid ${hexToRgba(accent, 0.3)}`, background: hexToRgba(theme.bg, 0.3), borderRadius: 6 }}>
          <div style={{ position: "absolute", bottom: "20%", left: "10%", right: "10%", height: "18%", background: fg, borderRadius: 2 }} />
        </div>
        <div style={{ position: "absolute", top: "42%", right: "6%", width: "36%", height: "18%", border: `1px solid ${hexToRgba(fgMuted, 0.25)}`, background: hexToRgba(theme.bg, 0.3), borderRadius: 6 }}>
          <div style={{ position: "absolute", bottom: "20%", left: "10%", right: "10%", height: "18%", background: fg, borderRadius: 2 }} />
        </div>
        {/* info bar */}
        <div style={{ position: "absolute", top: "72%", left: "9%", right: "9%", height: "7%", borderRadius: 5, background: hexToRgba(theme.bg, 0.7), border: `1px solid ${hexToRgba(accent, 0.3)}` }} />
        <div style={strip}><Slot /><Slot /><Slot /><Slot /><Slot /></div>
      </>
    )
  }

  function ResultadoLayout() {
    return (
      <>
        <Common />
        <div style={{ position: "absolute", top: "13%", left: "50%", transform: "translateX(-50%)", width: "60%", height: "2%", background: hexToRgba(accent, 0.6), borderRadius: 1 }} />
        {/* home score */}
        <div style={{ position: "absolute", top: "28%", left: "26%", transform: "translateX(-50%)", width: "24%", height: "22%", background: fg, borderRadius: 4 }} />
        {/* dash */}
        <div style={{ position: "absolute", top: "36%", left: "50%", transform: "translateX(-50%)", width: "8%", height: "5%", background: accent, borderRadius: 2 }} />
        {/* away score */}
        <div style={{ position: "absolute", top: "28%", right: "26%", transform: "translateX(50%)", width: "24%", height: "22%", background: hexToRgba(fg, 0.6), borderRadius: 4 }} />
        {/* names */}
        <div style={{ position: "absolute", top: "62%", left: "26%", transform: "translateX(-50%)", width: "28%", height: "4%", background: fg, borderRadius: 2 }} />
        <div style={{ position: "absolute", top: "62%", right: "26%", transform: "translateX(50%)", width: "28%", height: "4%", background: fgMuted, borderRadius: 2 }} />
        {/* info bar */}
        <div style={{ position: "absolute", top: "73%", left: "9%", right: "9%", height: "7%", borderRadius: 5, background: hexToRgba(theme.bg, 0.7), border: `1px solid ${hexToRgba(accent, 0.3)}` }} />
        <div style={strip}><Slot /><Slot /><Slot /><Slot /><Slot /></div>
      </>
    )
  }

  function TablaLayout() {
    return (
      <>
        <Common />
        <div style={{ position: "absolute", top: "13%", left: "50%", transform: "translateX(-50%)", width: "50%", height: "2%", background: hexToRgba(accent, 0.6), borderRadius: 1 }} />
        <div style={{ position: "absolute", top: "17%", left: "50%", transform: "translateX(-50%)", width: "55%", height: "7%", background: fg, borderRadius: 3 }} />
        {[0,1,2,3,4,5,6].map((i) => (
          <div key={i} style={{
            position: "absolute", top: `${32 + i*5.5}%`, left: "8%", right: "8%",
            height: "4.5%", borderRadius: 3,
            background: i < 3 ? hexToRgba(accent, 0.1) : hexToRgba(theme.bg, 0.45),
            border: `1px solid ${hexToRgba(accent, i < 3 ? 0.3 : 0.1)}`,
            display: "flex", alignItems: "center", padding: "0 4%",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: 1, background: i < 3 ? accent : fgMuted }} />
            <div style={{ flex: 1, height: 30, marginLeft: 4 }} />
            <div style={{ width: 14, height: 3, background: fg, borderRadius: 1 }} />
          </div>
        ))}
        <div style={strip}><Slot /><Slot /><Slot /><Slot /><Slot /></div>
      </>
    )
  }

  function LideresLayout() {
    return (
      <>
        <Common />
        <div style={{ position: "absolute", top: "13%", left: "50%", transform: "translateX(-50%)", width: "60%", height: "2%", background: hexToRgba(accent, 0.6), borderRadius: 1 }} />
        <div style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", width: "48%", height: "10%", background: fg, borderRadius: 3 }} />
        {[0,1,2,3,4].map((i) => (
          <div key={i} style={{
            position: "absolute", top: `${36 + i*9}%`, left: "6%", right: "6%",
            height: "7.5%", borderRadius: 5,
            background: hexToRgba(theme.bg, 0.45),
            border: i === 0 ? `2px solid ${accent}` : `1px solid ${hexToRgba(accent, 0.2)}`,
            display: "flex", alignItems: "center", padding: "0 4%",
            gap: "4%",
          }}>
            <div style={{ width: 16, height: 16, borderRadius: 2, background: accent }} />
            <div style={{ flex: 1, height: 6, background: fg, borderRadius: 1 }} />
            <div style={{ width: 20, height: 8, background: fg, borderRadius: 1 }} />
          </div>
        ))}
        <div style={strip}><Slot /><Slot /><Slot /><Slot /><Slot /></div>
      </>
    )
  }

  function JugadorLayout() {
    return (
      <>
        <Common />
        <div style={{ position: "absolute", top: "13%", left: "50%", transform: "translateX(-50%)", width: "60%", height: "2%", background: hexToRgba(accent, 0.6), borderRadius: 1 }} />
        {/* photo placeholder */}
        <div style={{ position: "absolute", top: "22%", left: "22%", right: "22%", height: "36%", border: `1.5px solid ${hexToRgba(accent, 0.35)}`, background: hexToRgba(theme.bg, 0.35), borderRadius: 6 }} />
        {/* name */}
        <div style={{ position: "absolute", top: "63%", left: "10%", right: "10%", height: "6%", background: fg, borderRadius: 2 }} />
        <div style={{ position: "absolute", top: "71%", left: "25%", right: "25%", height: "3%", background: accent, borderRadius: 1 }} />
        {/* stats */}
        <div style={{ position: "absolute", top: "79%", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "10%", width: "60%" }}>
          {[0,1,2].map((i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ width: "100%", height: 18, background: accent, borderRadius: 2 }} />
              <div style={{ width: "60%", height: 6, marginTop: 4, background: fgMuted, borderRadius: 1, marginInline: "auto" }} />
            </div>
          ))}
        </div>
      </>
    )
  }

  function LanzamientoLayout() {
    return (
      <>
        <Common />
        <div style={{ position: "absolute", top: "33%", left: "50%", transform: "translateX(-50%)", width: "40%", height: "2%", background: hexToRgba(accent, 0.6), borderRadius: 1 }} />
        <div style={{ position: "absolute", top: "38%", left: "50%", transform: "translateX(-50%)", width: "70%", height: "14%", background: fg, borderRadius: 4 }} />
        <div style={{ position: "absolute", top: "54%", left: "50%", transform: "translateX(-50%)", width: "50%", height: "18%", background: accent, borderRadius: 4, boxShadow: `0 0 20px ${hexToRgba(accent, 0.5)}` }} />
        <div style={{ position: "absolute", top: "76%", left: "50%", transform: "translateX(-50%)", width: "30%", height: "2%", background: hexToRgba(accent, 0.6), borderRadius: 1 }} />
        <div style={{ position: "absolute", top: "80%", left: "50%", transform: "translateX(-50%)", width: "40%", height: "4%", background: fg, borderRadius: 2 }} />
        <div style={strip}><Slot /><Slot /><Slot /><Slot /><Slot /></div>
      </>
    )
  }

  function BlankLayout() {
    return (
      <>
        <div style={glowA} />
        <div style={glowB} />
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          color: fgMuted, fontSize: 10, fontWeight: 600,
        }}>+ Vacío</div>
      </>
    )
  }

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded" style={wrap}>
      {templateKey === "pre"         && <PreLayout />}
      {templateKey === "resultado"   && <ResultadoLayout />}
      {templateKey === "tabla"       && <TablaLayout />}
      {templateKey === "lideres"     && <LideresLayout />}
      {templateKey === "jugador"     && <JugadorLayout />}
      {templateKey === "lanzamiento" && <LanzamientoLayout />}
      {templateKey === "blank"       && <BlankLayout />}
    </div>
  )
}
