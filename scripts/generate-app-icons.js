/**
 * Generates all required app icons and splash screens from a single source image.
 *
 * Usage: node scripts/generate-app-icons.js
 * Requires: npm install sharp (already in project)
 *
 * Place your 1024x1024 PNG source icon at: assets/icon-source.png
 * Place your splash source (2732x2732) at: assets/splash-source.png
 */

const sharp = require("sharp")
const path = require("path")
const fs = require("fs")

const ROOT = path.join(__dirname, "..")
const ICON_SRC = path.join(ROOT, "assets", "icon-source.png")
const SPLASH_SRC = path.join(ROOT, "assets", "splash-source.png")

// iOS icon sizes required by Xcode
const IOS_ICONS = [
  { size: 20, scales: [1, 2, 3] },
  { size: 29, scales: [1, 2, 3] },
  { size: 40, scales: [1, 2, 3] },
  { size: 60, scales: [2, 3] },
  { size: 76, scales: [1, 2] },
  { size: 83.5, scales: [2] },
  { size: 1024, scales: [1] }, // App Store
]

// Android icon sizes
const ANDROID_ICONS = [
  { density: "mdpi",    size: 48  },
  { density: "hdpi",    size: 72  },
  { density: "xhdpi",   size: 96  },
  { density: "xxhdpi",  size: 144 },
  { density: "xxxhdpi", size: 192 },
]

async function generateIosIcons() {
  const outDir = path.join(ROOT, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset")
  fs.mkdirSync(outDir, { recursive: true })

  const entries = []
  for (const { size, scales } of IOS_ICONS) {
    for (const scale of scales) {
      const px = Math.round(size * scale)
      const filename = `icon-${px}.png`
      await sharp(ICON_SRC).resize(px, px).toFile(path.join(outDir, filename))
      entries.push({ size: `${size}x${size}`, idiom: size <= 83.5 ? "iphone" : "ipad", filename, scale: `${scale}x` })
    }
  }

  // Write Contents.json for Xcode
  const contents = {
    images: entries.map(e => ({ size: e.size, idiom: e.idiom, filename: e.filename, scale: e.scale })),
    info: { version: 1, author: "xcode" }
  }
  fs.writeFileSync(path.join(outDir, "Contents.json"), JSON.stringify(contents, null, 2))
  console.log("✅ iOS icons generated")
}

async function generateAndroidIcons() {
  const resDir = path.join(ROOT, "android", "app", "src", "main", "res")
  for (const { density, size } of ANDROID_ICONS) {
    const outDir = path.join(resDir, `mipmap-${density}`)
    fs.mkdirSync(outDir, { recursive: true })
    await sharp(ICON_SRC).resize(size, size).toFile(path.join(outDir, "ic_launcher.png"))
    await sharp(ICON_SRC).resize(size, size).toFile(path.join(outDir, "ic_launcher_round.png"))
  }
  console.log("✅ Android icons generated")
}

async function generateSplash() {
  // iOS splash
  const iosSplashDir = path.join(ROOT, "ios", "App", "App", "Assets.xcassets", "Splash.imageset")
  fs.mkdirSync(iosSplashDir, { recursive: true })
  await sharp(SPLASH_SRC).resize(2732, 2732, { fit: "cover" }).toFile(path.join(iosSplashDir, "splash.png"))
  fs.writeFileSync(path.join(iosSplashDir, "Contents.json"), JSON.stringify({
    images: [{ idiom: "universal", filename: "splash.png", scale: "1x" }],
    info: { version: 1, author: "xcode" }
  }, null, 2))

  // Android splash (placed in drawable folder by Capacitor)
  const androidDrawable = path.join(ROOT, "android", "app", "src", "main", "res", "drawable")
  fs.mkdirSync(androidDrawable, { recursive: true })
  await sharp(SPLASH_SRC).resize(2732, 2732, { fit: "cover" }).toFile(path.join(androidDrawable, "splash.png"))
  console.log("✅ Splash screens generated")
}

async function main() {
  if (!fs.existsSync(ICON_SRC)) {
    console.error("❌ Missing assets/icon-source.png — place a 1024x1024 PNG there first")
    process.exit(1)
  }
  fs.mkdirSync(path.join(ROOT, "assets"), { recursive: true })
  await generateIosIcons()
  await generateAndroidIcons()
  if (fs.existsSync(SPLASH_SRC)) await generateSplash()
  else console.log("⚠️  No splash-source.png found — skipping splash generation")
  console.log("\n🎉 All assets generated!")
}

main().catch(console.error)
