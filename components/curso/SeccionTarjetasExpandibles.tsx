"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface Card {
  titulo: string
  contenido: string
  emoji?: string
}

interface Props {
  titulo: string
  contenido: string
  metadata?: string // JSON with cards array
}

export default function SeccionTarjetasExpandibles({ titulo, contenido, metadata }: Props) {
  let cards: Card[] = []
  try {
    if (metadata) cards = JSON.parse(metadata)
  } catch {
    // If metadata is not valid JSON, parse from contenido
    cards = contenido.split("\n\n---\n\n").map((block) => {
      const lines = block.split("\n")
      return {
        titulo: lines[0]?.replace(/^#+\s*/, "").replace(/\*\*/g, "") || "",
        contenido: lines.slice(1).join("\n"),
      }
    })
  }

  if (cards.length === 0) {
    cards = contenido.split("\n\n---\n\n").map((block) => {
      const lines = block.split("\n")
      return {
        titulo: lines[0]?.replace(/^#+\s*/, "").replace(/\*\*/g, "") || "",
        contenido: lines.slice(1).join("\n"),
      }
    })
  }

  return (
    <div className="space-y-3">
      {cards.map((card, i) => (
        <ExpandableCard key={i} card={card} />
      ))}
    </div>
  )
}

function ExpandableCard({ card }: { card: Card }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border bg-white overflow-hidden transition-shadow hover:shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="font-semibold text-gray-900 flex items-center gap-2">
          {card.emoji && <span className="text-xl">{card.emoji}</span>}
          {card.titulo}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 border-t">
          <div className="pt-3 text-gray-700 leading-relaxed space-y-2">
            {card.contenido.split("\n").filter(Boolean).map((line, j) => {
              if (line.includes("→")) {
                return (
                  <div key={j} className="bg-gray-50 rounded-lg p-2.5 my-2">
                    <p
                      className="text-sm"
                      dangerouslySetInnerHTML={{
                        __html: line
                          .replace(/→/g, '<span class="text-primary font-bold">→</span>')
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                      }}
                    />
                  </div>
                )
              }
              if (line.startsWith("-")) {
                return (
                  <div key={j} className="flex items-start gap-2 ml-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span
                      className="text-sm"
                      dangerouslySetInnerHTML={{
                        __html: line
                          .replace(/^-\s*/, "")
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                      }}
                    />
                  </div>
                )
              }
              return (
                <p
                  key={j}
                  className="text-sm"
                  dangerouslySetInnerHTML={{
                    __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
