"use client"

import { useState } from "react"
import { Shield, Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

const TIPOS = [
  { value: "MANIPULACION_RESULTADO", label: "Posible manipulación de resultado deportivo" },
  { value: "ACTIVIDAD_APUESTAS", label: "Actividad sospechosa relacionada con apuestas" },
  { value: "SOBORNO_INCENTIVO", label: "Intento de soborno o incentivo económico" },
  { value: "CONDUCTA_SOSPECHOSA", label: "Conducta sospechosa de jugador / entrenador / árbitro" },
  { value: "OTRA", label: "Otra situación irregular" },
]

interface ArchivoSubido {
  path: string
  name: string
  size: number
}

export default function DenunciaForm() {
  const [tipoSituacion, setTipoSituacion] = useState("")
  const [competencia, setCompetencia] = useState("")
  const [partidoEvento, setPartidoEvento] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fechaOcurrencia, setFechaOcurrencia] = useState("")
  const [personasInvolucradas, setPersonasInvolucradas] = useState("")
  const [tieneEvidencia, setTieneEvidencia] = useState<"si" | "no" | "">("")
  const [descripcionEvidencia, setDescripcionEvidencia] = useState("")
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([])
  const [uploading, setUploading] = useState(false)
  const [modo, setModo] = useState<"anonimo" | "identificado">("anonimo")
  const [contactoNombre, setContactoNombre] = useState("")
  const [contactoEmail, setContactoEmail] = useState("")
  const [contactoTelefono, setContactoTelefono] = useState("")
  const [aceptoTerminos, setAceptoTerminos] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [sentId, setSentId] = useState<string | null>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    if (archivos.length + files.length > 10) {
      setError("Máximo 10 archivos")
      return
    }
    setError("")
    setUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/denuncias/evidencia", { method: "POST", body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "No se pudo subir el archivo")
        setArchivos((prev) => [...prev, data])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function removeArchivo(path: string) {
    setArchivos((prev) => prev.filter((a) => a.path !== path))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!tipoSituacion) return setError("Seleccioná el tipo de situación")
    if (descripcion.trim().length < 10) return setError("La descripción debe tener al menos 10 caracteres")
    if (!tieneEvidencia) return setError("Indicá si tenés evidencia")
    if (!aceptoTerminos) return setError("Debés aceptar la política de confidencialidad")

    if (modo === "identificado") {
      if (!contactoNombre.trim() || !contactoEmail.trim()) {
        return setError("Si elegís identificarte, completá nombre y email")
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/denuncias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoSituacion,
          competencia: competencia.trim() || null,
          partidoEvento: partidoEvento.trim() || null,
          descripcion: descripcion.trim(),
          fechaOcurrencia: fechaOcurrencia.trim() || null,
          personasInvolucradas: personasInvolucradas.trim() || null,
          tieneEvidencia: tieneEvidencia === "si",
          descripcionEvidencia: descripcionEvidencia.trim() || null,
          archivosUrls: archivos.map((a) => a.path),
          modo,
          contactoNombre: modo === "identificado" ? contactoNombre.trim() : null,
          contactoEmail: modo === "identificado" ? contactoEmail.trim() : null,
          contactoTelefono: modo === "identificado" ? contactoTelefono.trim() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo enviar la denuncia")
      setSentId(data.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (sentId) {
    return (
      <div className="bg-white rounded-2xl border border-green-100 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Denuncia recibida</h2>
        <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
          Gracias por colaborar con la integridad del básquetbol paraguayo. La información será
          analizada por la Confederación Paraguaya de Básquetbol con absoluta confidencialidad.
        </p>
        <p className="text-xs text-gray-400 mt-4">
          Código de referencia: <span className="font-mono">{sentId.slice(0, 8).toUpperCase()}</span>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Tipo de situación */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          1️⃣ ¿Sobre qué tipo de situación desea informar? *
        </label>
        <div className="space-y-2">
          {TIPOS.map((t) => (
            <label
              key={t.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                tipoSituacion === t.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="tipoSituacion"
                value={t.value}
                checked={tipoSituacion === t.value}
                onChange={(e) => setTipoSituacion(e.target.value)}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 2. Competencia / 3. Partido */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            2️⃣ Competencia o torneo
          </label>
          <input
            type="text"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            placeholder="Ej: LNB APERTURA 2026"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            3️⃣ Partido o evento relacionado
          </label>
          <input
            type="text"
            value={partidoEvento}
            onChange={(e) => setPartidoEvento(e.target.value)}
            placeholder="Equipo vs Equipo – Fecha aproximada"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* 4. Descripción */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          4️⃣ ¿Qué ocurrió? *
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={6}
          required
          maxLength={5000}
          placeholder="Contanos con el mayor detalle posible qué fue lo que pasó."
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{descripcion.length} / 5000</p>
      </div>

      {/* 5. Cuándo + 6. Personas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            5️⃣ ¿Cuándo ocurrió?
          </label>
          <input
            type="text"
            value={fechaOcurrencia}
            onChange={(e) => setFechaOcurrencia(e.target.value)}
            placeholder="Ej: 25 de abril de 2026, segundo cuarto"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            6️⃣ Personas potencialmente involucradas
          </label>
          <textarea
            value={personasInvolucradas}
            onChange={(e) => setPersonasInvolucradas(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Nombres, roles o equipos involucrados (si los conocés)"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>
      </div>

      {/* 7. Evidencia */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            7️⃣ ¿Tiene alguna evidencia? *
          </label>
          <div className="flex gap-3">
            {(["si", "no"] as const).map((v) => (
              <label
                key={v}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  tieneEvidencia === v
                    ? "border-primary bg-primary/5 text-primary font-semibold"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="tieneEvidencia"
                  value={v}
                  checked={tieneEvidencia === v}
                  onChange={() => setTieneEvidencia(v)}
                  className="sr-only"
                />
                {v === "si" ? "Sí" : "No"}
              </label>
            ))}
          </div>
        </div>

        {tieneEvidencia === "si" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Describí la evidencia
              </label>
              <textarea
                value={descripcionEvidencia}
                onChange={(e) => setDescripcionEvidencia(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Capturas de pantalla, chats, audios, videos..."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Adjuntar archivos (imágenes, videos, audios, PDF — máx. 25 MB c/u)
              </label>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Seleccionar archivos
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              {archivos.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {archivos.map((a) => (
                    <li
                      key={a.path}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm"
                    >
                      <span className="truncate flex-1 text-gray-700">{a.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {(a.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeArchivo(a.path)}
                        className="text-gray-400 hover:text-red-600 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modo de envío */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          ¿Desea dejar sus datos de contacto?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              modo === "anonimo"
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="modo"
              value="anonimo"
              checked={modo === "anonimo"}
              onChange={() => setModo("anonimo")}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">Enviar de forma anónima</p>
              <p className="text-xs text-gray-500 mt-0.5">No se guarda tu nombre ni datos de contacto.</p>
            </div>
          </label>
          <label
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              modo === "identificado"
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="modo"
              value="identificado"
              checked={modo === "identificado"}
              onChange={() => setModo("identificado")}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">Dejar mis datos</p>
              <p className="text-xs text-gray-500 mt-0.5">Para que la CPB pueda contactarte si necesita ampliar info.</p>
            </div>
          </label>
        </div>

        {modo === "identificado" && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input
                type="text"
                value={contactoNombre}
                onChange={(e) => setContactoNombre(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={contactoEmail}
                onChange={(e) => setContactoEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={contactoTelefono}
                onChange={(e) => setContactoTelefono(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Aviso de privacidad */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 space-y-2">
            <p className="font-semibold">Aviso de privacidad y confidencialidad</p>
            <p>
              Toda la información recibida será tratada con <strong>absoluta confidencialidad</strong> por la
              Confederación Paraguaya de Básquetbol y, si corresponde, por las autoridades de integridad
              deportiva (FIBA, Justicia Ordinaria).
            </p>
            <p>
              Para prevenir el abuso del sistema, se registran datos técnicos mínimos (fecha y hora del envío,
              navegador y un <strong>hash anónimo</strong> de la dirección IP). Estos datos no permiten
              identificarte personalmente y se utilizan únicamente para detectar denuncias falsas reiteradas o
              spam. Tu IP real <strong>no se almacena</strong>.
            </p>
            <label className="flex items-start gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aceptoTerminos}
                onChange={(e) => setAceptoTerminos(e.target.checked)}
                className="mt-0.5"
              />
              <span>Entiendo y acepto el tratamiento descrito.</span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full sm:w-auto px-8 py-3 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Enviando denuncia...
          </>
        ) : (
          "Enviar denuncia"
        )}
      </button>
    </form>
  )
}
