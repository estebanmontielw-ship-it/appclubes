"use client"

import { ArrowLeft, Undo2, Redo2, Save, Download, Copy, FolderOpen, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import TournamentSwitcher from "./TournamentSwitcher"
import type { LigaKey } from "../_lib/themes"
import { FORMATS, type FormatKey } from "../_lib/formats"

interface Props {
  docName: string
  onDocNameChange: (v: string) => void
  liga: LigaKey
  onLigaChange: (v: LigaKey) => void
  format: FormatKey
  onFormatChange: (v: FormatKey) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onOpen: () => void
  onExport: (kind: "png" | "jpg" | "pdf" | "json") => void
  saving: boolean
  dirty: boolean
  onBack: () => void
  onGenerateCopy: () => void
}

export default function TopBar(props: Props) {
  return (
    <div className="flex items-center gap-3 border-b border-white/5 bg-neutral-950/95 px-3 py-2 backdrop-blur">
      {/* Left: back + doc name */}
      <button
        onClick={props.onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
        title="Volver al admin"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <input
        value={props.docName}
        onChange={(e) => props.onDocNameChange(e.target.value)}
        placeholder="Diseño sin título"
        className="h-9 w-56 rounded-lg bg-transparent px-2 text-sm font-medium text-white outline-none ring-1 ring-transparent focus:bg-white/5 focus:ring-white/10"
      />

      {props.dirty && (
        <span className="text-[10px] uppercase tracking-wider text-amber-400/80">sin guardar</span>
      )}

      {/* Center: tournament + format */}
      <div className="mx-auto flex items-center gap-3">
        <TournamentSwitcher value={props.liga} onChange={props.onLigaChange} compact />

        <div className="h-6 w-px bg-white/10" />

        <div className="flex items-center gap-1 rounded-full bg-neutral-900/90 p-1 ring-1 ring-white/10">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              onClick={() => props.onFormatChange(f.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                props.format === f.key
                  ? "bg-white text-neutral-900"
                  : "text-neutral-400 hover:text-white",
              )}
              title={f.sub}
            >
              {f.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={props.onUndo}
          disabled={!props.canUndo}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
          title="Deshacer (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={props.onRedo}
          disabled={!props.canRedo}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
          title="Rehacer (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-white/10" />

        <button
          onClick={props.onOpen}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
          title="Abrir diseño (Ctrl+O)"
        >
          <FolderOpen className="h-4 w-4" />
          <span className="hidden md:inline">Abrir</span>
        </button>

        <button
          onClick={props.onGenerateCopy}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
          title="Generar copy IG con IA"
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="hidden md:inline">Copy IA</span>
        </button>

        <div className="relative group">
          <button
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
          >
            <Download className="h-4 w-4" />
            <span className="hidden md:inline">Exportar</span>
          </button>
          <div className="absolute right-0 top-full mt-1 hidden min-w-[140px] overflow-hidden rounded-lg bg-neutral-900 ring-1 ring-white/10 group-hover:block z-50">
            <button onClick={() => props.onExport("png")} className="block w-full px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/5">PNG</button>
            <button onClick={() => props.onExport("jpg")} className="block w-full px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/5">JPG</button>
            <button onClick={() => props.onExport("pdf")} className="block w-full px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/5">PDF</button>
            <button onClick={() => props.onExport("json")} className="block w-full px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/5">JSON (backup)</button>
          </div>
        </div>

        <button
          onClick={props.onSave}
          disabled={props.saving}
          className="ml-1 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-60"
        >
          {props.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Guardar</span>
        </button>
      </div>
    </div>
  )
}
