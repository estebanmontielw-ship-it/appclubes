import { createServiceClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const bucket = formData.get("bucket") as string

    if (!file || !bucket) {
      return NextResponse.json(
        { error: "Archivo y bucket son requeridos" },
        { status: 400 }
      )
    }

    // Validate file size (10MB max to allow for HEIC which are larger)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo no puede superar 10MB" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    let buffer: Buffer = Buffer.from(await file.arrayBuffer()) as Buffer
    let fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
    let contentType = file.type

    // Convert HEIC/HEIF to JPEG
    const isHeic = fileExt === "heic" || fileExt === "heif" ||
                   contentType === "image/heic" || contentType === "image/heif"

    // Convert any image to JPEG for consistency (except PDFs)
    const isImage = contentType.startsWith("image/") || isHeic
    const isPdf = contentType === "application/pdf" || fileExt === "pdf"

    if (isImage && !isPdf) {
      try {
        buffer = await sharp(buffer)
          .rotate() // Auto-correct EXIF orientation
          .jpeg({ quality: 85 })
          .toBuffer() as Buffer
        fileExt = "jpg"
        contentType = "image/jpeg"
      } catch (err) {
        console.error("Image conversion error:", err)
        // If sharp fails, try uploading as-is
      }
    }

    const fileName = `${uuidv4()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
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

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({ url: urlData.publicUrl, path: fileName })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    )
  }
}
