"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Copy, Download, Loader2 } from "lucide-react"

type TeamLogo = { name: string; logo: string }

const LIGAS = [
  { key: "lnb",  label: "LNB",      api: "/api/website/programacion-lnb"  },
  { key: "lnbf", label: "LNBF",     api: "/api/website/programacion-lnbf" },
  { key: "u22m", label: "U22 Masc", api: "/api/website/programacion-u22m" },
  { key: "u22f", label: "U22 Fem",  api: "/api/website/programacion-u22f" },
]

export default function LogosLigaPage() {
  const searchParams = useSearchParams()
  const ligaParam = searchParams.get("liga") ?? "lnb"
  const ligaConfig = LIGAS.find((l) => l.key === ligaParam) ?? LIGAS[0]

  const [teams, setTeams] = useState<TeamLogo[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(ligaConfig.api)
      .then((r) => r.json())
      .then((data) => {
        const matches: any[] = data.matches ?? []
        const map = new Map<string, string>()
        for (const m of matches) {
          if (m.homeName && m.homeLogo && !map.has(m.homeName)) map.set(m.homeName, m.homeLogo)
          if (m.awayName && m.awayLogo && !map.has(m.awayName)) map.set(m.awayName, m.awayLogo)
        }
        const list = Array.from(map.entries())
          .map(([name, logo]) => ({ name, logo }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setTeams(list)
      })
      .catch(() => setTeams([]))
      .finally(() => setLoading(false))
  }, [ligaConfig.api])

  function normalizedUrl(rawLogo: string, size = 600): string {
    return `${origin}/api/logo-norm?url=${encodeURIComponent(rawLogo)}&size=${size}`
  }

  function copyUrl(url: string, idx: number) {
    navigator.clipboard.writeText(url)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  function copyAll() {
    const lines = teams.map((t) => `${t.name}\t${normalizedUrl(t.logo, 600)}`).join("\n")
    navigator.clipboard.writeText(lines)
  }

  async function downloadAll() {
    for (const t of teams) {
      const url = normalizedUrl(t.logo, 600)
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `${t.name.replace(/\s+/g, "_")}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
        // small delay to avoid browser throttling multiple downloads
        await new Promise((r) => setTimeout(r, 400))
      } catch {
        // ignore failed downloads, continue
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Logos de equipos — {ligaConfig.label}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            URLs normalizadas (PNG con fondo transparente, bordes recortados).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="?liga=lnb"
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
              ligaParam === "lnb" ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >LNB</a>
          <a
            href="?liga=lnbf"
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
              ligaParam === "lnbf" ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >LNBF</a>
          <a
            href="?liga=u22m"
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
              ligaParam === "u22m" ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >U22 Masc</a>
          <a
            href="?liga=u22f"
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
              ligaParam === "u22f" ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >U22 Fem</a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando equipos...
        </div>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">No se encontraron equipos para esta liga.</p>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:border-gray-300 bg-white"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar todos (TSV)
            </button>
            <button
              onClick={downloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:border-gray-300 bg-white"
            >
              <Download className="h-3.5 w-3.5" /> Descargar todos (PNG 600px)
            </button>
            <span className="text-xs text-muted-foreground ml-2">{teams.length} equipos</span>
          </div>
          <div className="space-y-2">
            {teams.map((t, i) => {
              const url = normalizedUrl(t.logo, 600)
              return (
                <div key={t.name} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white">
                  <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1">
                    {/* usamos el mismo endpoint para el preview */}
                    <img src={normalizedUrl(t.logo, 150)} alt={t.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                    <input
                      readOnly
                      value={url}
                      onFocus={(e) => e.currentTarget.select()}
                      className="mt-1 w-full text-[11px] font-mono text-gray-600 bg-gray-50 border border-gray-100 rounded px-2 py-1 truncate"
                    />
                  </div>
                  <button
                    onClick={() => copyUrl(url, i)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      copiedIdx === i ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    {copiedIdx === i ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedIdx === i ? "Copiado" : "Copiar"}
                  </button>
                  <a
                    href={url}
                    download={`${t.name.replace(/\s+/g, "_")}.png`}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-white text-xs font-medium"
                  >
                    <Download className="h-3.5 w-3.5" /> PNG
                  </a>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
