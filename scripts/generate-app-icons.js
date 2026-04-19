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

// iOS icon entries with correct idiom per Apple spec
const IOS_ICON_ENTRIES = [
  // iPhone
  { size: 20,   scale: 2, idiom: "iphone" },
  { size: 20,   scale: 3, idiom: "iphone" },
  { size: 29,   scale: 1, idiom: "iphone" },
  { size: 29,   scale: 2, idiom: "iphone" },
  { size: 29,   scale: 3, idiom: "iphone" },
  { size: 40,   scale: 2, idiom: "iphone" },
  { size: 40,   scale: 3, idiom: "iphone" },
  { size: 60,   scale: 2, idiom: "iphone" },
  { size: 60,   scale: 3, idiom: "iphone" },
  // iPad
  { size: 20,   scale: 1, idiom: "ipad" },
  { size: 20,   scale: 2, idiom: "ipad" },
  { size: 29,   scale: 1, idiom: "ipad" },
  { size: 29,   scale: 2, idiom: "ipad" },
  { size: 40,   scale: 1, idiom: "ipad" },
  { size: 40,   scale: 2, idiom: "ipad" },
  { size: 76,   scale: 1, idiom: "ipad" },
  { size: 76,   scale: 2, idiom: "ipad" },   // 152x152
  { size: 83.5, scale: 2, idiom: "ipad" },   // 167x167
  // App Store
  { size: 1024, scale: 1, idiom: "ios-marketing" },
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

  const images = []
  const generated = new Set()

  for (const { size, scale, idiom } of IOS_ICON_ENTRIES) {
    const px = Math.round(size * scale)
    const filename = `icon-${idiom}-${px}.png`
    if (!generated.has(filename)) {
      await sharp(ICON_SRC).flatten({ background: "#ffffff" }).resize(px, px).toFile(path.join(outDir, filename))
      generated.add(filename)
    }
    images.push({ size: `${size}x${size}`, idiom, filename, scale: `${scale}x` })
  }

  const contents = { images, info: { version: 1, author: "xcode" } }
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

async function generateSplashImage(srcPath) {
  // If no splash source, generate one: CPB logo centered on dark blue background
  const SIZE = 2732
  const LOGO_SIZE = 600
  const BG = { r: 10, g: 22, b: 40 } // #0a1628

  if (srcPath && fs.existsSync(srcPath)) {
    return sharp(srcPath).resize(SIZE, SIZE, { fit: "cover" }).flatten({ background: BG }).toBuffer()
  }

  // Build splash from icon: dark blue bg + centered logo
  const logo = await sharp(ICON_SRC)
    .flatten({ background: BG })
    .resize(LOGO_SIZE, LOGO_SIZE)
    .toBuffer()

  return sharp({
    create: { width: SIZE, height: SIZE, channels: 3, background: BG },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer()
}

async function generateSplash() {
  const splashBuf = await generateSplashImage(fs.existsSync(SPLASH_SRC) ? SPLASH_SRC : null)

  // iOS splash
  const iosSplashDir = path.join(ROOT, "ios", "App", "App", "Assets.xcassets", "Splash.imageset")
  fs.mkdirSync(iosSplashDir, { recursive: true })
  await sharp(splashBuf).toFile(path.join(iosSplashDir, "splash.png"))
  fs.writeFileSync(path.join(iosSplashDir, "Contents.json"), JSON.stringify({
    images: [{ idiom: "universal", filename: "splash.png", scale: "1x" }],
    info: { version: 1, author: "xcode" }
  }, null, 2))

  // Android splash
  const androidDrawable = path.join(ROOT, "android", "app", "src", "main", "res", "drawable")
  fs.mkdirSync(androidDrawable, { recursive: true })
  await sharp(splashBuf).toFile(path.join(androidDrawable, "splash.png"))
  console.log("✅ Splash screens generated")
}

async function generateWalletPassIcons() {
  const outDir = path.join(ROOT, "public", "wallet-pass")
  fs.mkdirSync(outDir, { recursive: true })
  const sizes = [
    { name: "icon.png",     px: 29 },
    { name: "icon@2x.png",  px: 58 },
    { name: "icon@3x.png",  px: 87 },
    { name: "logo.png",     px: 50 },
    { name: "logo@2x.png",  px: 100 },
    { name: "logo@3x.png",  px: 150 },
  ]
  for (const { name, px } of sizes) {
    await sharp(ICON_SRC)
      .flatten({ background: "#ffffff" })
      .resize(px, px)
      .toFile(path.join(outDir, name))
  }
  console.log("✅ Apple Wallet pass icons generated")
}

async function main() {
  if (!fs.existsSync(ICON_SRC)) {
    console.error("❌ Missing assets/icon-source.png — place a 1024x1024 PNG there first")
    process.exit(1)
  }
  fs.mkdirSync(path.join(ROOT, "assets"), { recursive: true })
  await generateIosIcons()
  await generateAndroidIcons()
  await generateSplash()
  await generateWalletPassIcons()
  console.log("\n🎉 All assets generated!")
}

main().catch(console.error)
