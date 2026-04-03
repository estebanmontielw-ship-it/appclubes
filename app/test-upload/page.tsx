"use client"

import { useState, useRef } from "react"

export default function TestUploadPage() {
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResult(null)
    setError(null)
    setPreview(null)
    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("bucket", "fotos-cedula")

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || "Error desconocido")
      } else {
        setResult(data.url)
        setPreview(data.url)
      }
    } catch {
      setError("Error de red")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Test Upload HEIC</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Subí una foto desde tu iPhone para probar conversión HEIC → JPG</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleUpload}
        style={{ display: "none" }}
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => { if (inputRef.current) { inputRef.current.removeAttribute("capture"); inputRef.current.click() } }}
          style={{ padding: "12px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15 }}
        >
          Elegir foto de galería
        </button>
        <button
          onClick={() => { if (inputRef.current) { inputRef.current.setAttribute("capture", "environment"); inputRef.current.click() } }}
          style={{ padding: "12px 20px", background: "#374151", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15 }}
        >
          Sacar foto con cámara
        </button>
      </div>

      {loading && <p style={{ color: "#6b7280" }}>Subiendo...</p>}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 16, color: "#dc2626", marginBottom: 16 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <strong style={{ color: "#16a34a" }}>✓ Subida exitosa</strong>
          <p style={{ fontSize: 12, color: "#374151", wordBreak: "break-all", marginTop: 8 }}>{result}</p>
        </div>
      )}

      {preview && (
        <div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Vista previa:</p>
          <img src={preview} alt="preview" style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #e5e7eb" }} />
        </div>
      )}
    </div>
  )
}
