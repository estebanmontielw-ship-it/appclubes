"use client"

import { useState } from "react"

const countryCodes = [
  { code: "+595", country: "PY", flag: "🇵🇾", label: "Paraguay" },
  { code: "+54", country: "AR", flag: "🇦🇷", label: "Argentina" },
  { code: "+55", country: "BR", flag: "🇧🇷", label: "Brasil" },
  { code: "+598", country: "UY", flag: "🇺🇾", label: "Uruguay" },
  { code: "+591", country: "BO", flag: "🇧🇴", label: "Bolivia" },
  { code: "+56", country: "CL", flag: "🇨🇱", label: "Chile" },
  { code: "+51", country: "PE", flag: "🇵🇪", label: "Perú" },
  { code: "+57", country: "CO", flag: "🇨🇴", label: "Colombia" },
  { code: "+58", country: "VE", flag: "🇻🇪", label: "Venezuela" },
  { code: "+1", country: "US", flag: "🇺🇸", label: "EEUU" },
  { code: "+34", country: "ES", flag: "🇪🇸", label: "España" },
  { code: "+39", country: "IT", flag: "🇮🇹", label: "Italia" },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  id?: string
}

export default function PhoneInput({ value, onChange, id }: PhoneInputProps) {
  // Parse existing value
  const hasCode = value.startsWith("+")
  const existingCode = hasCode ? countryCodes.find(c => value.startsWith(c.code)) : null

  const [selectedCode, setSelectedCode] = useState(existingCode?.code || "+595")
  const [number, setNumber] = useState(
    existingCode ? value.slice(existingCode.code.length) : value.replace(/^\+?\d{1,3}/, "")
  )

  function handleCodeChange(code: string) {
    setSelectedCode(code)
    onChange(code + number)
  }

  function handleNumberChange(num: string) {
    // Only allow digits
    const clean = num.replace(/[^\d]/g, "")
    setNumber(clean)
    onChange(selectedCode + clean)
  }

  const selected = countryCodes.find(c => c.code === selectedCode)

  return (
    <div className="flex gap-2">
      <select
        value={selectedCode}
        onChange={(e) => handleCodeChange(e.target.value)}
        className="w-28 h-11 px-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shrink-0"
        style={{ fontSize: "16px" }}
      >
        {countryCodes.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        value={number}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder="981123456"
        className="flex-1 h-11 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        style={{ fontSize: "16px" }}
      />
    </div>
  )
}
