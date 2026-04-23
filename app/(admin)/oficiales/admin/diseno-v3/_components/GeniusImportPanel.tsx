"use client"


import { useCallback, useEffect, useState } from "react"
import { X, Loader2, Trophy, Calendar, BarChart3, UserRound, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LigaKey } from "../_lib/themes"

type ImportTab = "match-pre" | "match-final" | "standings" | "leaders"

interface Props {
  open: boolean
  liga: LigaKey
  onClose: () => void
  onImport: (payload: ImportPayload) => void
}

export type ImportPayload =
  | { template: "pre"; data: MatchData }
  | { template: "resultado"; data: MatchData }
  | { template: "tabla"; data: { standings: any[]; ligaLabel: string } }
  | { template: "lideres"; data: { leaders: any[]; ligaLabel: string } }

export interface MatchData {
  matchId?: number | string
  homeName: string
  awayName: string
  homeLogo?: string | null
  awayLogo?: string | null
  homeScore?: number | string | null
  awayScore?: number | string | null
  dateLabel: string
  venue: string
  ligaLabel: string
}

const TABS: { key: ImportTab; label: string; icon: any; desc: string }[] = [
  { key: "match-pre",   label: "Partido (previa)", icon: Calendar,   desc: "Anuncio de partido" },
  { key: "match-final", label: "Partido (final)",  icon: Trophy,     desc: "Con marcador final" },
  { key: "standings",   label: "Posiciones",       icon: BarChart3,  desc: "Tabla completa" },
  { key: "leaders",     label: "Líderes",          icon: UserRound,  desc: "Top jugadores" },
]

function formatDateLabel(iso: string) {
  if (!iso) return ""
  const [datePart, timePart] = iso.split(" ")
  if (!datePart) return ""
  const [, m, d] = datePart.split("-")
  const months = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"]
  const date = `${d} ${months[Number(m) - 1]}`
  const time = (timePart || "").slice(0, 5)
  return time ? `${date} · ${time} HS` : date
}

function ligaLabel(l: LigaKey) {
  return (
    { lnb: "LNB APERTURA 2026", lnbf: "LNBF APERTURA 2026", u22m: "U22 MASC 2026", u22f: "U22 FEM 2026" } as Record<LigaKey, string>
  )[l]
}

