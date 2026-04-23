"use client"

import { cn } from "@/lib/utils"
import type { V3Theme } from "../_lib/themes"
import { PATTERN_LIST, PATTERNS, patternDataUrl, type PatternKey } from "../_lib/patterns"

interface Props {
  value: PatternKey
  alpha: number
  theme: V3Theme
  onChange: (key: PatternKey) => void
  onAlphaChange: (a: number) => void
}

export default function BackgroundPanel({ value, alpha, theme, onChange, onAlphaChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Patrón de fondo
        </h3>
        <p className="text-[10px] text-neutral-500">Se aplica sobre el gradiente del tema.</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {PATTERN_LIST.map((k) => {
          const p = PATTERNS[k]
          const isActive = value === k
          const dataUrl = k === "none" ? "" : patternDataUrl(k, theme.fg, 0.3)
          return (
            <button
              key={k}
              onClick={() => onChange(k)}
              className={cn(
                "group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-md border p-1.5 text-[9px] transition overflow-hidden",
                isActive
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-neutral-400 hover:border-white/20 hover:text-white",
              )}
            >
              {/* bg preview */}
              <div
                className="absolute inset-0"
                style={{
                  background: theme.bgGradient || theme.bg,
                }}
              />
              {dataUrl && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${dataUrl})`,
                    backgroundRepeat: "repeat",
                    backgroundSize: `${Math.min(p.tileSize, 40)}px`,
                  }}
                />
              )}
              <span className="relative z-10 rounded bg-black/50 px-1 py-0.5 font-medium backdrop-blur-sm">
                {p.label}
              </span>
            </button>
          )
        })}
      </div>

      {value !== "none" && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Intensidad
            </span>
            <span className="text-[10px] font-mono text-neutral-500">{Math.round(alpha * 100)}%</span>
          </div>
          <input
            type="range"
            min="2"
            max="40"
            value={Math.round(alpha * 100)}
            onChange={(e) => onAlphaChange(parseInt(e.target.value, 10) / 100)}
            className="w-full accent-indigo-500"
          />
        </div>
      )}
    </div>
  )
}
