"use client"

import { useEffect } from "react"

export default function CuratorFeed() {
  useEffect(() => {
    const script = document.createElement("script")
    script.async = true
    script.charset = "UTF-8"
    script.src = "https://cdn.curator.io/published/7d577115-2af2-45ac-b52b-3b583d452e4e.js"
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return (
    <div id="curator-feed-default-feed-layout">
      <a
        href="https://curator.io"
        target="_blank"
        rel="noopener noreferrer"
        className="crt-logo crt-tag"
      >
        Powered by Curator.io
      </a>
    </div>
  )
}
