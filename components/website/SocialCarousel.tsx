"use client"

import { useEffect, useState, useRef } from "react"
import { ChevronLeft, ChevronRight, Heart, MessageCircle, ExternalLink, Camera } from "lucide-react"

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

const networkIcon = () => <Camera className="h-4 w-4" />

const networkColor = (network: string) => {
  const n = (network || "").toLowerCase()
  if (n.includes("instagram")) return "from-purple-500 via-pink-500 to-orange-500"
  if (n.includes("facebook")) return "from-blue-600 to-blue-700"
  if (n.includes("twitter") || n.includes("x")) return "from-gray-800 to-black"
  return "from-purple-500 via-pink-500 to-orange-500"
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
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollerRef = useRef<HTMLDivElement>(null)

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

  const updateScrollButtons = () => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  useEffect(() => {
    updateScrollButtons()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollButtons)
    window.addEventListener("resize", updateScrollButtons)
    return () => {
      el.removeEventListener("scroll", updateScrollButtons)
      window.removeEventListener("resize", updateScrollButtons)
    }
  }, [posts])

  const scroll = (direction: "left" | "right") => {
    const el = scrollerRef.current
    if (!el) return
    const cardWidth = 320
    el.scrollBy({ left: direction === "left" ? -cardWidth * 2 : cardWidth * 2, behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72 h-96 bg-gray-200 rounded-2xl animate-pulse" />
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

  return (
    <div className="relative group">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        aria-label="Anterior"
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all -translate-x-1/2 ${
          canScrollLeft ? "opacity-100 hover:scale-110" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronLeft className="h-5 w-5 text-gray-700" />
      </button>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        aria-label="Siguiente"
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all translate-x-1/2 ${
          canScrollRight ? "opacity-100 hover:scale-110" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronRight className="h-5 w-5 text-gray-700" />
      </button>

      {/* Carousel */}
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {posts.map(post => (
          <a
            key={post.id}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-72 snap-start group/card"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
              {/* Media */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {post.video ? (
                  <video
                    src={post.video}
                    poster={post.image || undefined}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
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
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                  />
                ) : null}

                {/* Network badge */}
                <div className={`absolute top-3 left-3 w-8 h-8 rounded-full bg-gradient-to-br ${networkColor(post.network)} text-white flex items-center justify-center shadow-md`}>
                  {networkIcon()}
                </div>

                {/* External link indicator */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md opacity-0 group-hover/card:opacity-100 transition-opacity">
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
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
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
