"use client"

import { ClipboardList } from "lucide-react"

interface Props {
  titulo: string
  contenido: string
}

export default function SeccionCasoPractico({ titulo, contenido }: Props) {
  return (
    <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-200/50">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="font-bold text-blue-800">{titulo}</h3>
      </div>
      <div className="text-blue-900 leading-relaxed space-y-3">
        {contenido.split("\n\n").map((p, i) => {
          // Arrow lines (results)
          if (p.includes("→")) {
            return (
              <div key={i} className="bg-white/60 rounded-lg p-3 border border-blue-100">
                <p
                  className="font-medium"
                  dangerouslySetInnerHTML={{
                    __html: p
                      .replace(/→/g, '<span class="text-blue-600 font-bold">→</span>')
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              </div>
            )
          }
          return (
            <p
              key={i}
              dangerouslySetInnerHTML={{
                __html: p.replace(
                  /\*\*(.*?)\*\*/g,
                  "<strong>$1</strong>"
                ),
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
