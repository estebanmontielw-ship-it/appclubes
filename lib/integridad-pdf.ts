/**
 * Generación de PDFs del módulo de integridad.
 *
 * Client-side via jspdf (importado dinámicamente para no inflar el bundle).
 * La data ya está cargada en el modal del cliente, así que no hace falta
 * pegar al server — generamos directo en el browser.
 */

type Severidad = "BAJO" | "MEDIO" | "ALTO" | "CRITICO"
type Tier = "TIER_1" | "TIER_2" | "TIER_3"

interface AnalisisPDF {
  matchId: string
  fecha: string | null
  equipoLocal: string
  equipoLocalSigla: string | null
  equipoVisit: string
  equipoVisitSigla: string | null
  scoreLocal: number | null
  scoreVisit: number | null
  totalPuntos: number | null
  periodScores: Array<{ home: number; away: number }> | null
  esCritico: boolean
  totalPatrones: number
  severidadMax: Severidad | null
  estadoPartido: string | null
  generadoEn: string
  aiSummary: string | null
  patrones: Array<{
    tipoLabel: string
    severidad: Severidad
    descripcion: string
    jugadoresInvolucrados: Array<{ nombre: string; club: string; tier?: Tier }>
  }>
}

interface JugadorPDF {
  jugador: {
    nombre: string
    club: string
    clubSigla: string | null
    numero: number | null
    tier: Tier
    notas: string | null
    personId?: number | null
  }
  statsAgregadas: {
    games: number
    minsAvg: number
    pts: number; ptsAvg: number; ptsHigh: number
    fg2m: number; fg2a: number; fg2Pct: number | null
    fg3m: number; fg3a: number; fg3Pct: number | null
    ftm: number; fta: number; ftPct: number | null
    rebAvg: number
    astAvg: number
    stlAvg: number; blkAvg: number; toAvg: number; pfAvg: number
    effAvg: number
  } | null
  patrones: Array<{
    tipoLabel: string
    severidad: Severidad
    descripcion: string
    partido: {
      fecha: string | null
      equipoLocal: string
      equipoVisit: string
      scoreLocal: number | null
      scoreVisit: number | null
    }
  }>
  partidosRecientes: Array<{
    fecha: string | null
    oponente: string
    oponenteSigla: string | null
    esLocal: boolean
    scorePropio: number | null
    scoreOponente: number | null
    resultado: "GANADO" | "PERDIDO" | "EMPATE" | null
    mins: number | null
    pts: number
    fg2m: number; fg2a: number
    fg3m: number; fg3a: number
    ftm: number; fta: number
    reb: number; ast: number
    stl: number; blk: number
    to: number; pf: number
    eff: number | null
    plusMinus: number | null
    patronesEnPartido: string[]
  }>
}

const SEV_COLOR: Record<Severidad, [number, number, number]> = {
  BAJO: [107, 114, 128],   // gray-500
  MEDIO: [217, 119, 6],    // amber-600
  ALTO: [234, 88, 12],     // orange-600
  CRITICO: [220, 38, 38],  // red-600
}

const SEV_LABEL: Record<Severidad, string> = {
  BAJO: "Bajo", MEDIO: "Medio", ALTO: "Alto", CRITICO: "Crítico",
}

const TIER_LABEL: Record<Tier, string> = {
  TIER_1: "Tier 1", TIER_2: "Tier 2", TIER_3: "Tier 3",
}

