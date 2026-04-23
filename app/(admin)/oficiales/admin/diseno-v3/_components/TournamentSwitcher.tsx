"use client"

import { cn } from "@/lib/utils"
import type { LigaKey } from "../_lib/themes"

const LIGAS: { key: LigaKey; label: string; sub: string; color: string }[] = [
  { key: "lnb",  label: "LNB",  sub: "Apertura Masc", color: "from-indigo-500 to-violet-600" },
  { key: "lnbf", label: "LNBF", sub: "Apertura Fem",  color: "from-pink-500 to-fuchsia-600" },
  { key: "u22m", label: "U22 M", sub: "Sub 22 Masc",  color: "from-cyan-500 to-blue-600" },
  { key: "u22f", label: "U22 F", sub: "Sub 22 Fem",   color: "from-rose-500 to-orange-500" },
]

interface Props {
  value: LigaKey
  onChange: (v: LigaKey) => void
  compact?: boolean
}

export default function TournamentSwitcher({ value, onChange, compact }: Props) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-full bg-neutral-900/90 p-1 ring-1 ring-white/10 backdrop-blur",
      compact && "gap-0.5 p-0.5",
    )}>
      {LIGAS.map((l) => {
        const active = value === l.key
        return (
          <button
            key={l.key}
            type="button"
            onClick={() => onChange(l.key)}
            className={cn(
              "relative inline-flex flex-col items-start rounded-full px-3 py-1.5 text-xs font-semibold transition",
              compact && "px-2.5 py-1",
              active
                ? "text-white"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            {active && (
              <span
                className={cn(
                  "absolute inset-0 rounded-full bg-gradient-to-r",
                  l.color,
                )}
                aria-hidden="true"
              />
            )}
            <span className="relative leading-tight">{l.label}</span>
            {!compact && (
              <span className="relative text-[10px] font-normal opacity-80 leading-tight">{l.sub}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
