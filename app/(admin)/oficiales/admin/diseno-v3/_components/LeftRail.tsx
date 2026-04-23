"use client"


import { useState, useRef } from "react"
import { LayoutTemplate, Type, Shapes, Image as ImageIcon, Layers, Zap, Upload, Loader2, Square, Circle as CircleIcon, Minus, Palette, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { TEMPLATES, type TemplateKey } from "../_lib/templates"
import { THEMES, type V3Theme, type LigaKey } from "../_lib/themes"
import type { PatternKey } from "../_lib/patterns"
import TemplateThumbnail from "./TemplateThumbnail"
import MatchesPanel from "./MatchesPanel"
import SponsorsPanel, { type SponsorsConfig } from "./SponsorsPanel"
import BackgroundPanel from "./BackgroundPanel"
import type { MatchData } from "./GeniusImportPanel"

type TabKey = "templates" | "text" | "shapes" | "assets" | "genius" | "sponsors" | "bg" | "layers"

interface Props {
  liga: LigaKey
  theme: V3Theme
  onInsertTemplate: (key: TemplateKey) => void
  onInsertText: (style: "title" | "subtitle" | "body") => void
  onInsertShape: (shape: "rect" | "circle" | "line") => void
  onInsertImage: (url: string) => void
  onSelectTheme: (theme: V3Theme) => void
  onApplyMatch: (data: MatchData, withScore: boolean) => void
  onApplyStandings: (rows: any[]) => void
  onApplyLeaders: (rows: any[]) => void
  sponsorsConfig: SponsorsConfig
  onSponsorsChange: (v: SponsorsConfig) => void
  patternKey: PatternKey
  patternAlpha: number
  onPatternChange: (k: PatternKey) => void
  onPatternAlphaChange: (a: number) => void
  layers: any[]
  selectedId: string | null
  onSelectLayer: (id: string) => void
  onToggleLayerVisibility: (id: string) => void
  onToggleLayerLock: (id: string) => void
  onDeleteLayer: (id: string) => void
}

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "templates", label: "Plantillas", icon: LayoutTemplate },
  { key: "genius",    label: "Partidos",   icon: Zap },
  { key: "sponsors",  label: "Sponsors",   icon: Sparkles },
  { key: "bg",        label: "Fondo",      icon: Palette },
  { key: "text",      label: "Texto",      icon: Type },
  { key: "shapes",    label: "Formas",     icon: Shapes },
  { key: "assets",    label: "Assets",     icon: ImageIcon },
  { key: "layers",    label: "Capas",      icon: Layers },
]

