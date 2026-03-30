import QRCode from "qrcode"

export async function generateQRDataURL(qrToken: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/verificar/${qrToken}`
  return QRCode.toDataURL(url, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
  })
}

export function getVerificationUrl(qrToken: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_URL}/verificar/${qrToken}`
}
