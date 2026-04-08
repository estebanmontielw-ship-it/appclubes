"use client"

import { useRef, useState } from "react"

interface FocalPointPickerProps {
  src: string
  x: number
  y: number
  onChange: (x: number, y: number) => void
  label?: string
  /** Preview aspect ratio (width / height), e.g. 16/9 for desktop, 9/16 for mobile */
  aspect?: number
}

/**
 * Draggable focal-point picker.
 * The preview box crops the image to the given aspect ratio using object-position
 * computed from the focal point, so the admin can see exactly what each device will show.
 */
export default function FocalPointPicker({
  src,
  x,
  y,
  onChange,
  label,
  aspect = 16 / 9,
}: FocalPointPickerProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  function updateFromEvent(e: React.PointerEvent) {
    const el = previewRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top) / rect.height) * 100
    onChange(
      Math.max(0, Math.min(100, Math.round(px * 10) / 10)),
      Math.max(0, Math.min(100, Math.round(py * 10) / 10))
    )
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDragging(true)
    updateFromEvent(e)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    updateFromEvent(e)
  }

  function handlePointerUp(e: React.PointerEvent) {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  return (
    <div>
      {label && (
        <p className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-gray-400 font-normal">
            {Math.round(x)}% · {Math.round(y)}%
          </span>
        </p>
      )}
      <div
        ref={previewRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-crosshair select-none touch-none"
        style={{ aspectRatio: String(aspect) }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: `${x}% ${y}%` }}
        />
        {/* Blue overlay matching the hero look so the admin sees the final result */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#0a1628]/70 to-[#0a1628]/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/80 via-transparent to-transparent pointer-events-none" />

        {/* Focal point indicator */}
        <div
          className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white shadow-lg pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            transform: dragging ? "scale(1.2)" : "scale(1)",
            transition: "transform 120ms ease-out",
          }}
        >
          <div className="absolute inset-1 rounded-full bg-white/80" />
        </div>

        <p className="absolute bottom-2 left-2 right-2 text-[10px] text-white/80 bg-black/40 rounded px-2 py-1 backdrop-blur-sm text-center pointer-events-none">
          Arrastrá el círculo para elegir el punto de enfoque
        </p>
      </div>
    </div>
  )
}
