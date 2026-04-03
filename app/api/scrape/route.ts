import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

async function checkAdmin() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user: _su }, error: _se } = await supabase.auth.getUser()
    const session = _su ? { user: _su } : null
  if (!session?.user) return false
  const adminRoles = await prisma.usuarioRol.findMany({
    where: { usuarioId: session.user.id, rol: "SUPER_ADMIN" },
  })
  return adminRoles.length > 0
}

export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 })
    }

    // Try to extract content from Instagram post using oEmbed (official, no auth needed)
    if (url.includes("instagram.com")) {
      try {
        const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}&omitscript=true`
        const oembedRes = await fetch(oembedUrl)

        if (oembedRes.ok) {
          const data = await oembedRes.json()
          // oEmbed returns: title (caption), thumbnail_url, author_name, html
          return NextResponse.json({
            text: data.title || "",
            imageUrl: data.thumbnail_url || null,
            author: data.author_name || "",
            source: "instagram-oembed",
          })
        }
      } catch {}

      // Fallback: try fetching the page HTML and extracting meta tags
      try {
        const pageRes = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          },
        })
        const html = await pageRes.text()

        // Extract og:description (post caption)
        const descMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/)
        const imgMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/)
        const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/)

        const text = descMatch?.[1]?.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">") || ""
        const imageUrl = imgMatch?.[1] || null
        const title = titleMatch?.[1] || ""

        if (text || imageUrl) {
          return NextResponse.json({
            text: text || title,
            imageUrl,
            author: "",
            source: "meta-tags",
          })
        }
      } catch {}
    }

    // Generic: try fetching meta tags from any URL
    try {
      const pageRes = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        },
      })
      const html = await pageRes.text()

      const descMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/)
      const imgMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/)

      return NextResponse.json({
        text: descMatch?.[1]?.replace(/&amp;/g, "&").replace(/&quot;/g, '"') || "",
        imageUrl: imgMatch?.[1] || null,
        author: "",
        source: "meta-tags",
      })
    } catch {
      return NextResponse.json({ error: "No se pudo extraer contenido de la URL" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
