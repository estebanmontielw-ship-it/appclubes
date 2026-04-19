"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Printer } from "lucide-react"

interface PlayerRow {
  number: string
  name: string
  min: string
  pts: number
  fg2m: number; fg2a: number
  fg3m: number; fg3a: number
  ftm: number;  fta: number
  ro: number;   rd: number; reb: number
  ast: number;  stl: number; blk: number
  to: number;   pf: number;  eff: number
  starter: boolean
  captain: boolean
}

interface BoxScore {
  matchId: string
  periods: { home: number; away: number }[]
  home: PlayerRow[]
  away: PlayerRow[]
}

function pct(made: number, att: number) {
  if (!att) return "–"
  return Math.round((made / att) * 100) + "%"
}

function totals(rows: PlayerRow[]) {
  const sum = (key: keyof PlayerRow) => rows.reduce((a, r) => a + (Number(r[key]) || 0), 0)
  return {
    pts: sum("pts"), fg2m: sum("fg2m"), fg2a: sum("fg2a"),
    fg3m: sum("fg3m"), fg3a: sum("fg3a"), ftm: sum("ftm"), fta: sum("fta"),
    ro: sum("ro"), rd: sum("rd"), reb: sum("reb"),
    ast: sum("ast"), stl: sum("stl"), blk: sum("blk"),
    to: sum("to"), pf: sum("pf"), eff: sum("eff"),
  }
}

