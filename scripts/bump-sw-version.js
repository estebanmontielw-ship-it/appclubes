#!/usr/bin/env node
/**
 * Bumps the service worker cache version automatically before each build.
 * Uses a timestamp so every deploy gets a unique cache name,
 * forcing all PWA users to download the latest version.
 */

const fs = require("fs")
const path = require("path")

const swPath = path.join(__dirname, "..", "public", "sw.js")
const content = fs.readFileSync(swPath, "utf8")

// Generate version: cpb-YYYYMMDD-HHmm (readable + unique)
const now = new Date()
const pad = (n) => String(n).padStart(2, "0")
const version = `cpb-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`

const updated = content.replace(
  /const CACHE_NAME = "cpb-[^"]*"/,
  `const CACHE_NAME = "${version}"`
)

if (updated === content) {
  console.log("⚠️  sw.js: no se encontró el patrón CACHE_NAME — verificá el archivo")
  process.exit(0)
}

fs.writeFileSync(swPath, updated)
console.log(`✅ SW cache actualizado: ${version}`)
