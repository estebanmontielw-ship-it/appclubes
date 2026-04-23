"use client"


import { useEffect, useState } from "react"
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Trash2, Copy, Lock, Unlock, ArrowUp, ArrowDown, MoveUp, MoveDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  selected: any | null
  canvasWidth: number
  canvasHeight: number
  onChange: () => void
  onDelete: () => void
  onDuplicate: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onToggleLock: () => void
  onAlignCanvas: (edge: "left" | "centerX" | "right" | "top" | "centerY" | "bottom") => void
}

export default function RightInspector(props: Props) {
  const s = props.selected
  const [, force] = useState(0)

  // re-render al modificar por teclado
  useEffect(() => {
    if (!s) return
    const handler = () => force((v) => v + 1)
    s.on?.("modified", handler)
    s.on?.("moving", handler)
    s.on?.("scaling", handler)
    s.on?.("rotating", handler)
    return () => {
      s.off?.("modified", handler)
      s.off?.("moving", handler)
      s.off?.("scaling", handler)
      s.off?.("rotating", handler)
    }
  }, [s])

  if (!s) {
    return (
      <aside className="h-full w-72 shrink-0 overflow-y-auto border-l border-white/5 bg-neutral-950 p-4 text-sm text-neutral-400">
        <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs">
          Seleccioná un elemento del canvas para ver sus propiedades.
        </div>
        <div className="mt-6 space-y-2 text-xs">
          <div className="font-semibold text-neutral-300">Atajos útiles</div>
          <div><kbd className="rounded bg-white/10 px-1.5 py-0.5">Del</kbd> eliminar</div>
          <div><kbd className="rounded bg-white/10 px-1.5 py-0.5">Ctrl+D</kbd> duplicar</div>
          <div><kbd className="rounded bg-white/10 px-1.5 py-0.5">Ctrl+Z</kbd> deshacer</div>
          <div><kbd className="rounded bg-white/10 px-1.5 py-0.5">Ctrl+S</kbd> guardar</div>
          <div><kbd className="rounded bg-white/10 px-1.5 py-0.5">↑↓←→</kbd> mover 1px</div>
          <div><kbd className="rounded bg-white/10 px-1.5 py-0.5">Shift+flechas</kbd> mover 10px</div>
          <div><kbd className="rounded bg-white/10 px-1.5 py-0.5">Alt+arrastrar</kbd> desactivar snap</div>
          <div><kbd className="rounded bg-white/10 px-1.5 py-0.5">Doble-click</kbd> editar texto</div>
        </div>
      </aside>
    )
  }

  const isText = s.type === "i-text" || s.type === "text" || s.type === "textbox"
  const isImage = s.type === "image"
  const isShape = s.type === "rect" || s.type === "circle" || s.type === "line"

  const setProp = (key: string, value: any) => {
    s.set(key, value)
    s.setCoords()
    props.onChange()
    force((v) => v + 1)
  }

  return (
    <aside className="h-full w-72 shrink-0 overflow-y-auto border-l border-white/5 bg-neutral-950 p-4">
      {/* Header con acciones */}
      <div className="mb-4 flex items-center gap-1">
        <span className="flex-1 text-sm font-semibold text-white capitalize">
          {isText ? "Texto" : isImage ? "Imagen" : isShape ? "Forma" : s.type}
        </span>
        <button onClick={props.onDuplicate} title="Duplicar (Ctrl+D)" className="rounded p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white">
          <Copy className="h-4 w-4" />
        </button>
        <button onClick={props.onToggleLock} title="Bloquear" className="rounded p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white">
          {s.lockMovementX ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>
        <button onClick={props.onDelete} title="Eliminar" className="rounded p-1.5 text-neutral-400 hover:bg-white/5 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Edición directa del texto */}
      {isText && (
        <div className="mb-4">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Texto
          </label>
          <textarea
            value={s.text || ""}
            onChange={(e) => {
              s.set("text", e.target.value)
              props.onChange()
              force((v) => v + 1)
            }}
            rows={3}
            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
          />
        </div>
      )}

      {/* Posición + tamaño */}
      <Section label="Posición">
        <div className="grid grid-cols-2 gap-2">
          <NumField label="X" value={Math.round(s.left || 0)} onChange={(v) => setProp("left", v)} />
          <NumField label="Y" value={Math.round(s.top || 0)} onChange={(v) => setProp("top", v)} />
          <NumField
            label="W"
            value={Math.round((s.width || 0) * (s.scaleX || 1))}
            onChange={(v) => {
              s.set("scaleX", v / (s.width || 1))
              s.setCoords()
              props.onChange()
              force((v2) => v2 + 1)
            }}
          />
          <NumField
            label="H"
            value={Math.round((s.height || 0) * (s.scaleY || 1))}
            onChange={(v) => {
              s.set("scaleY", v / (s.height || 1))
              s.setCoords()
              props.onChange()
              force((v2) => v2 + 1)
            }}
          />
          <NumField label="Rot°" value={Math.round(s.angle || 0)} onChange={(v) => setProp("angle", v)} />
          <NumField label="Opac%" value={Math.round((s.opacity ?? 1) * 100)} min={0} max={100} onChange={(v) => setProp("opacity", v / 100)} />
        </div>
      </Section>

      {/* Alineación al canvas */}
      <Section label="Alinear al canvas">
        <div className="grid grid-cols-3 gap-1">
          {([
            ["left", "⎸"],
            ["centerX", "⎪"],
            ["right", "⎹"],
            ["top", "⎯"],
            ["centerY", "―"],
            ["bottom", "⎯"],
          ] as const).map(([edge, icon]) => (
            <button
              key={edge}
              onClick={() => props.onAlignCanvas(edge)}
              className="rounded-md border border-white/10 bg-white/5 py-1.5 text-sm hover:bg-white/10"
              title={edge}
            >
              {icon}
            </button>
          ))}
        </div>
      </Section>

      {/* Tipografía (solo texto) */}
      {isText && (
        <>
          <Section label="Tipografía">
            <select
              value={s.fontFamily || "Inter"}
              onChange={(e) => setProp("fontFamily", e.target.value)}
              className="mb-2 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
            >
              {["Inter", "Archivo Black", "Bebas Neue", "Poppins", "Oswald", "Roboto", "Montserrat", "Playfair Display"].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <NumField label="Tamaño" value={Math.round(s.fontSize || 24)} onChange={(v) => setProp("fontSize", v)} />
              <NumField label="Espaciado" value={s.charSpacing || 0} onChange={(v) => setProp("charSpacing", v)} />
            </div>
            <div className="mt-2 flex items-center gap-1">
              <IconToggle active={s.fontWeight === "bold" || s.fontWeight === 700 || s.fontWeight === "900"} onClick={() => setProp("fontWeight", (s.fontWeight === "bold" ? "normal" : "bold"))}>
                <Bold className="h-3.5 w-3.5" />
              </IconToggle>
              <IconToggle active={s.fontStyle === "italic"} onClick={() => setProp("fontStyle", s.fontStyle === "italic" ? "normal" : "italic")}>
                <Italic className="h-3.5 w-3.5" />
              </IconToggle>
              <IconToggle active={s.underline === true} onClick={() => setProp("underline", !s.underline)}>
                <Underline className="h-3.5 w-3.5" />
              </IconToggle>
              <div className="mx-1 h-5 w-px bg-white/10" />
              <IconToggle active={s.textAlign === "left"} onClick={() => setProp("textAlign", "left")}>
                <AlignLeft className="h-3.5 w-3.5" />
              </IconToggle>
              <IconToggle active={s.textAlign === "center"} onClick={() => setProp("textAlign", "center")}>
                <AlignCenter className="h-3.5 w-3.5" />
              </IconToggle>
              <IconToggle active={s.textAlign === "right"} onClick={() => setProp("textAlign", "right")}>
                <AlignRight className="h-3.5 w-3.5" />
              </IconToggle>
            </div>
          </Section>

          <Section label="Color de texto">
            <ColorPicker value={s.fill || "#000000"} onChange={(v) => setProp("fill", v)} />
          </Section>
        </>
      )}

      {/* Relleno shape */}
      {isShape && (
        <>
          <Section label="Relleno">
            <ColorPicker value={typeof s.fill === "string" ? s.fill : "#000000"} onChange={(v) => setProp("fill", v)} />
          </Section>
          <Section label="Borde">
            <ColorPicker value={s.stroke || "#ffffff"} onChange={(v) => setProp("stroke", v)} />
            <div className="mt-2">
              <NumField label="Grosor" value={s.strokeWidth || 0} onChange={(v) => setProp("strokeWidth", v)} />
            </div>
            {s.type === "rect" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <NumField label="Radio X" value={s.rx || 0} onChange={(v) => setProp("rx", v)} />
                <NumField label="Radio Y" value={s.ry || 0} onChange={(v) => setProp("ry", v)} />
              </div>
            )}
          </Section>
        </>
      )}

      {/* Orden (layer) */}
      <Section label="Orden">
        <div className="grid grid-cols-2 gap-1">
          <button onClick={props.onBringForward} className="flex items-center justify-center gap-1 rounded-md border border-white/10 bg-white/5 py-1.5 text-xs hover:bg-white/10">
            <ArrowUp className="h-3.5 w-3.5" /> Adelante
          </button>
          <button onClick={props.onSendBackward} className="flex items-center justify-center gap-1 rounded-md border border-white/10 bg-white/5 py-1.5 text-xs hover:bg-white/10">
            <ArrowDown className="h-3.5 w-3.5" /> Atrás
          </button>
          <button onClick={props.onBringToFront} className="flex items-center justify-center gap-1 rounded-md border border-white/10 bg-white/5 py-1.5 text-xs hover:bg-white/10">
            <MoveUp className="h-3.5 w-3.5" /> Al frente
          </button>
          <button onClick={props.onSendToBack} className="flex items-center justify-center gap-1 rounded-md border border-white/10 bg-white/5 py-1.5 text-xs hover:bg-white/10">
            <MoveDown className="h-3.5 w-3.5" /> Al fondo
          </button>
        </div>
      </Section>
    </aside>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </div>
      {children}
    </div>
  )
}

function NumField({ label, value, min, max, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white">
      <span className="text-neutral-400">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (Number.isFinite(v)) onChange(v)
        }}
        className="w-full bg-transparent text-right outline-none"
      />
    </label>
  )
}

function IconToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md border transition",
        active
          ? "border-white/30 bg-white/15 text-white"
          : "border-white/10 bg-white/5 text-neutral-400 hover:text-white",
      )}
    >
      {children}
    </button>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const presets = ["#FFFFFF", "#000000", "#D4AF37", "#2D56D4", "#FF4EA7", "#00E5FF", "#FF3B30", "#10B981", "#F59E0B", "#8B5CF6"]
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-white/10 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white font-mono outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className="h-5 w-5 rounded border border-white/10 transition hover:scale-110"
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  )
}
