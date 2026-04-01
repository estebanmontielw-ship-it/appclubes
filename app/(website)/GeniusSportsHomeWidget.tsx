"use client"

import { useEffect, useRef } from "react"

export default function GeniusSportsHomeWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(window as any).spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L = {}

    const script = document.createElement("script")
    script.async = true
    script.src = "https://widget.wh.geniussports.com/widget/?LILUXVQFU4GM9DOWMOJH6D75T3Y33L"
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
      delete (window as any).spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L
    }
  }, [])

  return (
    <div
      id="spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L"
      ref={containerRef}
      className="min-h-[200px]"
    />
  )
}
