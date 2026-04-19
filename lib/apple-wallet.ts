import { PKPass } from "passkit-generator"
import path from "path"
import fs from "fs"

/**
 * Genera un .pkpass firmado para Apple Wallet.
 *
 * Env vars requeridas (todas como texto PEM, con saltos de línea reales):
 * - APPLE_PASS_TYPE_ID             ej: pass.py.com.cpb.carnet
 * - APPLE_TEAM_ID                  ej: 67P62FNY9S
 * - APPLE_PASS_SIGNER_CERT_PEM     contenido del certificado (-----BEGIN CERTIFICATE-----)
 * - APPLE_PASS_SIGNER_KEY_PEM      contenido de la llave privada (-----BEGIN PRIVATE KEY-----)
 * - APPLE_PASS_WWDR_PEM            contenido del Apple WWDR G4 CA
 * - APPLE_PASS_SIGNER_KEY_PASSWORD (opcional) si la key está encriptada
 */

export type CarnetPassData = {
  nombreCompleto: string
  cedula: string
  rol: string
  ciudad: string
  verificadoEn: Date | string
  qrToken: string
  serialNumber: string
  fotoCarnetUrl?: string | null
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v.replace(/\\n/g, "\n").trim()
}

function validatePem(name: string, content: string, expectedHeaders: string[]): void {
  const firstLine = content.split("\n")[0]?.trim() || ""
  const matches = expectedHeaders.some((h) => firstLine === `-----BEGIN ${h}-----`)
  if (!matches) {
    throw new Error(
      `${name} tiene formato PEM inválido. Primera línea: "${firstLine.slice(0, 60)}". Esperaba uno de: ${expectedHeaders.join(", ")}`
    )
  }
}

function loadIcon(name: string): Buffer {
  const iconPath = path.join(process.cwd(), "public", "wallet-pass", name)
  if (fs.existsSync(iconPath)) return fs.readFileSync(iconPath)
  const fallback = path.join(process.cwd(), "public", "favicon-cpb.png")
  return fs.readFileSync(fallback)
}

/** Resizes the CPB logo to a given size with transparent background */
async function buildLogoBuffer(size: number): Promise<Buffer> {
  const sharp = (await import("sharp")).default
  const src = path.join(process.cwd(), "public", "favicon-cpb.png")
  return sharp(src)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

/** Fetches the user photo URL and returns square-cropped thumbnail buffers */
async function buildThumbnails(
  url: string
): Promise<{ thumb: Buffer; thumb2x: Buffer } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const raw = Buffer.from(await res.arrayBuffer())
    const sharp = (await import("sharp")).default
    const [thumb, thumb2x] = await Promise.all([
      sharp(raw).resize(90, 90, { fit: "cover", position: "top" }).png().toBuffer(),
      sharp(raw).resize(180, 180, { fit: "cover", position: "top" }).png().toBuffer(),
    ])
    return { thumb, thumb2x }
  } catch {
    return null
  }
}

export async function generateCarnetPass(data: CarnetPassData): Promise<Buffer> {
  const passTypeIdentifier = requireEnv("APPLE_PASS_TYPE_ID")
  const teamIdentifier = requireEnv("APPLE_TEAM_ID")
  const signerCert = requireEnv("APPLE_PASS_SIGNER_CERT_PEM")
  const signerKey = requireEnv("APPLE_PASS_SIGNER_KEY_PEM")
  const wwdr = requireEnv("APPLE_PASS_WWDR_PEM")
  const signerKeyPassphrase = process.env.APPLE_PASS_SIGNER_KEY_PASSWORD || ""

  validatePem("APPLE_PASS_SIGNER_CERT_PEM", signerCert, ["CERTIFICATE"])
  validatePem("APPLE_PASS_WWDR_PEM", wwdr, ["CERTIFICATE"])
  validatePem("APPLE_PASS_SIGNER_KEY_PEM", signerKey, ["PRIVATE KEY", "ENCRYPTED PRIVATE KEY", "RSA PRIVATE KEY"])

  const verificadoFecha = new Date(data.verificadoEn).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  // Build logo + photo in parallel
  const [logo1x, logo2x, thumbnails] = await Promise.all([
    buildLogoBuffer(40),
    buildLogoBuffer(80),
    data.fotoCarnetUrl ? buildThumbnails(data.fotoCarnetUrl) : null,
  ])

  const passFiles: Record<string, Buffer> = {
    "icon.png": loadIcon("icon.png"),
    "icon@2x.png": loadIcon("icon@2x.png"),
    "icon@3x.png": loadIcon("icon@3x.png"),
    "logo.png": logo1x,
    "logo@2x.png": logo2x,
  }

  if (thumbnails) {
    passFiles["thumbnail.png"] = thumbnails.thumb
    passFiles["thumbnail@2x.png"] = thumbnails.thumb2x
  }

  const pass = new PKPass(
    passFiles,
    { wwdr, signerCert, signerKey, signerKeyPassphrase },
    {
      formatVersion: 1,
      passTypeIdentifier,
      teamIdentifier,
      organizationName: "Confederación Paraguaya de Básquetbol",
      description: "Carnet Digital CPB",
      serialNumber: data.serialNumber,
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(10, 22, 40)",
      labelColor: "rgb(147, 197, 253)",
      logoText: "CPB",
    }
  )

  pass.type = "generic"

  pass.primaryFields.push({
    key: "nombre",
    label: "NOMBRE COMPLETO",
    value: data.nombreCompleto,
  })

  pass.secondaryFields.push(
    { key: "rol", label: "ROL", value: data.rol },
    { key: "cedula", label: "CÉDULA", value: data.cedula }
  )

  pass.auxiliaryFields.push(
    { key: "ciudad", label: "CIUDAD", value: data.ciudad || "Paraguay" },
    { key: "verificado", label: "HABILITADO DESDE", value: verificadoFecha }
  )

  pass.backFields.push(
    {
      key: "descripcion",
      label: "Carnet Digital Oficial",
      value: "Este carnet certifica tu habilitación vigente en la Confederación Paraguaya de Básquetbol. Escaneá el QR para verificar autenticidad.",
    },
    {
      key: "web",
      label: "Portal CPB",
      value: "https://cpb.com.py/oficiales",
    },
    {
      key: "qrUrl",
      label: "Link de verificación",
      value: `https://cpb.com.py/verificar/${data.qrToken}`,
    }
  )

  pass.setBarcodes({
    message: `https://cpb.com.py/verificar/${data.qrToken}`,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
    altText: data.cedula,
  })

  return pass.getAsBuffer()
}
