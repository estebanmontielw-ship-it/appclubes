"use client"

import { useState } from "react"
import LNBStandings, { type StandingRow } from "@/components/website/LNBStandings"

interface Props {
  standings: StandingRow[]
  error: string | null
  showCompetitionSwitch?: boolean
}

type CompKey = "lnb" | "lnbf" | "u22m" | "u22f"

interface CompData {
  standings: StandingRow[]
  competitionLabel: string
}

const TABS: { key: CompKey; label: string; endpoint: string }[] = [
  { key: "lnb",  label: "LNB",           endpoint: "" },
  { key: "lnbf", label: "LNBF",           endpoint: "/api/website/posiciones-lnbf" },
  { key: "u22m", label: "U22 Masc",      endpoint: "/api/website/posiciones-u22m" },
  { key: "u22f", label: "U22 Fem",       endpoint: "/api/website/posiciones-u22f" },
]

export default function PosicionesClient({ standings, error, showCompetitionSwitch = false }: Props) {
  const [activeComp, setActiveComp] = useState<CompKey>("lnb")
  const [cache, setCache] = useState<Partial<Record<CompKey, CompData>>>({})
  const [loading, setLoading] = useState<CompKey | null>(null)

  async function handleSelectComp(key: CompKey) {
    if (key === activeComp) return
    if (key === "lnb") { setActiveComp("lnb"); return }
    if (cache[key]) { setActiveComp(key); return }

    const tab = TABS.find((t) => t.key === key)!
    setLoading(key)
    try {
      const res = await fetch(tab.endpoint, { cache: "no-store" })
      const data = res.ok ? await res.json() : {}
      setCache((prev) => ({
        ...prev,
        [key]: {
          standings: data.standings ?? [],
          competitionLabel: data.competition?.name ?? tab.label,
        },
      }))
    } catch {
      setCache((prev) => ({ ...prev, [key]: { standings: [], competitionLabel: tab.label } }))
    } finally {
      setLoading(null)
      setActiveComp(key)
    }
  }

  const active: CompData =
    activeComp === "lnb"
      ? { standings, competitionLabel: "LNB 2026" }
      : (cache[activeComp] ?? { standings: [], competitionLabel: TABS.find((t) => t.key === activeComp)!.label })

  return (
    <div>
      {showCompetitionSwitch && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleSelectComp(tab.key)}
              disabled={loading === tab.key}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                activeComp === tab.key
                  ? "bg-[#0a1628] text-white border-[#0a1628] shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
              }`}
            >
              {loading === tab.key && (
                <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <LNBStandings
        standings={active.standings}
        error={activeComp === "lnb" ? error : null}
        competitionLabel={active.competitionLabel}
      />
    </div>
  )
}