function TeamTable({ rows, name, logo, color, score }: {
  rows: PlayerRow[]
  name: string
  logo: string | null
  color: string
  score: number | null
}) {
  const t = totals(rows)
  return (
    <div className="mb-8">
      {/* Team header */}
      <div className="flex items-center gap-3 mb-3 pb-2 border-b-2" style={{ borderColor: color }}>
        {logo && <img src={logo} alt="" className="h-9 w-9 object-contain" />}
        <div className="flex-1">
          <p className="font-black text-base text-gray-900 leading-tight">{name}</p>
        </div>
        {score !== null && (
          <span className="text-3xl font-black tabular-nums" style={{ color }}>{score}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200">
              <th className="text-left py-1 pr-2 font-bold w-6">#</th>
              <th className="text-left py-1 pr-3 font-bold min-w-[120px]">JUGADOR</th>
              <th className="py-1 px-1 font-bold text-right">MIN</th>
              <th className="py-1 px-1 font-bold text-right text-gray-900">PTS</th>
              <th className="py-1 px-1 font-bold text-right">2P</th>
              <th className="py-1 px-1 font-bold text-right">3P</th>
              <th className="py-1 px-1 font-bold text-right">TL</th>
              <th className="py-1 px-1 font-bold text-right">RO</th>
              <th className="py-1 px-1 font-bold text-right">RD</th>
              <th className="py-1 px-1 font-bold text-right">REB</th>
              <th className="py-1 px-1 font-bold text-right">ASI</th>
              <th className="py-1 px-1 font-bold text-right">ROB</th>
              <th className="py-1 px-1 font-bold text-right">TAP</th>
              <th className="py-1 px-1 font-bold text-right">PER</th>
              <th className="py-1 px-1 font-bold text-right">EF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`border-b border-gray-100 ${r.starter ? "" : "text-gray-500"}`}>
                <td className="py-1 pr-2 text-gray-400 font-mono">{r.number}</td>
                <td className="py-1 pr-3 font-semibold whitespace-nowrap">
                  {r.name}
                  {r.captain && <span className="ml-1 text-[9px] text-gray-400">(C)</span>}
                  {r.starter && <span className="ml-1 text-[9px]" style={{ color }}>●</span>}
                </td>
                <td className="py-1 px-1 text-right tabular-nums">{r.min}</td>
                <td className="py-1 px-1 text-right tabular-nums font-black text-gray-900">{r.pts}</td>
                <td className="py-1 px-1 text-right tabular-nums">{r.fg2m}/{r.fg2a}</td>
                <td className="py-1 px-1 text-right tabular-nums">{r.fg3m}/{r.fg3a}</td>
                <td className="py-1 px-1 text-right tabular-nums">{r.ftm}/{r.fta}</td>
                <td className="py-1 px-1 text-right tabular-nums">{r.ro}</td>
                <td className="py-1 px-1 text-right tabular-nums">{r.rd}</td>
                <td className="py-1 px-1 text-right tabular-nums font-semibold">{r.reb}</td>
                <td className="py-1 px-1 text-right tabular-nums">{r.ast}</td>
                <td className="py-1 px-1 text-right tabular-nums">{r.stl}</td>
                <td className="py-1 px-1 text-right tabular-nums">{r.blk}</td>
                <td className="py-1 px-1 text-right tabular-nums">{r.pf}</td>
                <td className="py-1 px-1 text-right tabular-nums font-semibold">{r.eff}</td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="font-black text-gray-900 border-t-2 border-gray-300 bg-gray-50">
              <td colSpan={2} className="py-1.5 pr-3 text-xs">TOTALES</td>
              <td className="py-1.5 px-1 text-right tabular-nums">–</td>
              <td className="py-1.5 px-1 text-right tabular-nums">{t.pts}</td>
              <td className="py-1.5 px-1 text-right tabular-nums text-[10px]">{t.fg2m}/{t.fg2a}<br/><span className="font-normal text-gray-400">{pct(t.fg2m,t.fg2a)}</span></td>
              <td className="py-1.5 px-1 text-right tabular-nums text-[10px]">{t.fg3m}/{t.fg3a}<br/><span className="font-normal text-gray-400">{pct(t.fg3m,t.fg3a)}</span></td>
              <td className="py-1.5 px-1 text-right tabular-nums text-[10px]">{t.ftm}/{t.fta}<br/><span className="font-normal text-gray-400">{pct(t.ftm,t.fta)}</span></td>
              <td className="py-1.5 px-1 text-right tabular-nums">{t.ro}</td>
              <td className="py-1.5 px-1 text-right tabular-nums">{t.rd}</td>
              <td className="py-1.5 px-1 text-right tabular-nums">{t.reb}</td>
              <td className="py-1.5 px-1 text-right tabular-nums">{t.ast}</td>
              <td className="py-1.5 px-1 text-right tabular-nums">{t.stl}</td>
              <td className="py-1.5 px-1 text-right tabular-nums">{t.blk}</td>
              <td className="py-1.5 px-1 text-right tabular-nums">{t.to}</td>
              <td className="py-1.5 px-1 text-right tabular-nums">{t.pf}</td>
              <td className="py-1.5 px-1 text-right tabular-nums">{t.eff}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function BoxScorePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const matchId = params.matchId as string

  const homeId   = searchParams.get("homeId") ?? ""
  const awayId   = searchParams.get("awayId") ?? ""
  const homeName = searchParams.get("homeName") ?? "Local"
  const awayName = searchParams.get("awayName") ?? "Visitante"
  const homeSigla = searchParams.get("homeSigla") ?? ""
  const awaySigla = searchParams.get("awaySigla") ?? ""
  const homeLogo = searchParams.get("homeLogo")
  const awayLogo = searchParams.get("awayLogo")
  const homeScore = searchParams.get("homeScore")
  const awayScore = searchParams.get("awayScore")
  const venue    = searchParams.get("venue") ?? ""
  const date     = searchParams.get("date") ?? ""
  const comp     = searchParams.get("comp") ?? ""

  const [data, setData] = useState<BoxScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/genius/boxscore/${matchId}?homeId=${homeId}&awayId=${awayId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError("No se pudieron cargar las estadísticas"); setLoading(false) })
  }, [matchId, homeId, awayId])

  const compLabel = comp === "lnb" ? "Liga Nacional de Básquetbol" : comp === "lnbf" ? "Liga Nacional de Básquetbol Femenino" : comp.toUpperCase()
  const compColor = comp === "lnb" ? "#ef4444" : "#ec4899"

  const periods = data?.periods ?? []

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.5cm; size: A4 landscape; }
        }
        body { font-family: 'Source Sans 3', system-ui, sans-serif; background: white; }
      `}</style>

      <div className="max-w-[1100px] mx-auto p-6 sm:p-8 bg-white min-h-screen">

        {/* Print button */}
        <div className="no-print flex justify-end mb-4">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </button>
        </div>

        {/* Header */}
        <div className="border-b-4 pb-4 mb-6" style={{ borderColor: compColor }}>
          <div className="flex items-center gap-2 mb-3">
            <img src="/favicon-cpb.png" alt="CPB" className="h-8 w-8 object-contain" />
            <div>
              <p className="font-black text-xs uppercase tracking-widest" style={{ color: compColor }}>{compLabel}</p>
              {(date || venue) && (
                <p className="text-xs text-gray-400">{date}{date && venue ? " · " : ""}{venue}</p>
              )}
            </div>
            <p className="ml-auto text-[10px] text-gray-300">BOX SCORE OFICIAL</p>
          </div>

          {/* Scoreboard */}
          <div className="flex items-center gap-4">
            {/* Home */}
            <div className="flex items-center gap-2 flex-1">
              {homeLogo && <img src={homeLogo} alt="" className="h-10 w-10 object-contain" />}
              <div>
                <p className="font-black text-sm text-gray-900 leading-tight">{homeName}</p>
                {homeSigla && <p className="text-xs text-gray-400 font-bold">{homeSigla}</p>}
              </div>
            </div>

            {/* Score + periods */}
            <div className="text-center">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black tabular-nums text-gray-900">{homeScore ?? "–"}</span>
                <span className="text-xl text-gray-300 font-light">–</span>
                <span className="text-4xl font-black tabular-nums text-gray-900">{awayScore ?? "–"}</span>
              </div>
              {periods.length > 0 && (
                <div className="flex gap-1 justify-center mt-1">
                  {periods.map((p, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[9px] text-gray-400 font-bold">{i < 4 ? `Q${i+1}` : `OT${i-3}`}</div>
                      <div className="text-[11px] font-black tabular-nums text-gray-700">{p.home}–{p.away}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex items-center gap-2 flex-1 justify-end text-right">
              <div>
                <p className="font-black text-sm text-gray-900 leading-tight">{awayName}</p>
                {awaySigla && <p className="text-xs text-gray-400 font-bold">{awaySigla}</p>}
              </div>
              {awayLogo && <img src={awayLogo} alt="" className="h-10 w-10 object-contain" />}
            </div>
          </div>
        </div>

        {/* Stats */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Cargando estadísticas...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {data && !loading && (
          <>
            <TeamTable
              rows={data.home}
              name={homeName}
              logo={homeLogo ?? null}
              color={compColor}
              score={homeScore ? Number(homeScore) : null}
            />
            <TeamTable
              rows={data.away}
              name={awayName}
              logo={awayLogo ?? null}
              color={compColor}
              score={awayScore ? Number(awayScore) : null}
            />

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-300">
              <p>Estadísticas oficiales vía Genius Sports · cpb.com.py</p>
              <p>● Titular · (C) Capitán</p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
