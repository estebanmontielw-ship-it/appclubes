import { createServiceClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { handleApiError } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB
const ALLOWED_PREFIXES = ["image/", "video/", "audio/", "application/pdf"]

/**
 * Subida pública (anónima) de archivos de evidencia a un bucket PRIVADO.
 * Solo el SUPER_ADMIN puede después leerlos via /api/admin/denuncias/evidencia.
 * Devuelve `path` (no URL pública) — el path se guarda en la denuncia.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "El archivo no puede superar 25 MB" },
        { status: 400 }
      )
    }

    const contentType = file.type || "application/octet-stream"
    const allowed = ALLOWED_PREFIXES.some((p) => contentType.startsWith(p))
    if (!allowed) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Subí imágenes, videos, audios o PDF." },
        { status: 400 }
      )
    }

    const ext = (file.name.split(".").pop() || "bin").toLowerCase().slice(0, 6)
    const fileName = `${uuidv4()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const service = createServiceClient()
    const { error: uploadError } = await service.storage
      .from("denuncias-evidencia")
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    return NextResponse.json({ path: fileName, name: file.name, size: file.size })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/denuncias/evidencia" })
  }
}
