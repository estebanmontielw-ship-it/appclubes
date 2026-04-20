/**
 * Downloads a .pkpass file and opens it in Apple Wallet.
 *
 * - In Safari / web browser: navigates directly — iOS handles the MIME type.
 * - In Capacitor WKWebView: fetches binary, saves to cache, then shares so
 *   iOS recognises the .pkpass extension and offers "Add to Wallet".
 */

import { isNative } from "@/lib/capacitor"

export async function openWalletPass(apiUrl: string): Promise<void> {
  if (!isNative()) {
    window.location.href = apiUrl
    return
  }

  const { Filesystem, Directory } = await import("@capacitor/filesystem")
  const { Share } = await import("@capacitor/share")

  const response = await fetch(apiUrl, { credentials: "include" })
  if (!response.ok) throw new Error(`Error ${response.status}`)

  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  // Convert to base64 (Filesystem.writeFile requires base64)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const base64 = btoa(binary)

  const fileName = "carnet-cpb.pkpass"
  await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  })

  const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache })

  await Share.share({
    title: "Carnet CPB",
    url: uri,
    dialogTitle: "Agregar a Apple Wallet",
  })
}
