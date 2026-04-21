import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"
import { handleApiError } from "@/lib/api-errors"

const ALLOWED_BUCKETS = ["fotos-oficiales", "documentos", "fotos-carnet", "fotos-ct", "hero-images", "recursos", "noticias", "website", "fotos-cedula", "certificados", "comprobantes"]

// These buckets are used by public registration forms (user not yet authenticated)
const PUBLIC_BUCKETS = new Set(["fotos-carnet", "fotos-cedula", "certificados", "comprobantes"])

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const bucket = formData.get("bucket") as string

    const isPublicBucket = PUBLIC_BUCKETS.has(bucket)

    // Auth check — skip for public registration buckets
    if (!isPublicBucket) {
      const cookieStore = cookies()
      const supabase = createClient(cookieStore)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
    }

    if (!file || !bucket) {
      return NextResponse.json(
        { error: "Archivo y bucket son requeridos" },
        { status: 400 }
      )
    }

    // Bucket allowlist check
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { error: "Bucket no permitido" },
        { status: 400 }
      )
    }

    // Validate file size (30MB max to fit DSLR photos up to 18 MB and HEIC).
    // In practice the frontend downscales to <1 MB before hitting this route,
    // so this is just a defense-in-depth cap for direct API callers.
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo no puede superar 30MB" },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()
    let buffer: Buffer = Buffer.from(await file.arrayBuffer()) as Buffer
    let fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
    let contentType = file.type

    // Convert HEIC/HEIF to JPEG
    const isHeic = fileExt === "heic" || fileExt === "heif" ||
                   contentType === "image/heic" || contentType === "image/heif"

    // Convert any image to JPEG for consistency (except PDFs and PNGs)
    const isImage = contentType.startsWith("image/") || isHeic
    const isPdf = contentType === "application/pdf" || fileExt === "pdf"
    const isPng = fileExt === "png" || contentType === "image/png"

    if (isImage && !isPdf) {
      try {
        if (isPng) {
          // Preserve PNG (needed for logos with transparency — satori/ImageResponse requires PNG)
          buffer = await sharp(buffer)
            .rotate()
            .png({ compressionLevel: 8 })
            .toBuffer() as Buffer
          fileExt = "png"
          contentType = "image/png"
        } else {
          buffer = await sharp(buffer)
            .rotate() // Auto-correct EXIF orientation
            .jpeg({ quality: 85 })
            .toBuffer() as Buffer
          fileExt = "jpg"
          contentType = "image/jpeg"
        }
      } catch (err) {
        console.error("Image conversion error:", err)
        if (isHeic) {
          return NextResponse.json(
            { error: "No se pudo procesar la imagen HEIC. Por favor convertí la foto a JPG o PNG antes de subirla." },
            { status: 400 }
          )
        }
        // For non-HEIC images, upload as-is
      }
    }

    const fileName = `${uuidv4()}.${fileExt}`

    const { error: uploadError } = await serviceClient.storage
      .from(bucket)
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    const { data: urlData } = serviceClient.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({ url: urlData.publicUrl, path: fileName })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/upload" })
  }
}
