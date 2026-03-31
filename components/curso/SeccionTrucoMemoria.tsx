"use client"

import { Lightbulb } from "lucide-react"

interface Props {
  titulo: string
  contenido: string
}

export default function SeccionTrucoMemoria({ titulo, contenido }: Props) {
  return (
    <div className="rounded-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-yellow-200/50">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
        </div>
        <h3 className="font-bold text-yellow-800">Truco de memoria</h3>
      </div>
      <div className="text-yellow-900 leading-relaxed space-y-2">
        {contenido.split("\n\n").map((p, i) => (
          <p
            key={i}
            dangerouslySetInnerHTML={{
              __html: p.replace(
                /\*\*(.*?)\*\*/g,
                '<strong>$1</strong>'
              ),
            }}
          />
        ))}
      </div>
    </div>
  )
}