/** Genera el PDF del análisis de un partido y dispara la descarga. */
export async function generarPDFAnalisis(a: AnalisisPDF): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentW = pageW - margin * 2
  let y = margin

  // ─── HEADER ─────────────────────────────────────────
  pdf.setFillColor(30, 58, 95) // CPB blue
  pdf.rect(0, 0, pageW, 22, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.text("ANÁLISIS DE INTEGRIDAD", margin, 10)
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text("Confederación Paraguaya de Básquetbol — Reporte Confidencial", margin, 16)
  y = 30

  // ─── PARTIDO ────────────────────────────────────────
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  const partidoLine = `${a.equipoLocal} ${a.scoreLocal ?? "–"} – ${a.scoreVisit ?? "–"} ${a.equipoVisit}`
  pdf.text(partidoLine, pageW / 2, y, { align: "center" })
  y += 7
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(107, 114, 128)
  const meta: string[] = []
  if (a.fecha) meta.push(a.fecha)
  if (a.estadoPartido) meta.push(a.estadoPartido)
  meta.push(`Match ID ${a.matchId}`)
  pdf.text(meta.join(" · "), pageW / 2, y, { align: "center" })
  y += 8

  if (a.esCritico) {
    pdf.setFillColor(254, 242, 242)
    pdf.setDrawColor(252, 165, 165)
    pdf.roundedRect(margin, y, contentW, 8, 1, 1, "FD")
    pdf.setTextColor(185, 28, 28)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text("PARTIDO CRÍTICO — 2 clubes monitoreados se enfrentan", pageW / 2, y + 5.5, { align: "center" })
    y += 12
  }

  // ─── SCORE POR CUARTO ───────────────────────────────
  if (a.periodScores && a.periodScores.length > 0) {
    pdf.setTextColor(107, 114, 128)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    pdf.text("SCORE POR CUARTO", margin, y)
    y += 4
    const cellW = contentW / (a.periodScores.length + 2)
    pdf.setFillColor(243, 244, 246)
    pdf.rect(margin, y, contentW, 6, "F")
    pdf.setTextColor(75, 85, 99)
    pdf.setFontSize(8)
    pdf.text("", margin + 2, y + 4)
    a.periodScores.forEach((_, i) => {
      pdf.text(`Q${i + 1}`, margin + cellW * (i + 1) + cellW / 2, y + 4, { align: "center" })
    })
    pdf.text("Total", margin + cellW * (a.periodScores.length + 1) + cellW / 2, y + 4, { align: "center" })
    y += 6

    pdf.setTextColor(0, 0, 0)
    pdf.setFont("helvetica", "normal")
    pdf.text(a.equipoLocalSigla || "Local", margin + 2, y + 4)
    a.periodScores.forEach((p, i) => {
      pdf.text(String(p.home), margin + cellW * (i + 1) + cellW / 2, y + 4, { align: "center" })
    })
    pdf.setFont("helvetica", "bold")
    pdf.text(String(a.scoreLocal ?? "–"), margin + cellW * (a.periodScores.length + 1) + cellW / 2, y + 4, { align: "center" })
    y += 5

    pdf.setFont("helvetica", "normal")
    pdf.text(a.equipoVisitSigla || "Visit", margin + 2, y + 4)
    a.periodScores.forEach((p, i) => {
      pdf.text(String(p.away), margin + cellW * (i + 1) + cellW / 2, y + 4, { align: "center" })
    })
    pdf.setFont("helvetica", "bold")
    pdf.text(String(a.scoreVisit ?? "–"), margin + cellW * (a.periodScores.length + 1) + cellW / 2, y + 4, { align: "center" })
    y += 9
  }

  // ─── ANÁLISIS EXPERTO (AI) ──────────────────────────
  if (a.aiSummary) {
    pdf.setFillColor(239, 246, 255)
    pdf.setDrawColor(191, 219, 254)
    const summaryLines = pdf.splitTextToSize(a.aiSummary, contentW - 6)
    const boxH = summaryLines.length * 4.2 + 8
    if (y + boxH > pageH - margin) { pdf.addPage(); y = margin }
    pdf.roundedRect(margin, y, contentW, boxH, 1.5, 1.5, "FD")
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text("ANÁLISIS EXPERTO (Claude AI)", margin + 3, y + 5)
    pdf.setTextColor(31, 41, 55)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text(summaryLines, margin + 3, y + 9)
    y += boxH + 4
  }

  // ─── PATRONES DETECTADOS ────────────────────────────
  if (a.patrones.length > 0) {
    if (y + 15 > pageH - margin) { pdf.addPage(); y = margin }
    pdf.setTextColor(107, 114, 128)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    pdf.text(`PATRONES DETECTADOS (${a.patrones.length})`, margin, y)
    y += 4

    for (const p of a.patrones) {
      const descLines = pdf.splitTextToSize(p.descripcion, contentW - 6)
      const jugLines = p.jugadoresInvolucrados.length > 0
        ? p.jugadoresInvolucrados.map((j) => `${j.nombre} (${j.club}${j.tier ? `, ${TIER_LABEL[j.tier]}` : ""})`).join(", ")
        : ""
      const jugSplit = jugLines ? pdf.splitTextToSize(`Involucrados: ${jugLines}`, contentW - 6) : []
      const boxH = 7 + descLines.length * 4 + (jugSplit.length > 0 ? jugSplit.length * 4 + 2 : 0) + 3
      if (y + boxH > pageH - margin) { pdf.addPage(); y = margin }

      const [r, g, b] = SEV_COLOR[p.severidad]
      pdf.setDrawColor(r, g, b)
      pdf.setLineWidth(0.5)
      pdf.line(margin, y, margin, y + boxH - 2)
      pdf.setLineWidth(0.1)

      pdf.setTextColor(r, g, b)
      pdf.setFontSize(9)
      pdf.setFont("helvetica", "bold")
      pdf.text(p.tipoLabel, margin + 3, y + 4)
      pdf.setFontSize(7)
      pdf.text(`[${SEV_LABEL[p.severidad].toUpperCase()}]`, pageW - margin - 2, y + 4, { align: "right" })

      pdf.setTextColor(55, 65, 81)
      pdf.setFontSize(8.5)
      pdf.setFont("helvetica", "normal")
      pdf.text(descLines, margin + 3, y + 9)
      let yEnd = y + 9 + descLines.length * 4

      if (jugSplit.length > 0) {
        pdf.setTextColor(107, 114, 128)
        pdf.setFontSize(7.5)
        pdf.setFont("helvetica", "italic")
        pdf.text(jugSplit, margin + 3, yEnd + 2)
        yEnd += jugSplit.length * 4 + 2
      }

      y = yEnd + 3
    }
  } else {
    pdf.setTextColor(22, 163, 74)
    pdf.setFontSize(9)
    pdf.text("Sin patrones sospechosos detectados.", margin, y + 4)
    y += 8
  }

  // ─── FOOTER ─────────────────────────────────────────
  const footerY = pageH - 8
  pdf.setDrawColor(229, 231, 235)
  pdf.line(margin, footerY - 3, pageW - margin, footerY - 3)
  pdf.setTextColor(156, 163, 175)
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Generado: ${new Date(a.generadoEn).toLocaleString("es-PY")}`, margin, footerY)
  pdf.text("Confidencial — Solo para uso interno CPB", pageW - margin, footerY, { align: "right" })

  const fileName = `analisis-${a.matchId}-${(a.equipoLocalSigla || "X")}-${(a.equipoVisitSigla || "Y")}.pdf`
  pdf.save(fileName)
}

/** Genera el PDF del dossier de un jugador y dispara la descarga. */
export async function generarPDFJugador(d: JugadorPDF): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentW = pageW - margin * 2
  let y = margin

  // ─── HEADER ─────────────────────────────────────────
  pdf.setFillColor(30, 58, 95)
  pdf.rect(0, 0, pageW, 22, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.text("DOSSIER DE INTEGRIDAD — JUGADOR", margin, 10)
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text("Confederación Paraguaya de Básquetbol — Reporte Confidencial", margin, 16)
  y = 30

  // ─── DATOS DEL JUGADOR ──────────────────────────────
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.text(d.jugador.nombre, margin, y)
  y += 6
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(107, 114, 128)
  const headerMeta = [
    d.jugador.club + (d.jugador.clubSigla ? ` (${d.jugador.clubSigla})` : ""),
    TIER_LABEL[d.jugador.tier],
    d.jugador.numero != null ? `#${d.jugador.numero}` : null,
    d.jugador.personId ? `Person ID ${d.jugador.personId}` : null,
  ].filter(Boolean)
  pdf.text(headerMeta.join(" · "), margin, y)
  y += 8

  // ─── NOTAS DE SEGUIMIENTO ───────────────────────────
  if (d.jugador.notas) {
    pdf.setFillColor(254, 252, 232)
    pdf.setDrawColor(253, 224, 71)
    const notasLines = pdf.splitTextToSize(d.jugador.notas, contentW - 6)
    const boxH = notasLines.length * 4.2 + 8
    pdf.roundedRect(margin, y, contentW, boxH, 1.5, 1.5, "FD")
    pdf.setTextColor(133, 77, 14)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    pdf.text("NOTAS DE SEGUIMIENTO", margin + 3, y + 5)
    pdf.setTextColor(31, 41, 55)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text(notasLines, margin + 3, y + 9)
    y += boxH + 6
  }

  // ─── STATS AGREGADAS LNB ────────────────────────────
  if (d.statsAgregadas) {
    if (y + 35 > pageH - margin) { pdf.addPage(); y = margin }
    pdf.setTextColor(107, 114, 128)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    pdf.text(`STATS AGREGADAS LNB (${d.statsAgregadas.games} JUEGOS)`, margin, y)
    y += 4

    const stats = [
      ["PTS/G", d.statsAgregadas.ptsAvg.toFixed(1), `Max ${d.statsAgregadas.ptsHigh}`],
      ["REB/G", d.statsAgregadas.rebAvg.toFixed(1), ""],
      ["AST/G", d.statsAgregadas.astAvg.toFixed(1), ""],
      ["STL/G", d.statsAgregadas.stlAvg.toFixed(1), ""],
      ["BLK/G", d.statsAgregadas.blkAvg.toFixed(1), ""],
      ["TO/G", d.statsAgregadas.toAvg.toFixed(1), ""],
      ["MIN/G", d.statsAgregadas.minsAvg.toFixed(1), ""],
      ["FG2%", d.statsAgregadas.fg2Pct != null ? `${d.statsAgregadas.fg2Pct.toFixed(1)}%` : "—", `${d.statsAgregadas.fg2m}/${d.statsAgregadas.fg2a}`],
      ["3PT%", d.statsAgregadas.fg3Pct != null ? `${d.statsAgregadas.fg3Pct.toFixed(1)}%` : "—", `${d.statsAgregadas.fg3m}/${d.statsAgregadas.fg3a}`],
      ["TL%", d.statsAgregadas.ftPct != null ? `${d.statsAgregadas.ftPct.toFixed(1)}%` : "—", `${d.statsAgregadas.ftm}/${d.statsAgregadas.fta}`],
      ["FALTAS/G", d.statsAgregadas.pfAvg.toFixed(1), ""],
      ["EFF/G", d.statsAgregadas.effAvg.toFixed(1), ""],
    ]
    const cellW = contentW / 6
    const cellH = 14
    stats.forEach((s, i) => {
      const col = i % 6
      const row = Math.floor(i / 6)
      const x = margin + col * cellW
      const yy = y + row * cellH
      pdf.setFillColor(249, 250, 251)
      pdf.setDrawColor(229, 231, 235)
      pdf.rect(x, yy, cellW, cellH, "FD")
      pdf.setTextColor(156, 163, 175)
      pdf.setFontSize(6)
      pdf.setFont("helvetica", "bold")
      pdf.text(s[0], x + cellW / 2, yy + 3, { align: "center" })
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(11)
      pdf.text(s[1], x + cellW / 2, yy + 8, { align: "center" })
      if (s[2]) {
        pdf.setTextColor(156, 163, 175)
        pdf.setFontSize(6)
        pdf.setFont("helvetica", "normal")
        pdf.text(s[2], x + cellW / 2, yy + 12, { align: "center" })
      }
    })
    y += cellH * 2 + 4
  }

  // ─── PATRONES HISTÓRICOS ────────────────────────────
  if (d.patrones.length > 0) {
    if (y + 15 > pageH - margin) { pdf.addPage(); y = margin }
    pdf.setTextColor(107, 114, 128)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    pdf.text(`PATRONES DETECTADOS (${d.patrones.length})`, margin, y)
    y += 4

    for (const p of d.patrones) {
      const descLines = pdf.splitTextToSize(p.descripcion, contentW - 6)
      const partidoStr = `${p.partido.fecha?.slice(0, 10) ?? "?"} · ${p.partido.equipoLocal} ${p.partido.scoreLocal ?? "–"}-${p.partido.scoreVisit ?? "–"} ${p.partido.equipoVisit}`
      const partidoLines = pdf.splitTextToSize(partidoStr, contentW - 6)
      const boxH = 7 + descLines.length * 4 + partidoLines.length * 4 + 4
      if (y + boxH > pageH - margin) { pdf.addPage(); y = margin }

      const [r, g, b] = SEV_COLOR[p.severidad]
      pdf.setDrawColor(r, g, b)
      pdf.setLineWidth(0.5)
      pdf.line(margin, y, margin, y + boxH - 2)
      pdf.setLineWidth(0.1)

      pdf.setTextColor(r, g, b)
      pdf.setFontSize(9)
      pdf.setFont("helvetica", "bold")
      pdf.text(p.tipoLabel, margin + 3, y + 4)
      pdf.setFontSize(7)
      pdf.text(`[${SEV_LABEL[p.severidad].toUpperCase()}]`, pageW - margin - 2, y + 4, { align: "right" })

      pdf.setTextColor(55, 65, 81)
      pdf.setFontSize(8.5)
      pdf.setFont("helvetica", "normal")
      pdf.text(descLines, margin + 3, y + 9)
      pdf.setTextColor(107, 114, 128)
      pdf.setFontSize(7.5)
      pdf.setFont("helvetica", "italic")
      pdf.text(partidoLines, margin + 3, y + 9 + descLines.length * 4 + 2)
      y += boxH + 1
    }
  }

  // ─── ÚLTIMOS PARTIDOS ───────────────────────────────
  if (d.partidosRecientes.length > 0) {
    if (y + 30 > pageH - margin) { pdf.addPage(); y = margin }
    pdf.setTextColor(107, 114, 128)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    pdf.text(`ÚLTIMOS PARTIDOS (${d.partidosRecientes.length})`, margin, y)
    y += 4

    // Header de la tabla
    const cols = ["Fecha", "Oponente", "Result.", "MIN", "PTS", "FG", "3PT", "TL", "REB", "AST", "TO", "EFF", "+/-"]
    const colWs = [16, 24, 16, 9, 10, 12, 12, 12, 9, 9, 9, 9, 9]
    pdf.setFillColor(243, 244, 246)
    pdf.rect(margin, y, contentW, 5, "F")
    pdf.setTextColor(75, 85, 99)
    pdf.setFontSize(7)
    pdf.setFont("helvetica", "bold")
    let xx = margin + 1
    cols.forEach((c, i) => {
      pdf.text(c, xx, y + 3.5)
      xx += colWs[i]
    })
    y += 5

    pdf.setTextColor(0, 0, 0)
    pdf.setFont("helvetica", "normal")
    for (const p of d.partidosRecientes) {
      if (y + 5 > pageH - margin) { pdf.addPage(); y = margin }
      xx = margin + 1
      const cells: string[] = [
        p.fecha?.slice(5) ?? "—",
        `${p.esLocal ? "vs" : "@"} ${p.oponenteSigla || p.oponente.slice(0, 8)}`,
        `${p.scorePropio ?? "–"}-${p.scoreOponente ?? "–"}`,
        p.mins != null ? p.mins.toFixed(0) : "–",
        String(p.pts),
        `${p.fg2m + p.fg3m}/${p.fg2a + p.fg3a}`,
        `${p.fg3m}/${p.fg3a}`,
        `${p.ftm}/${p.fta}`,
        String(p.reb),
        String(p.ast),
        String(p.to),
        p.eff != null ? String(Math.round(p.eff)) : "—",
        p.plusMinus == null ? "—" : (p.plusMinus > 0 ? `+${p.plusMinus}` : String(p.plusMinus)),
      ]
      // resultado coloreado
      pdf.setFontSize(7)
      cells.forEach((c, i) => {
        if (i === 2) {
          if (p.resultado === "GANADO") pdf.setTextColor(22, 163, 74)
          else if (p.resultado === "PERDIDO") pdf.setTextColor(220, 38, 38)
          else pdf.setTextColor(0, 0, 0)
        } else {
          pdf.setTextColor(0, 0, 0)
        }
        pdf.text(c, xx, y + 3.5)
        xx += colWs[i]
      })
      // marca de patrón
      if (p.patronesEnPartido.length > 0) {
        pdf.setTextColor(217, 119, 6)
        pdf.setFont("helvetica", "bold")
        pdf.text("⚠ " + p.patronesEnPartido.length, pageW - margin - 10, y + 3.5)
        pdf.setFont("helvetica", "normal")
      }
      y += 5
    }
  }

  // ─── FOOTER ─────────────────────────────────────────
  const footerY = pageH - 8
  pdf.setDrawColor(229, 231, 235)
  pdf.line(margin, footerY - 3, pageW - margin, footerY - 3)
  pdf.setTextColor(156, 163, 175)
  pdf.setFontSize(7)
  pdf.text(`Generado: ${new Date().toLocaleString("es-PY")}`, margin, footerY)
  pdf.text("Confidencial — Solo para uso interno CPB", pageW - margin, footerY, { align: "right" })

  const fileName = `dossier-${d.jugador.nombre.toLowerCase().replace(/\s+/g, "-")}.pdf`
  pdf.save(fileName)
}
