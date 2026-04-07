"use client"

import { useEffect, useState } from "react"
import { Heart, MessageCircle, ExternalLink } from "lucide-react"

interface SocialPost {
  id: string | number
  network: string
  text: string
  url: string
  image: string | null
  video: string | null
  author: string
  authorImage: string | null
  likes: number
  comments: number
  createdAt: string | null
}

function timeAgo(date: string | null): string {
  if (!date) return ""
  const d = new Date(date)
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return "ahora"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}sem`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mes`
  return `${Math.floor(days / 365)}año`
}

export default function SocialCarousel() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/curator/posts?limit=20")
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (data.ok && Array.isArray(data.posts)) {
          setPosts(data.posts.filter((p: SocialPost) => p.image || p.video))
        } else {
          setError(data.error || "No se pudieron cargar las publicaciones")
        }
      })
      .catch(e => !cancelled && setError(e.message))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (posts.length > 0) {
      const t = setTimeout(() => setEntered(true), 50)
      return () => clearTimeout(t)
    }
  }, [posts])

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-64 sm:w-72 aspect-[3/4] rounded-2xl bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        <p className="font-semibold">Error cargando publicaciones</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No hay publicaciones disponibles en este momento.
      </div>
    )
  }

  // Duplicate posts so the marquee can loop seamlessly (animation goes 0 → -50%)
  const loopedPosts = [...posts, ...posts]

  // Animation duration scales with number of posts for consistent speed
  // ~8 seconds per post feels slow and elegant
  const duration = posts.length * 8

  return (
    <div
      className="relative overflow-hidden"
      style={{
        // Fade edges so cards feel like they're emerging/disappearing
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0, black 48px, black calc(100% - 48px), transparent 100%)",
        maskImage:
          "linear-gradient(to right, transparent 0, black 48px, black calc(100% - 48px), transparent 100%)",
      }}
    >
      <div
        className="flex gap-4 w-max marquee-track"
        style={{
          opacity: entered ? 1 : 0,
          transition: "opacity 800ms ease-out",
          animationDuration: `${duration}s`,
        }}
      >
        {loopedPosts.map((post, idx) => (
          <a
            key={`${post.id}-${idx}`}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-64 sm:w-72 group/card"
          >
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col">
              {/* Media */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {post.video ? (
                  <video
                    src={post.video}
                    poster={post.image || undefined}
                    className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700 ease-out"
                    muted
                    playsInline
                    loop
                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0 }}
                  />
                ) : post.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.image}
                    alt={post.text?.slice(0, 80) || "Post"}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700 ease-out"
                  />
                ) : null}

                {/* Shine overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 pointer-events-none overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 ease-out" />
                </div>

                {/* Gradient overlay at bottom on hover */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

                {/* External link indicator */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md opacity-0 group-hover/card:opacity-100 translate-y-[-4px] group-hover/card:translate-y-0 transition-all duration-300">
                  <ExternalLink className="h-4 w-4 text-gray-700" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                {post.text && (
                  <p className="text-sm text-gray-700 line-clamp-3 mb-3 flex-1">
                    {post.text}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    {post.likes > 0 && (
                      <span className="flex items-center gap-1 group-hover/card:text-red-500 transition-colors">
                        <Heart className="h-3.5 w-3.5 group-hover/card:fill-current" />
                        {post.likes > 999 ? `${(post.likes / 1000).toFixed(1)}k` : post.likes}
                      </span>
                    )}
                    {post.comments > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {post.comments}
                      </span>
                    )}
                  </div>
                  <span>{timeAgo(post.createdAt)}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
