/**
 * Run AFTER: npx cap add ios && npx cap add android
 * Usage: node scripts/setup-native.js
 *
 * Copies Firebase config files to the correct native project locations.
 */

const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..")

function copy(src, dest) {
  if (!fs.existsSync(src)) { console.error(`❌ Source not found: ${src}`); return }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
  console.log(`✅ ${path.basename(src)} → ${path.relative(ROOT, dest)}`)
}

// iOS — GoogleService-Info.plist goes inside the Xcode app target
copy(
  path.join(ROOT, "assets/firebase/GoogleService-Info.plist"),
  path.join(ROOT, "ios/App/App/GoogleService-Info.plist")
)

// Android — google-services.json goes in the app module
copy(
  path.join(ROOT, "assets/firebase/google-services.json"),
  path.join(ROOT, "android/app/google-services.json")
)

// App icons — copy to native projects
const iconSrc = path.join(ROOT, "assets/icon-source.png")
if (fs.existsSync(iconSrc)) {
  console.log("\n🎨 Generating icons...")
  require("./generate-app-icons.js")
} else {
  console.log("⚠️  No icon-source.png found — skipping icons")
}

console.log("\n🎉 Native setup complete!")
console.log("   Next: npm run cap:ios  (opens Xcode)")
console.log("         npm run cap:android  (opens Android Studio)")
