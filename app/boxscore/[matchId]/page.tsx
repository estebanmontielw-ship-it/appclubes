"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Printer } from "lucide-react"

interface PlayerRow {
  number: string
  name: string
  min: string | number
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

function fmtMin(raw: string | number): string {
  if (raw === "–" || raw === "" || raw == null) return "–"
  const n = typeof raw === "string" ? parseFloat(raw) : raw
  if (isNaN(n) || n === 0) return "–"
  const m = Math.floor(n)
  const s = Math.round((n - m) * 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function pct(made: number, att: number) {
  if (!att) return ""
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

const TH = "py-1 px-1 font-bold text-right text-[9px] tracking-wide"
const TD = "py-0.5 px-1 text-right tabular-nums text-[10px]"
const TD_LEFT = "py-0.5 pr-2 text-[10px]"

function TeamTable({ rows, name, logo, color, score }: {
  rows: PlayerRow[]
  name: string
  logo: string | null
  color: string
  score: number | null
}) {
  const t = totals(rows)
  const starters = rows.filter(r => r.starter)
  const bench = rows.filter(r => !r.starter)

  const PlayerRow = ({ r, shade }: { r: PlayerRow; shade?: boolean }) => (
    <tr className={shade ? "bg-gray-50/60" : ""}>
      <td className={`${TD_LEFT} pl-1 text-gray-400 font-mono text-[9px] w-5`}>{r.number}</td>
      <td className={`${TD_LEFT} font-semibold text-gray-900 min-w-[110px]`}>
        {r.name}
        {r.captain && <span className="ml-1 text-[8px] text-gray-400 font-normal">(C)</span>}
      </td>
      <td className={`${TD} text-gray-500`}>{fmtMin(r.min)}</td>
      <td className={`${TD} font-black text-gray-900 text-[11px]`}>{r.pts}</td>
      <td className={`${TD} text-gray-600`}>{r.fg2m}/{r.fg2a}</td>
      <td className={`${TD} text-gray-600`}>{r.fg3m}/{r.fg3a}</td>
      <td className={`${TD} text-gray-600`}>{r.ftm}/{r.fta}</td>
      <td className={TD}>{r.ro}</td>
      <td className={TD}>{r.rd}</td>
      <td className={`${TD} font-semibold`}>{r.reb}</td>
      <td className={TD}>{r.ast}</td>
      <td className={TD}>{r.stl}</td>
      <td className={TD}>{r.blk}</td>
      <td className={TD}>{r.to}</td>
      <td className={TD}>{r.pf}</td>
      <td className={`${TD} font-semibold`} style={{ color: r.eff > 0 ? color : r.eff < 0 ? "#ef4444" : undefined }}>{r.eff}</td>
    </tr>
  )

  return (
    <div className="team-section mb-4 print:mb-2">
      {/* Team header */}
      <div className="flex items-center gap-2.5 mb-1.5 pb-1.5 border-b-2" style={{ borderColor: color }}>
        {logo && <img src={logo} alt="" className="h-8 w-8 print:h-6 print:w-6 object-contain shrink-0" />}
        <p className="flex-1 font-black text-sm print:text-xs text-gray-900 uppercase tracking-wide">{name}</p>
        {score !== null && (
          <span className="text-2xl print:text-xl font-black tabular-nums" style={{ color }}>{score}</span>
        )}
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-gray-400 border-b border-gray-200">
              <th className={`text-left py-1 pr-2 text-[9px] font-bold w-5`}>#</th>
              <th className={`text-left py-1 pr-2 text-[9px] font-bold min-w-[110px]`}>JUGADOR</th>
              <th className={`${TH} text-gray-500`}>MIN</th>
              <th className={`${TH} text-gray-900`}>PTS</th>
              <th className={TH}>2P</th>
              <th className={TH}>3P</th>
              <th className={TH}>TL</th>
              <th className={TH}>RO</th>
              <th className={TH}>RD</th>
              <th className={TH}>REB</th>
              <th className={TH}>ASI</th>
              <th className={TH}>ROB</th>
              <th className={TH}>TAP</th>
              <th className={TH}>PER</th>
              <th className={TH}>FP</th>
              <th className={TH}>EF</th>
            </tr>
          </thead>
          <tbody>
            {starters.length > 0 ? (
              <>
                <tr><td colSpan={16} className="py-0.5 pl-1 text-[8px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Titulares</td></tr>
                {starters.map((r, i) => <PlayerRow key={i} r={r} shade={i % 2 === 1} />)}
                {bench.length > 0 && (
                  <>
                    <tr><td colSpan={16} className="py-0.5 pl-1 text-[8px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 border-t border-t-gray-200">Suplentes</td></tr>
                    {bench.map((r, i) => <PlayerRow key={i} r={r} shade={i % 2 === 1} />)}
                  </>
                )}
              </>
            ) : (
              // No starter info available — show all players flat
              rows.map((r, i) => <PlayerRow key={i} r={r} shade={i % 2 === 1} />)
            )}
            {/* Totals */}
            <tr className="font-black text-gray-900 border-t-2 border-gray-300">
              <td colSpan={2} className="py-1 pl-1 text-[9px] uppercase tracking-wide">TOTALES</td>
              <td className={`${TD} text-gray-500`}>–</td>
              <td className={`${TD} text-[12px]`}>{t.pts}</td>
              <td className={`${TD} text-[9px]`}>{t.fg2m}/{t.fg2a}<br /><span className="font-normal text-gray-400">{pct(t.fg2m,t.fg2a)}</span></td>
              <td className={`${TD} text-[9px]`}>{t.fg3m}/{t.fg3a}<br /><span className="font-normal text-gray-400">{pct(t.fg3m,t.fg3a)}</span></td>
              <td className={`${TD} text-[9px]`}>{t.ftm}/{t.fta}<br /><span className="font-normal text-gray-400">{pct(t.ftm,t.fta)}</span></td>
              <td className={TD}>{t.ro}</td>
              <td className={TD}>{t.rd}</td>
              <td className={TD}>{t.reb}</td>
              <td className={TD}>{t.ast}</td>
              <td className={TD}>{t.stl}</td>
              <td className={TD}>{t.blk}</td>
              <td className={TD}>{t.to}</td>
              <td className={TD}>{t.pf}</td>
              <td className={TD}>{t.eff}</td>
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

  const homeId    = searchParams.get("homeId") ?? ""
  const awayId    = searchParams.get("awayId") ?? ""
  const homeName  = searchParams.get("homeName") ?? "Local"
  const awayName  = searchParams.get("awayName") ?? "Visitante"
  const homeSigla = searchParams.get("homeSigla") ?? ""
  const awaySigla = searchParams.get("awaySigla") ?? ""
  const homeLogo  = searchParams.get("homeLogo")
  const awayLogo  = searchParams.get("awayLogo")
  const homeScore = searchParams.get("homeScore")
  const awayScore = searchParams.get("awayScore")
  const venue     = searchParams.get("venue") ?? ""
  const date      = searchParams.get("date") ?? ""
  const comp      = searchParams.get("comp") ?? ""

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
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
          }
          @page {
            size: A4 landscape;
            margin: 0.6cm 0.8cm;
          }
          .boxscore-page {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .match-header {
            margin-bottom: 4px !important;
            padding-bottom: 4px !important;
          }
          .team-section {
            margin-bottom: 4px !important;
          }
          table td, table th {
            padding-top: 1px !important;
            padding-bottom: 1px !important;
          }
        }
        body { font-family: 'Source Sans 3', system-ui, sans-serif; background: white; }
      `}</style>

      <div className="boxscore-page max-w-[1100px] mx-auto p-4 sm:p-6 bg-white min-h-screen print:min-h-0">

        {/* Print button */}
        <div className="no-print flex justify-end mb-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </button>
        </div>

        {/* Match header */}
        <div className="match-header border-b-4 pb-3 mb-4 print:mb-2" style={{ borderColor: compColor }}>
          {/* Competition info */}
          <div className="flex items-center gap-2 mb-2">
            <img src="/favicon-cpb.png" alt="CPB" className="h-7 w-7 object-contain" />
            <div className="flex-1">
              <p className="font-black text-[10px] uppercase tracking-widest" style={{ color: compColor }}>{compLabel}</p>
              {(date || venue) && (
                <p className="text-[10px] text-gray-400">{date}{date && venue ? " · " : ""}{venue}</p>
              )}
            </div>
            <p className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">Box Score Oficial</p>
          </div>

          {/* Scoreboard */}
          <div className="flex items-center gap-2">
            {/* Home */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {homeLogo && <img src={homeLogo} alt="" className="h-10 w-10 print:h-8 print:w-8 object-contain shrink-0" />}
              <div className="min-w-0">
                <p className="font-black text-sm print:text-xs text-gray-900 leading-tight truncate">{homeName}</p>
                {homeSigla && <p className="text-[10px] text-gray-400 font-bold">{homeSigla}</p>}
              </div>
            </div>

            {/* Score + quarters */}
            <div className="text-center shrink-0 px-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl print:text-2xl font-black tabular-nums text-gray-900">{homeScore ?? "–"}</span>
                <span className="text-lg text-gray-300 font-light">–</span>
                <span className="text-3xl print:text-2xl font-black tabular-nums text-gray-900">{awayScore ?? "–"}</span>
              </div>
              {periods.length > 0 && (
                <div className="flex gap-2 justify-center mt-0.5">
                  {periods.map((p, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[8px] text-gray-400 font-bold">{i < 4 ? `Q${i+1}` : `OT${i-3}`}</div>
                      <div className="text-[10px] font-black tabular-nums text-gray-700">{p.home}–{p.away}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex items-center gap-2 flex-1 justify-end min-w-0 text-right">
              <div className="min-w-0">
                <p className="font-black text-sm print:text-xs text-gray-900 leading-tight truncate">{awayName}</p>
                {awaySigla && <p className="text-[10px] text-gray-400 font-bold">{awaySigla}</p>}
              </div>
              {awayLogo && <img src={awayLogo} alt="" className="h-10 w-10 print:h-8 print:w-8 object-contain shrink-0" />}
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Cargando estadísticas...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="text-center py-12 text-gray-400 text-sm">{error}</div>
        )}

        {data && !loading && (
          <>
            <TeamTable rows={data.home} name={homeName} logo={homeLogo ?? null} color={compColor} score={homeScore ? Number(homeScore) : null} />
            <TeamTable rows={data.away} name={awayName} logo={awayLogo ?? null} color={compColor} score={awayScore ? Number(awayScore) : null} />

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-300 no-print">
              <p>Estadísticas oficiales vía Genius Sports · cpb.com.py</p>
              <p>MIN = minutos · PER = pérdidas · FP = faltas personales · EF = eficiencia</p>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100 hidden print:flex items-center justify-between text-[8px] text-gray-300">
              <p>Estadísticas oficiales vía Genius Sports · cpb.com.py</p>
              <p>MIN · PTS · 2P · 3P · TL · RO · RD · REB · ASI · ROB · TAP · PER (pérdidas) · FP (faltas) · EF</p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
