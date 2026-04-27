"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, BarChart2 } from "lucide-react"

interface GameLog {
  matchId: number
  date: string | null
  isHome: boolean
  oppName: string
  oppSigla: string | null
  myScore: number | null
  oppScore: number | null
  result: "W" | "L" | null
  pos: string | null
  min: string | number | null
  pts: number
  lcM: number; lcA: number; lcPct: number | null
  twoM: number; twoA: number; twoPct: number | null
  threeM: number; threeA: number; threePct: number | null
  ftM: number; ftA: number; ftPct: number | null
  rebOff: number; rebDef: number; reb: number
  ast: number
  eff: number | null
  stl: number
  blk: number
  to: number
  fp: number
  fr: number
  plusMinus: number | null
}

function ResultBadge({ result }: { result: "W" | "L" | null }) {
  if (!result) return <span className="text-gray-300">—</span>
  const styles = { W: "bg-green-100 text-green-700", L: "bg-red-100 text-red-600" }
  return <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded-full ${styles[result]}`}>{result}</span>
}

function fmt(val: number | string | null | undefined, dec = 0): string {
  if (val == null) return "—"
  const n = typeof val === "string" ? parseFloat(val) : val
  if (isNaN(n)) return String(val)
  return dec > 0 ? n.toFixed(dec) : String(Math.round(n))
}

function pct(val: number | null | undefined): string {
  if (val == null) return "—"
  return `${val.toFixed(1)}%`
}

function fmtMin(val: string | number | null): string {
  if (val == null) return "—"
  const s = String(val)
  // If it's "MM:SS" format, take first 5 chars; if decimal/integer, show as-is
  return s.includes(":") ? s.slice(0, 5) : s.slice(0, 5)
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
function fmtDate(d: string | null): string {
  if (!d) return "—"
  const parts = d.split("-")
  if (parts.length < 3) return d
  const day = parseInt(parts[2])
  const monthIdx = parseInt(parts[1]) - 1
  const monthName = MONTHS[monthIdx] ?? ""
  return `${day} ${monthName}`
}

export default function PartidosPage({ params }: { params: { personId: string } }) {
  const { personId } = params
  const [games, setGames] = useState<GameLog[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/website/jugador-partidos?personId=${personId}`)
      .then(r => {
        if (!r.ok) throw new Error("error")
        return r.json()
      })
      .then(d => setGames(Array.isArray(d.games) ? d.games : []))
      .catch(() => { setGames([]); setError(true) })
      .finally(() => setLoading(false))
  }, [personId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
        <p className="text-sm text-gray-400">Cargando registro de partidos…</p>
      </div>
    )
  }

  return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        <Link
          href={`/jugador/${personId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Perfil del jugador
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#0a1628]">Registro de partidos</h1>
          <p className="text-sm text-gray-400 mt-1">Línea estadística por partido · LNB 2026</p>
        </div>

        {!games || games.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-14 text-center">
            <BarChart2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-500 font-semibold text-sm">
              {error ? "No se pudo cargar el registro." : "Sin partidos registrados aún."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="text-[11px] w-full whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-black uppercase tracking-wide text-gray-400">
                    <th className="sticky left-0 bg-gray-50 z-10 text-left px-3 py-2.5 min-w-[110px]">Partido</th>
                    <th className="text-center px-2 py-2.5">Res</th>
                    <th className="text-center px-2 py-2.5">Pos</th>
                    <th className="text-center px-2 py-2.5">Min</th>
                    <th className="text-center px-2 py-2.5 text-[#0a1628]">Pts</th>
                    <th className="text-center px-2 py-2.5">LC</th>
                    <th className="text-center px-2 py-2.5">LC%</th>
                    <th className="text-center px-2 py-2.5">2Pts</th>
                    <th className="text-center px-2 py-2.5">2Pts%</th>
                    <th className="text-center px-2 py-2.5">3Pts</th>
                    <th className="text-center px-2 py-2.5">3Pts%</th>
                    <th className="text-center px-2 py-2.5">1Pt</th>
                    <th className="text-center px-2 py-2.5">1Pt%</th>
                    <th className="text-center px-2 py-2.5">RO</th>
                    <th className="text-center px-2 py-2.5">RD</th>
                    <th className="text-center px-2 py-2.5">REB</th>
                    <th className="text-center px-2 py-2.5">As</th>
                    <th className="text-center px-2 py-2.5">PER</th>
                    <th className="text-center px-2 py-2.5">ST</th>
                    <th className="text-center px-2 py-2.5">Blq</th>
                    <th className="text-center px-2 py-2.5">BR</th>
                    <th className="text-center px-2 py-2.5">FP</th>
                    <th className="text-center px-2 py-2.5">FR</th>
                    <th className="text-center px-2 py-2.5">+/-</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {games.map((g) => {
                    const pm = g.plusMinus
                    return (
                      <tr key={g.matchId} className="hover:bg-blue-50/30 transition-colors">
                        <td className="sticky left-0 bg-white z-10 px-3 py-2 min-w-[110px]">
                          <div className="font-semibold text-gray-700 leading-tight">
                            {g.isHome ? "vs" : "en"} {g.oppSigla ?? g.oppName}
                          </div>
                          <div className="text-[9px] text-gray-400">{fmtDate(g.date)}</div>
                          {g.myScore != null && g.oppScore != null && (
                            <div className="text-[9px] text-gray-500 font-semibold tabular-nums">
                              {g.myScore}–{g.oppScore}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center"><ResultBadge result={g.result} /></td>
                        <td className="px-2 py-2 text-center text-gray-500">{g.pos ?? "—"}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{fmtMin(g.min)}</td>
                        <td className="px-2 py-2 text-center font-black text-[#0a1628] tabular-nums">{g.pts}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.lcM}/{g.lcA}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-500">{pct(g.lcPct)}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.twoM}/{g.twoA}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-500">{pct(g.twoPct)}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.threeM}/{g.threeA}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-500">{pct(g.threePct)}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.ftM}/{g.ftA}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-500">{pct(g.ftPct)}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.rebOff}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.rebDef}</td>
                        <td className="px-2 py-2 text-center font-bold tabular-nums text-gray-700">{g.reb}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.ast}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{fmt(g.eff)}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.stl}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.blk}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.to}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.fp}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-gray-600">{g.fr}</td>
                        <td className={`px-2 py-2 text-center font-bold tabular-nums ${pm == null ? "text-gray-300" : pm > 0 ? "text-green-600" : pm < 0 ? "text-red-500" : "text-gray-400"}`}>
                          {pm == null ? "—" : pm > 0 ? `+${pm}` : String(pm)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 text-center">
              LC = lanzamientos de campo · RO/RD = rebotes of./def. · PER = eficiencia · BR = balón robado · FP/FR = faltas pers./recibidas
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
