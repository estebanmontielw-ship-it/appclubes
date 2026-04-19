"use client"

import { useEffect } from "react"

/**
 * Hides the sticky [data-navbar] header when the user scrolls down,
 * and reveals it again when they scroll up or are near the top.
 */
export default function StatusBarScrollEffect() {
  useEffect(() => {
    let lastScrollY = window.scrollY
    let rafId: number | null = null

    const update = () => {
      const scrollY = window.scrollY
      const navbar = document.querySelector("[data-navbar]")

      if (navbar) {
        if (scrollY < 60 || scrollY < lastScrollY) {
          navbar.classList.remove("navbar-hidden")
        } else if (scrollY > lastScrollY && scrollY > 60) {
          navbar.classList.add("navbar-hidden")
        }
      }

      lastScrollY = scrollY
      rafId = null
    }

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(update)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener("scroll", onScroll)
      const navbar = document.querySelector("[data-navbar]")
      navbar?.classList.remove("navbar-hidden")
    }
  }, [])

  return null
}
