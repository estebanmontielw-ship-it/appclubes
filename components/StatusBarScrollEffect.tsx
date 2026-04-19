"use client"

import { useEffect } from "react"

/**
 * Hace que el padding-top del body (safe-area-inset-top) desaparezca
 * suavemente cuando el usuario scrollea hacia abajo, dándole más
 * espacio al contenido. Vuelve al tope cuando scrollea arriba.
 */
export default function StatusBarScrollEffect() {
  useEffect(() => {
    const body = document.body
    let rafId: number | null = null

    const update = () => {
      const scrollY = window.scrollY
      const atBottom = scrollY + window.innerHeight >= document.documentElement.scrollHeight - 20

      if (scrollY > 20) body.classList.add("scrolled-past-top")
      else body.classList.remove("scrolled-past-top")

      if (!atBottom && scrollY > 20) body.classList.add("scrolled-past-bottom")
      else body.classList.remove("scrolled-past-bottom")

      rafId = null
    }

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(update)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener("scroll", onScroll)
      body.classList.remove("scrolled-past-top")
      body.classList.remove("scrolled-past-bottom")
    }
  }, [])

  return null
}
