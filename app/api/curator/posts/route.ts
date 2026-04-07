import { NextResponse } from "next/server"

/**
 * Public proxy for Curator.io feed posts.
 * Uses the v1 endpoint which is public (same one the published widget JS uses).
 * No API key required — works with Curator Free plan.
 */

const FEED_ID = "7d577115-2af2-45ac-b52b-3b583d452e4e"
const CURATOR_URL = `https://api.curator.io/v1/feeds/${FEED_ID}/posts`

// In-memory cache
let cache: { data: any; expires: number } | null = null
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

export const revalidate = 900

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit") || "24")

  // Check cache
  if (cache && Date.now() < cache.expires) {
    return NextResponse.json(cache.data)
  }

  try {
    const url = `${CURATOR_URL}?limit=${limit}`
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Curator API error ${res.status}: ${text.slice(0, 200)}`)
    }

    const raw = await res.json()

    // Normalize: Curator v1 returns { posts: [...], total_posts, ... }
    const rawPosts = raw.posts || raw.data || []
    const posts = rawPosts.map((p: any) => ({
      id: p.id,
      network: p.network_name || p.source_name || "instagram",
      text: p.text || p.caption || "",
      url: p.url || p.source_url || p.permalink || "",
      image: p.image || p.image_url || p.thumbnail || p.media_url || null,
      video: p.video || p.video_url || null,
      author: p.user_screen_name || p.user_full_name || p.username || "",
      authorImage: p.user_image || p.user_profile_image || null,
      likes: p.likes || p.like_count || 0,
      comments: p.comments || p.comment_count || 0,
      createdAt: p.source_created_at || p.created_at || p.timestamp || null,
    }))

    const data = {
      ok: true,
      posts,
      total: raw.total_posts || posts.length,
      _debug: { sample: rawPosts[0] ? Object.keys(rawPosts[0]) : [] },
    }
    cache = { data, expires: Date.now() + CACHE_TTL }

    return NextResponse.json(data)
  } catch (error: any) {
    if (cache) return NextResponse.json(cache.data)
    return NextResponse.json(
      { ok: false, error: error.message, posts: [] },
      { status: 500 }
    )
  }
}
