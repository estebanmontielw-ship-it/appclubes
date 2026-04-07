"use client"

import { useEffect, useState, useRef } from "react"
import { ChevronLeft, ChevronRight, Heart, MessageCircle, ExternalLink } from "lucide-react"

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

// Speed in pixels per second for the continuous marquee
const SCROLL_SPEED = 30

export default function SocialCarousel() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [entered, setEntered] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const isPausedRef = useRef(false)

  // Keep ref in sync so the rAF loop reads the latest value without restarting
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  // Fetch posts
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

  // Trigger staggered entrance after posts load
  useEffect(() => {
    if (posts.length > 0) {
      const t = setTimeout(() => setEntered(true), 50)
      return () => clearTimeout(t)
    }
  }, [posts])

  const updateScrollButtons = () => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    // Right button visible unless we've reached the very end of the duplicated track
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

  // Continuous smooth scroll using requestAnimationFrame
  useEffect(() => {
    if (posts.length === 0) return

    const tick = (time: number) => {
      const el = scrollerRef.current
      if (!el) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time
      }
      const delta = time - lastTimeRef.current
      lastTimeRef.current = time

      if (!isPausedRef.current) {
        // Move scroll position by (speed * deltaSeconds)
        const move = (SCROLL_SPEED * delta) / 1000
        const halfWidth = el.scrollWidth / 2 // we render posts twice
        let next = el.scrollLeft + move
        // When we've scrolled past the first set, jump back silently
        if (next >= halfWidth) {
          next = next - halfWidth
        }
        el.scrollLeft = next
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = 0
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
          <div
            key={i}
            className="flex-shrink-0 w-72 h-96 rounded-2xl bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer"
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

  // Duplicate posts so the marquee can loop seamlessly
  const loopedPosts = [...posts, ...posts]

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
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
        className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollBehavior: "auto" }}
      >
        {loopedPosts.map((post, idx) => (
          <a
            key={`${post.id}-${idx}`}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-72 group/card"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? "translateY(0)" : "translateY(24px)",
              transition: idx < posts.length
                ? `opacity 600ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 80}ms, transform 600ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 80}ms`
                : "none",
            }}
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
