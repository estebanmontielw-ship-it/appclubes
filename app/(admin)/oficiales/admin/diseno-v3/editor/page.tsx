"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

// fabric.js toca window/document → app completo client-only.
const DisenoV3App = dynamic(() => import("../_components/DisenoV3App"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <div className="text-sm text-neutral-400">Cargando editor…</div>
      </div>
    </div>
  ),
})

export default function DisenoV3EditorPage() {
  return (
    <Suspense fallback={null}>
      <DisenoV3App />
    </Suspense>
  )
}
