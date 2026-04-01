"use client"

import { useState } from "react"

interface DatePickerSimpleProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  label?: string
  minYear?: number
  maxYear?: number
}

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export default function DatePickerSimple({
  value,
  onChange,
  label = "Fecha de nacimiento",
  minYear = 1950,
  maxYear,
}: DatePickerSimpleProps) {
  const currentYear = new Date().getFullYear()
  const max = maxYear || currentYear - 10

  // Parse initial value
  const parts = value ? value.split("-") : ["", "", ""]
  const [year, setYear] = useState(parts[0] || "")
  const [month, setMonth] = useState(parts[1] ? String(parseInt(parts[1])) : "")
  const [day, setDay] = useState(parts[2] ? String(parseInt(parts[2])) : "")

  function updateDate(y: string, m: string, d: string) {
    setYear(y)
    setMonth(m)
    setDay(d)
    if (y && m && d) {
      const mm = m.padStart(2, "0")
      const dd = d.padStart(2, "0")
      onChange(`${y}-${mm}-${dd}`)
    }
  }

  // Days in selected month
  const daysInMonth = year && month
    ? new Date(parseInt(year), parseInt(month), 0).getDate()
    : 31

  const years = []
  for (let y = max; y >= minYear; y--) years.push(y)

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label} *</label>}
      <div className="grid grid-cols-3 gap-2">
        {/* Day */}
        <select
          value={day}
          onChange={(e) => updateDate(year, month, e.target.value)}
          className="h-11 px-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          style={{ fontSize: "16px" }}
        >
          <option value="">Día</option>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Month */}
        <select
          value={month}
          onChange={(e) => updateDate(year, e.target.value, day)}
          className="h-11 px-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          style={{ fontSize: "16px" }}
        >
          <option value="">Mes</option>
          {meses.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={year}
          onChange={(e) => updateDate(e.target.value, month, day)}
          className="h-11 px-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          style={{ fontSize: "16px" }}
        >
          <option value="">Año</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
