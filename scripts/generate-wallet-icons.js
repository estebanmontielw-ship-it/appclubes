/**
 * Genera los íconos del Apple Wallet pass desde assets/icon-source.png.
 * Se ejecuta durante `npm run build` para que los íconos estén
 * disponibles en producción (Vercel) sin depender del build de Codemagic.
 */

const sharp = require("sharp")
const path = require("path")
const fs = require("fs")

const ROOT = path.join(__dirname, "..")
const ICON_SRC = path.join(ROOT, "assets", "icon-source.png")
const OUT_DIR = path.join(ROOT, "public", "wallet-pass")

const SIZES = [
  { name: "icon.png",     px: 29 },
  { name: "icon@2x.png",  px: 58 },
  { name: "icon@3x.png",  px: 87 },
  { name: "logo.png",     px: 50 },
  { name: "logo@2x.png",  px: 100 },
  { name: "logo@3x.png",  px: 150 },
]

async function main() {
  if (!fs.existsSync(ICON_SRC)) {
    console.log("⚠️  assets/icon-source.png no existe — skipping wallet icons")
    return
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })
  for (const { name, px } of SIZES) {
    await sharp(ICON_SRC)
      .flatten({ background: "#ffffff" })
      .resize(px, px)
      .toFile(path.join(OUT_DIR, name))
  }
  console.log(`✅ ${SIZES.length} Apple Wallet pass icons generados en public/wallet-pass/`)
}

main().catch((err) => {
  console.error("❌ Error generando wallet icons:", err)
  // No fallar el build si hay error — el API tiene fallback a favicon
  process.exit(0)
})
