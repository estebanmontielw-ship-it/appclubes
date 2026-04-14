"use client"

import { useState } from "react"
import LNBStandings, { type StandingRow, type LeaderEntry } from "@/components/website/LNBStandings"

interface Props {
  standings: StandingRow[]
  scoringLeaders: LeaderEntry[]
  reboundsLeaders: LeaderEntry[]
  assistsLeaders: LeaderEntry[]
  error: string | null
  showCompetitionSwitch?: boolean
}

interface U22FData {
  standings: StandingRow[]
  scoringLeaders: LeaderEntry[]
  reboundsLeaders: LeaderEntry[]
  assistsLeaders: LeaderEntry[]
  competitionLabel: string
}

export default function PosicionesClient({
  standings,
  scoringLeaders,
  reboundsLeaders,
  assistsLeaders,
  error,
  showCompetitionSwitch = false,
}: Props) {
  const [activeComp, setActiveComp] = useState<"lnb" | "u22f">("lnb")
  const [u22fData, setU22fData] = useState<U22FData | null>(null)
  const [u22fLoading, setU22fLoading] = useState(false)

  async function handleSelectComp(key: "lnb" | "u22f") {
    if (key === activeComp) return
    if (key === "lnb") { setActiveComp("lnb"); return }
    if (u22fData) { setActiveComp("u22f"); return }
    setU22fLoading(true)
    try {
      const res = await fetch("/api/website/posiciones-u22f", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setU22fData({
        standings: data.standings ?? [],
        scoringLeaders: data.scoringLeaders ?? [],
        reboundsLeaders: data.reboundsLeaders ?? [],
        assistsLeaders: data.assistsLeaders ?? [],
        competitionLabel: data.competition?.name ?? "U22 Femenino",
      })
      setActiveComp("u22f")
    } catch {
      // ignore — keep LNB
    } finally {
      setU22fLoading(false)
    }
  }

  const active = activeComp === "lnb"
    ? { standings, scoringLeaders, reboundsLeaders, assistsLeaders, label: "LNB 2026" }
    : {
        standings: u22fData?.standings ?? [],
        scoringLeaders: u22fData?.scoringLeaders ?? [],
        reboundsLeaders: u22fData?.reboundsLeaders ?? [],
        assistsLeaders: u22fData?.assistsLeaders ?? [],
        label: u22fData?.competitionLabel ?? "U22 Femenino",
      }

  return (
    <div>
      {showCompetitionSwitch && (
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => handleSelectComp("lnb")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
              activeComp === "lnb"
                ? "bg-[#0a1628] text-white border-[#0a1628] shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
            }`}
          >
            LNB
          </button>
          <button
            onClick={() => handleSelectComp("u22f")}
            disabled={u22fLoading}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
              activeComp === "u22f"
                ? "bg-[#0a1628] text-white border-[#0a1628] shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
            }`}
          >
            {u22fLoading && (
              <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            )}
            U22 Femenino
          </button>
        </div>
      )}

      <LNBStandings
        standings={active.standings}
        scoringLeaders={active.scoringLeaders}
        reboundsLeaders={active.reboundsLeaders}
        assistsLeaders={active.assistsLeaders}
        error={activeComp === "lnb" ? error : null}
        competitionLabel={active.label}
      />
    </div>
  )
}
