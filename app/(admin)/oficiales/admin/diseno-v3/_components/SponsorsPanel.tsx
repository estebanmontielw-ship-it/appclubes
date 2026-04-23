"use client"

import { useRef, useState } from "react"
import { Upload, X, Loader2, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SponsorsConfig {
  sponsors: (string | null)[]   // 5 URLs o null
  scales: number[]               // 5 porcentajes (100 = 100%)
  bg: "white" | "dark"
  show: boolean
}

interface Props {
  value: SponsorsConfig
  onChange: (v: SponsorsConfig) => void
}

export default function SponsorsPanel({ value, onChange }: Props) {
  const [uploading, setUploading] = useState<number | null>(null)
  const inputs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  async function upload(i: number, file: File) {
    setUploading(i)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("bucket", "website")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error("upload failed")
      const data = await res.json()
      const url = data.url || data.publicUrl
      if (url) {
        const next = [...value.sponsors]
        next[i] = url
        onChange({ ...value, sponsors: next })
      }
    } catch (e) {
      console.error(e)
      alert("No se pudo subir el sponsor")
    } finally {
      setUploading(null)
    }
  }

  function removeAt(i: number) {
    const next = [...value.sponsors]
    next[i] = null
    onChange({ ...value, sponsors: next })
  }

  function setScale(i: number, s: number) {
    const next = [...value.scales]
    next[i] = Math.max(30, Math.min(200, s))
    onChange({ ...value, scales: next })
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Sponsors <span className="text-neutral-500 normal-case font-normal">· hasta 5 · PNG transparente</span>
        </h3>
      </div>

      {/* Grid de 5 slots */}
      <div className="grid grid-cols-3 gap-1.5">
        {value.sponsors.map((url, i) => (
          <div key={i} className="relative">
            <input
              ref={inputs[i]}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) upload(i, f)
              }}
            />
            <button
              onClick={() => inputs[i].current?.click()}
              className={cn(
                "flex aspect-[4/3] w-full items-center justify-center rounded-md border text-[9px] font-medium transition overflow-hidden",
                url
                  ? "border-white/15 bg-white"
                  : "border-dashed border-white/15 bg-white/5 text-neutral-500 hover:border-white/30 hover:bg-white/10",
              )}
              disabled={uploading !== null}
            >
              {uploading === i ? (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-600" />
              ) : url ? (
                <img src={url} alt="" className="max-h-full max-w-full object-contain p-1.5" />
              ) : (
                <span className="flex flex-col items-center gap-1">
                  <Upload className="h-3 w-3" />
                  <span>Slot {i + 1}</span>
                </span>
              )}
            </button>
            {url && (
              <button
                onClick={() => removeAt(i)}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                title="Quitar"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
            {url && (
              <div className="mt-1 flex items-center gap-0.5">
                <button onClick={() => setScale(i, value.scales[i] - 10)} className="flex h-4 w-4 items-center justify-center rounded bg-white/10 hover:bg-white/20">
                  <Minus className="h-2.5 w-2.5" />
                </button>
                <span className="flex-1 text-center text-[9px] font-mono text-neutral-400">{value.scales[i]}%</span>
                <button onClick={() => setScale(i, value.scales[i] + 10)} className="flex h-4 w-4 items-center justify-center rounded bg-white/10 hover:bg-white/20">
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Barra clara / oscura */}
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Estilo de barra</div>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => onChange({ ...value, bg: "dark" })}
            className={cn(
              "rounded-md border px-2 py-1.5 text-xs font-medium transition",
              value.bg === "dark"
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/10 bg-white/5 text-neutral-400 hover:text-white",
            )}
          >
            ● Barra oscura
          </button>
          <button
            onClick={() => onChange({ ...value, bg: "white" })}
            className={cn(
              "rounded-md border px-2 py-1.5 text-xs font-medium transition",
              value.bg === "white"
                ? "border-white/30 bg-white text-neutral-900"
                : "border-white/10 bg-white/5 text-neutral-400 hover:text-white",
            )}
          >
            ○ Barra blanca
          </button>
        </div>
      </div>

      {/* Toggle franja */}
      <label className="flex items-start gap-2 rounded-md border border-white/10 bg-white/5 p-2 cursor-pointer hover:bg-white/10">
        <input
          type="checkbox"
          checked={value.show}
          onChange={(e) => onChange({ ...value, show: e.target.checked })}
          className="mt-0.5 h-3.5 w-3.5 accent-indigo-500"
        />
        <div className="flex-1 text-xs">
          <div className="font-semibold text-white">Mostrar franja de sponsors al pie</div>
          <div className="text-[10px] text-neutral-400">Se aplica al insertar la plantilla</div>
        </div>
      </label>
    </div>
  )
}
