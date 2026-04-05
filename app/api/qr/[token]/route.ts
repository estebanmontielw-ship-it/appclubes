import { NextResponse } from "next/server"
import { generateQRDataURL } from "@/lib/qr"
import { handleApiError } from "@/lib/api-errors"

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const dataUrl = await generateQRDataURL(params.token)
    return NextResponse.json({ qr: dataUrl })
  } catch (error) {
    return NextResponse.json({ error: "Error generando QR" }, { status: 500 })
  }
}