export default function GeniusImportPanel({ open, liga, onClose, onImport }: Props) {
  const [tab, setTab] = useState<ImportTab>("match-pre")
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [standings, setStandings] = useState<any[]>([])
  const [leaders, setLeaders] = useState<any[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === "match-pre" || tab === "match-final") {
        const res = await fetch(`/api/genius/matches?liga=${liga}`)
        const d = await res.json()
        setMatches(Array.isArray(d?.data) ? d.data : [])
      } else if (tab === "standings") {
        const res = await fetch(`/api/genius/standings?liga=${liga}`)
        const d = await res.json()
        setStandings(Array.isArray(d?.data) ? d.data : [])
      } else if (tab === "leaders") {
        const res = await fetch(`/api/genius/leaders?liga=${liga}&stat=points`)
        const d = await res.json()
        setLeaders(Array.isArray(d?.data) ? d.data : [])
      }
    } catch (e) {
      console.error("Genius import error", e)
    } finally {
      setLoading(false)
    }
  }, [tab, liga])

  useEffect(() => {
    if (open) loadData()
  }, [open, loadData])

  if (!open) return null

  function pickMatch(m: any, withScore: boolean) {
    const home = (m.competitors || []).find((c: any) => c.isHomeCompetitor === 1) || m.competitors?.[0]
    const away = (m.competitors || []).find((c: any) => c.isHomeCompetitor === 0) || m.competitors?.[1]
    const venue = typeof m.venueName === "string"
      ? m.venueName
      : (m.venue?.venueName || m.venue?.locationName || "")
    const data: MatchData = {
      matchId: m.matchId,
      homeName: home?.competitorName || "",
      awayName: away?.competitorName || "",
      homeLogo: home?.images?.logo?.S1?.url || home?.images?.logo?.T1?.url || null,
      awayLogo: away?.images?.logo?.S1?.url || away?.images?.logo?.T1?.url || null,
      homeScore: withScore ? (home?.scoreString ? parseInt(home.scoreString, 10) : null) : null,
      awayScore: withScore ? (away?.scoreString ? parseInt(away.scoreString, 10) : null) : null,
      dateLabel: formatDateLabel(m.matchTime || ""),
      venue: String(venue || "").toUpperCase(),
      ligaLabel: ligaLabel(liga),
    }
    onImport({ template: withScore ? "resultado" : "pre", data })
  }

  function pickStandings() {
    const rows = standings.map((s: any, i: number) => ({
      pos: s.rank ?? s.position ?? i + 1,
      name: s.teamName || s.competitorName || s.name || "",
      pj: s.played ?? s.matchesPlayed ?? 0,
      w: s.wins ?? s.matchesWon ?? 0,
      l: s.losses ?? s.matchesLost ?? 0,
    }))
    onImport({ template: "tabla", data: { standings: rows, ligaLabel: ligaLabel(liga) } })
  }

  function pickLeaders() {
    const rows = leaders.slice(0, 5).map((p: any) => ({
      name: p.playerName || `${p.firstName || ""} ${p.familyName || ""}`.trim(),
      team: p.teamCode || p.teamName || "",
      value: p.value ?? p.points ?? p.stat ?? "",
    }))
    onImport({ template: "lideres", data: { leaders: rows, ligaLabel: ligaLabel(liga) } })
  }

  const filteredMatches = tab === "match-final"
    ? matches.filter((m) => m.matchStatus === "COMPLETE" || m.completionStatus === "COMPLETE")
    : matches.filter((m) => m.matchStatus !== "COMPLETE")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <Zap className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white">Importar desde Genius Sports</h2>
            <p className="text-xs text-neutral-400">Traé datos en vivo y autocompletá el diseño. Todo queda editable después.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/5 px-5 py-2">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  tab === t.key
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:text-neutral-200",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : tab === "match-pre" || tab === "match-final" ? (
            filteredMatches.length === 0 ? (
              <div className="text-center text-sm text-neutral-400">
                No hay partidos {tab === "match-final" ? "jugados" : "programados"} para esta liga.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMatches.slice(0, 30).map((m) => {
                  const home = (m.competitors || []).find((c: any) => c.isHomeCompetitor === 1) || m.competitors?.[0]
                  const away = (m.competitors || []).find((c: any) => c.isHomeCompetitor === 0) || m.competitors?.[1]
                  const venue = typeof m.venueName === "string" ? m.venueName : (m.venue?.venueName || "")
                  return (
                    <button
                      key={m.matchId}
                      onClick={() => pickMatch(m, tab === "match-final")}
                      className="flex w-full items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-3 text-left transition hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="flex flex-1 items-center gap-2 text-sm">
                        <span className="font-semibold text-white">{home?.competitorName || "—"}</span>
                        {tab === "match-final" && (
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-white">
                            {home?.scoreString || "0"}–{away?.scoreString || "0"}
                          </span>
                        )}
                        <span className="text-neutral-500">vs</span>
                        <span className="font-semibold text-white">{away?.competitorName || "—"}</span>
                      </div>
                      <div className="text-right text-xs text-neutral-400">
                        <div>{formatDateLabel(m.matchTime || "")}</div>
                        {venue && <div className="truncate max-w-[180px]">{venue}</div>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          ) : tab === "standings" ? (
            <div>
              <button
                onClick={pickStandings}
                disabled={standings.length === 0}
                className="mb-3 w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Insertar tabla de posiciones ({standings.length} equipos)
              </button>
              <div className="space-y-1 text-xs">
                {standings.slice(0, 15).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded bg-white/5 px-3 py-2 text-neutral-300">
                    <span className="w-6 text-right font-semibold text-amber-400">{s.rank ?? i + 1}</span>
                    <span className="flex-1 font-medium text-white">{s.teamName || s.competitorName || s.name}</span>
                    <span className="text-neutral-400">{s.wins ?? 0}–{s.losses ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={pickLeaders}
                disabled={leaders.length === 0}
                className="mb-3 w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Insertar top 5 líderes (puntos)
              </button>
              <div className="space-y-1 text-xs">
                {leaders.slice(0, 10).map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded bg-white/5 px-3 py-2 text-neutral-300">
                    <span className="w-6 text-right font-semibold text-amber-400">{i + 1}</span>
                    <span className="flex-1 font-medium text-white">
                      {p.playerName || `${p.firstName || ""} ${p.familyName || ""}`.trim() || "—"}
                    </span>
                    <span className="text-neutral-400">{p.teamCode || ""}</span>
                    <span className="w-12 text-right font-mono text-white">{p.value ?? p.points ?? ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