export default function LeftRail(props: Props) {
  const [tab, setTab] = useState<TabKey>("templates")
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("bucket", "website")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      const url = data.url || data.publicUrl
      if (url) props.onInsertImage(url)
    } catch (e) {
      console.error(e)
      alert("No se pudo subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  const themesForLiga = Object.values(THEMES).filter(
    (t) => t.liga === props.liga || t.key === "clean-light",
  )

  return (
    <aside className="flex h-full w-80 shrink-0 border-r border-white/5 bg-neutral-950">
      {/* Tabs verticales */}
      <div className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-white/5 py-2 overflow-y-auto">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex w-12 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition",
                tab === t.key ? "bg-white/10 text-white" : "text-neutral-500 hover:text-neutral-200",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="leading-none">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Contenido del tab */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "templates" && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Plantillas</h3>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => props.onInsertTemplate(t.key)}
                  className="group rounded-lg border border-white/10 bg-white/5 p-1.5 text-left hover:border-white/30 hover:bg-white/10"
                >
                  <div className="mb-1.5 overflow-hidden rounded shadow-inner">
                    <TemplateThumbnail templateKey={t.key} theme={props.theme} />
                  </div>
                  <div className="text-[11px] font-semibold text-white">{t.label}</div>
                  <div className="text-[9px] text-neutral-400">{t.desc}</div>
                </button>
              ))}
            </div>

            <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-neutral-400">Temas</h3>
            <div className="grid grid-cols-2 gap-2">
              {themesForLiga.map((t) => (
                <button
                  key={t.key}
                  onClick={() => props.onSelectTheme(t)}
                  className={cn(
                    "rounded-lg border p-2 text-left transition",
                    props.theme.key === t.key
                      ? "border-white/30 bg-white/10"
                      : "border-white/10 bg-white/5 hover:border-white/20",
                  )}
                >
                  <div className="mb-1.5 h-10 rounded" style={{ background: t.bgGradient || t.bg }} />
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-white">{t.label}</span>
                    <span className="ml-auto inline-block h-2 w-2 rounded-full" style={{ background: t.accent }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "genius" && (
          <MatchesPanel
            liga={props.liga}
            onApplyMatch={props.onApplyMatch}
            onApplyStandings={props.onApplyStandings}
            onApplyLeaders={props.onApplyLeaders}
          />
        )}

        {tab === "sponsors" && (
          <SponsorsPanel value={props.sponsorsConfig} onChange={props.onSponsorsChange} />
        )}

        {tab === "bg" && (
          <BackgroundPanel
            value={props.patternKey}
            alpha={props.patternAlpha}
            theme={props.theme}
            onChange={props.onPatternChange}
            onAlphaChange={props.onPatternAlphaChange}
          />
        )}

        {tab === "text" && (
          <div className="space-y-2">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Agregar texto</h3>
            <button
              onClick={() => props.onInsertText("title")}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
            >
              <div className="text-2xl font-black text-white">Título grande</div>
              <div className="text-[10px] text-neutral-400">Archivo Black · 96px</div>
            </button>
            <button
              onClick={() => props.onInsertText("subtitle")}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
            >
              <div className="text-base font-bold text-white">Subtítulo</div>
              <div className="text-[10px] text-neutral-400">Inter · 32px</div>
            </button>
            <button
              onClick={() => props.onInsertText("body")}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
            >
              <div className="text-sm text-white">Texto de cuerpo</div>
              <div className="text-[10px] text-neutral-400">Inter · 20px</div>
            </button>
            <div className="mt-3 rounded-lg bg-white/5 p-3 text-xs text-neutral-400">
              <strong className="text-white">Tip:</strong> doble-click en cualquier texto del canvas para editarlo directo.
            </div>
          </div>
        )}

        {tab === "shapes" && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Formas</h3>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => props.onInsertShape("rect")} className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">
                <Square className="h-8 w-8 text-neutral-300" />
              </button>
              <button onClick={() => props.onInsertShape("circle")} className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">
                <CircleIcon className="h-8 w-8 text-neutral-300" />
              </button>
              <button onClick={() => props.onInsertShape("line")} className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">
                <Minus className="h-8 w-8 text-neutral-300" />
              </button>
            </div>
          </div>
        )}

        {tab === "assets" && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Subir imagen</h3>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-white/10 bg-white/5 p-6 text-center hover:bg-white/10 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-neutral-400" /> : <Upload className="h-6 w-6 text-neutral-400" />}
              <span className="text-xs text-neutral-300">
                {uploading ? "Subiendo..." : "Click para subir imagen"}
              </span>
            </button>
          </div>
        )}

        {tab === "layers" && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Capas ({props.layers.length})
            </h3>
            {props.layers.length === 0 ? (
              <p className="text-xs text-neutral-500">Sin objetos todavía. Agregá un template o texto.</p>
            ) : (
              <div className="space-y-1">
                {[...props.layers].reverse().map((layer) => (
                  <div
                    key={layer.id}
                    onClick={() => props.onSelectLayer(layer.id)}
                    className={cn(
                      "group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                      props.selectedId === layer.id ? "bg-white/15 text-white" : "text-neutral-300 hover:bg-white/5",
                    )}
                  >
                    <span className="flex-1 truncate">{layer.label}</span>
                    <button onClick={(e) => { e.stopPropagation(); props.onToggleLayerVisibility(layer.id) }}
                      className="opacity-0 transition group-hover:opacity-100" title="Mostrar/ocultar">
                      {layer.visible ? "👁" : "◌"}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); props.onDeleteLayer(layer.id) }}
                      className="opacity-0 transition hover:text-red-400 group-hover:opacity-100" title="Eliminar">
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
