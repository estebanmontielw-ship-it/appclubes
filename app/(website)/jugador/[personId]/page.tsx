import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BarChart2, ListOrdered } from "lucide-react"
import { getAllPlayerStats } from "@/lib/genius-sports"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"

export const revalidate = 600

interface Props {
  params: Promise<{ personId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { personId } = await params
  const pid = parseInt(personId, 10)
  if (isNaN(pid)) return {}
  const { id: competitionId } = await resolveLnbCompetitionIdPublic()
  if (!competitionId) return {}
  const { players } = await getAllPlayerStats(competitionId)
  const player = players.find(p => p.personId === pid)
  if (!player) return {}
  return {
    title: `${player.playerName} | CPB`,
    description: `Estadísticas de ${player.playerName} — ${player.teamName} — LNB 2026`,
  }
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
      <p className="text-[9px] font-black uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-black text-[#0a1628] tabular-nums leading-tight">{value}</p>
      {sub && <p className="text-[9px] text-gray-300 font-semibold mt-0.5">{sub}</p>}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">{children}</p>
  )
}

export default async function JugadorPage({ params }: Props) {
  const { personId } = await params
  const pid = parseInt(personId, 10)
  if (isNaN(pid)) notFound()

  const { id: competitionId } = await resolveLnbCompetitionIdPublic()
  if (!competitionId) notFound()

  const { players } = await getAllPlayerStats(competitionId)
  const player = players.find(p => p.personId === pid)
  if (!player) notFound()

  return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        <Link
          href="/estadisticas"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Estadísticas
        </Link>

        {/* Player header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 mb-6">
          {player.photoUrl
            ? <img src={player.photoUrl} alt={player.playerName} className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 shrink-0" />
            : player.teamLogo
              ? <img src={player.teamLogo} alt={player.teamName} className="w-20 h-20 rounded-full object-contain bg-gray-50 border-2 border-gray-100 p-2 shrink-0" />
              : <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-xl font-black text-gray-300 shrink-0">
                  {(player.teamSigla ?? player.teamName).slice(0, 2).toUpperCase()}
                </div>
          }
          <div className="min-w-0">
            <h1 className="text-xl font-black text-[#0a1628] leading-tight truncate">{player.playerName}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              {player.teamLogo && (
                <img src={player.teamLogo} alt="" className="w-4 h-4 object-contain shrink-0" />
              )}
              <span className="text-sm font-semibold text-gray-500 truncate">{player.teamName}</span>
            </div>
            <span className="inline-block mt-2 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
              {player.games} {player.games === 1 ? "partido jugado" : "partidos jugados"} · LNB 2026
            </span>
          </div>
        </div>

        {/* Ver registro completo button */}
        {player.games > 0 && (
          <Link
            href={`/jugador/${pid}/partidos`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0a1628] text-white text-sm font-bold hover:bg-[#0a1628]/90 transition-colors mb-6"
          >
            <ListOrdered className="w-4 h-4" />
            Ver registro completo de juegos
          </Link>
        )}

        {player.games === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-12 text-center">
            <BarChart2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-500 font-semibold text-sm">Sin estadísticas disponibles aún.</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Promedios por partido */}
            <div>
              <SectionLabel>Promedios por partido</SectionLabel>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                <StatBox label="PTS/p" value={player.ptsAvg.toFixed(1)} />
                <StatBox label="REB/p" value={player.rebAvg.toFixed(1)} />
                <StatBox label="AST/p" value={player.astAvg.toFixed(1)} />
                <StatBox label="ROB/p" value={player.stlAvg.toFixed(1)} />
                <StatBox label="TAP/p" value={player.blkAvg.toFixed(1)} />
                <StatBox label="PÉR/p" value={player.toAvg.toFixed(1)} />
                <StatBox label="MIN/p" value={player.minAvg.toFixed(1)} />
                <StatBox label="EFF/p" value={player.effAvg.toFixed(1)} />
              </div>
            </div>

            {/* Porcentajes de tiro */}
            <div>
              <SectionLabel>Porcentajes de tiro</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                <StatBox
                  label="% Campo"
                  value={player.fgPct != null ? `${player.fgPct.toFixed(1)}%` : "—"}
                  sub={player.fga > 0 ? `${player.fgm}/${player.fga}` : undefined}
                />
                <StatBox
                  label="% Triples"
                  value={player.threePtPct != null ? `${player.threePtPct.toFixed(1)}%` : "—"}
                  sub={player.threePtA > 0 ? `${player.threePtM}/${player.threePtA}` : undefined}
                />
                <StatBox
                  label="% Tiros libres"
                  value={player.ftPct != null ? `${player.ftPct.toFixed(1)}%` : "—"}
                  sub={player.fta > 0 ? `${player.ftm}/${player.fta}` : undefined}
                />
              </div>
            </div>

            {/* Totales en la temporada */}
            <div>
              <SectionLabel>Totales en la temporada</SectionLabel>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                <StatBox label="PTS" value={String(player.pts)} />
                <StatBox label="REB" value={String(player.reb)} />
                <StatBox label="AST" value={String(player.ast)} />
                <StatBox label="ROB" value={String(player.stl)} />
                <StatBox label="TAP" value={String(player.blk)} />
                <StatBox label="PÉR" value={String(player.to)} />
                <StatBox label="MIN" value={String(Math.round(player.min))} />
                <StatBox label="EFF" value={String(player.eff)} />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 italic text-center">
                Sumado de {player.games} {player.games === 1 ? "partido" : "partidos"} disputados en la temporada.
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
