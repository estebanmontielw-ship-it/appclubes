"use client"


import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LigaKey } from "../_lib/themes"
import type { MatchData } from "./GeniusImportPanel"

interface Props {
  liga: LigaKey
  onApplyMatch: (data: MatchData, withScore: boolean) => void
  onApplyStandings: (rows: any[]) => void
  onApplyLeaders: (rows: any[]) => void
}

type FilterTab = "proximos" | "jugados"

function formatDate(iso: string) {
  if (!iso) return ""
  const [datePart, timePart] = iso.split(" ")
  if (!datePart) return ""
  const [, m, d] = datePart.split("-")
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
  const date = `${parseInt(d, 10)} ${months[Number(m) - 1]}`
  const time = (timePart || "").slice(0, 5)
  return time ? `${date} · ${time} hs` : date
}

function ligaLabel(l: LigaKey) {
  return ({ lnb: "LNB APERTURA 2026", lnbf: "LNBF APERTURA 2026", u22m: "U22 MASC 2026", u22f: "U22 FEM 2026" } as Record<LigaKey, string>)[l]
}

export default function MatchesPanel({ liga, onApplyMatch, onApplyStandings, onApplyLeaders }: Props) {
  const [tab, setTab] = useState<FilterTab>("proximos")
  const [search, setSearch] = useState("")
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [extraTab, setExtraTab] = useState<"partidos" | "tabla" | "lideres">("partidos")
  const [standings, setStandings] = useState<any[]>([])
  const [leaders, setLeaders] = useState<any[]>([])

  const loadMatches = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/genius/matches?liga=${liga}`)
      const d = await res.json()
      setMatches(Array.isArray(d?.data) ? d.data : [])
    } catch {
      setMatches([])
    } finally {
      setLoading(false)
    }
  }, [liga])

  const loadStandings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/genius/standings?liga=${liga}`)
      const d = await res.json()
      setStandings(Array.isArray(d?.data) ? d.data : [])
    } catch {
      setStandings([])
    } finally {
      setLoading(false)
    }
  }, [liga])

  const loadLeaders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/genius/leaders?liga=${liga}&stat=points`)
      const d = await res.json()
      setLeaders(Array.isArray(d?.data) ? d.data : [])
    } catch {
      setLeaders([])
    } finally {
      setLoading(false)
    }
  }, [liga])

  useEffect(() => {
    if (extraTab === "partidos") loadMatches()
    else if (extraTab === "tabla") loadStandings()
    else loadLeaders()
  }, [extraTab, loadMatches, loadStandings, loadLeaders])

  const filtered = useMemo(() => {
    const base = tab === "jugados"
      ? matches.filter((m: any) => m.matchStatus === "COMPLETE" || m.completionStatus === "COMPLETE")
      : matches.filter((m: any) => m.matchStatus !== "COMPLETE")
    const q = search.trim().toLowerCase()
    if (!q) return base
    return base.filter((m: any) => {
      const home = (m.competitors || []).find((c: any) => c.isHomeCompetitor === 1) || m.competitors?.[0]
      const away = (m.competitors || []).find((c: any) => c.isHomeCompetitor === 0) || m.competitors?.[1]
      return (
        (home?.competitorName || "").toLowerCase().includes(q) ||
        (away?.competitorName || "").toLowerCase().includes(q)
      )
    })
  }, [matches, tab, search])

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function pickMatch(m: any) {
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
      homeScore: tab === "jugados" ? (home?.scoreString ? parseInt(home.scoreString, 10) : null) : null,
      awayScore: tab === "jugados" ? (away?.scoreString ? parseInt(away.scoreString, 10) : null) : null,
      dateLabel: formatDate(m.matchTime || "").toUpperCase(),
      venue: String(venue || "").toUpperCase(),
      ligaLabel: ligaLabel(liga),
    }
    onApplyMatch(data, tab === "jugados")
  }

  return (
    <div className="space-y-3">
      {/* Sub-tabs partidos / tabla / líderes */}
      <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
        {([
          ["partidos", "Partidos"],
          ["tabla", "Tabla"],
          ["lideres", "Líderes"],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setExtraTab(k)}
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition",
              extraTab === k ? "bg-white text-neutral-900" : "text-neutral-300 hover:bg-white/5",
            )}
          >{l}</button>
        ))}
      </div>

      {extraTab === "partidos" && (
        <>
          {/* Toggle próximos / jugados */}
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Partidos · {ligaLabel(liga)}
            </h3>
            <div className="flex items-center gap-0.5 rounded-full bg-white/5 p-0.5">
              <button
                onClick={() => setTab("proximos")}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium transition",
                  tab === "proximos" ? "bg-indigo-500 text-white" : "text-neutral-400",
                )}
              >Próximos</button>
              <button
                onClick={() => setTab("jugados")}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium transition",
                  tab === "jugados" ? "bg-indigo-500 text-white" : "text-neutral-400",
                )}
              >Jugados</button>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por equipo..."
              className="w-full rounded-md border border-white/10 bg-white/5 py-1.5 pl-7 pr-2 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-white/30"
            />
          </div>

          {/* Lista */}
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-neutral-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-neutral-500">
              No hay partidos {tab === "jugados" ? "jugados" : "programados"}.
            </div>
          ) : (
            <div className="space-y-1 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
              {filtered.map((m: any) => {
                const home = (m.competitors || []).find((c: any) => c.isHomeCompetitor === 1) || m.competitors?.[0]
                const away = (m.competitors || []).find((c: any) => c.isHomeCompetitor === 0) || m.competitors?.[1]
                const id = String(m.matchId)
                const isSel = selected.has(id)
                return (
                  <div
                    key={id}
                    className={cn(
                      "group flex items-center gap-1.5 rounded-md border px-2 py-1.5 transition",
                      isSel
                        ? "border-indigo-400/40 bg-indigo-500/10"
                        : "border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/5",
                    )}
                  >
                    <button
                      onClick={() => toggle(id)}
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        isSel ? "border-indigo-400 bg-indigo-500 text-white" : "border-white/20 hover:border-white/40",
                      )}
                    >
                      {isSel && <Check className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => pickMatch(m)}
                      className="flex-1 text-left"
                      title="Click para aplicar al diseño"
                    >
                      <div className="flex items-center gap-1 text-[11px]">
                        {home?.images?.logo?.T1?.url && (
                          <img src={home.images.logo.T1.url} alt="" className="h-3.5 w-3.5 object-contain" />
                        )}
                        <span className="font-semibold text-white truncate max-w-[70px]">{home?.competitorName || "—"}</span>
                        {tab === "jugados" && (
                          <span className="ml-0.5 rounded bg-white/10 px-1 text-[9px] font-mono text-white">
                            {home?.scoreString || "0"}–{away?.scoreString || "0"}
                          </span>
                        )}
                        <span className="text-neutral-500 px-0.5">vs</span>
                        <span className="font-semibold text-white truncate max-w-[70px]">{away?.competitorName || "—"}</span>
                        {away?.images?.logo?.T1?.url && (
                          <img src={away.images.logo.T1.url} alt="" className="h-3.5 w-3.5 object-contain" />
                        )}
                      </div>
                      <div className="text-[9px] text-neutral-400 mt-0.5">
                        {formatDate(m.matchTime || "")}
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {selected.size > 0 && (
            <button
              onClick={() => {
                const first = matches.find((m: any) => selected.has(String(m.matchId)))
                if (first) pickMatch(first)
              }}
              className="w-full rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Aplicar primer seleccionado ({selected.size})
            </button>
          )}
        </>
      )}

      {extraTab === "tabla" && (
        <>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Posiciones · {ligaLabel(liga)}
          </h3>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-neutral-500" /></div>
          ) : (
            <>
              <button
                onClick={() => onApplyStandings(standings)}
                className="w-full rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                disabled={standings.length === 0}
              >
                Aplicar tabla al diseño
              </button>
              <div className="space-y-0.5 max-h-[calc(100vh-320px)] overflow-y-auto text-[10px]">
                {standings.slice(0, 15).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1">
                    <span className="w-4 text-right font-semibold text-amber-400">{s.rank ?? i + 1}</span>
                    <span className="flex-1 truncate font-medium text-white">{s.teamName || s.competitorName || s.name}</span>
                    <span className="text-neutral-400">{s.wins ?? 0}–{s.losses ?? 0}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {extraTab === "lideres" && (
        <>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Top anotadores · {ligaLabel(liga)}
          </h3>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-neutral-500" /></div>
          ) : (
            <>
              <button
                onClick={() => onApplyLeaders(leaders)}
                className="w-full rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                disabled={leaders.length === 0}
              >
                Aplicar top 5 al diseño
              </button>
              <div className="space-y-0.5 max-h-[calc(100vh-320px)] overflow-y-auto text-[10px]">
                {leaders.slice(0, 10).map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1">
                    <span className="w-4 text-right font-semibold text-amber-400">{i + 1}</span>
                    <span className="flex-1 truncate font-medium text-white">
                      {p.playerName || `${p.firstName || ""} ${p.familyName || ""}`.trim() || "—"}
                    </span>
                    <span className="text-neutral-500">{p.teamCode || ""}</span>
                    <span className="w-8 text-right font-mono text-white">{p.value ?? p.points ?? ""}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
