"use client"

import { Table } from "lucide-react"

interface Props {
  titulo: string
  contenido: string
  metadata?: string // JSON with table data
}

export default function SeccionTablaResumen({ titulo, contenido, metadata }: Props) {
  // Try to parse table from metadata or contenido
  let headers: string[] = []
  let rows: string[][] = []

  try {
    if (metadata) {
      const data = JSON.parse(metadata)
      headers = data.headers || []
      rows = data.rows || []
    }
  } catch {}

  // If no parsed data, render as content with highlighted bg
  if (headers.length === 0) {
    return (
      <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Table className="h-5 w-5 text-green-600" />
          <h3 className="font-bold text-green-800">{titulo}</h3>
        </div>
        <div className="text-green-900 leading-relaxed space-y-2">
          {contenido.split("\n").filter(Boolean).map((line, i) => (
            <p
              key={i}
              className="text-sm"
              dangerouslySetInnerHTML={{
                __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Table className="h-5 w-5 text-green-600" />
        <h3 className="font-bold text-green-800">{titulo}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="text-left p-2 bg-green-100 font-semibold text-green-800 first:rounded-tl-lg last:rounded-tr-lg">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-green-100">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="p-2 text-green-900"
                    dangerouslySetInnerHTML={{
                      __html: cell.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
