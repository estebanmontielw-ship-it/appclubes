"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Loader2, Maximize2 } from "lucide-react"
import Link from "next/link"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function AdminChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    setInput("")
    const newMessages: Message[] = [...messages, { role: "user", content: text }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const { response } = await res.json()
      setMessages([...newMessages, { role: "assistant", content: response }])
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Error de conexión." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Float button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-300/30 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
          title="CPB Bot"
        >
          <Bot className="h-5 w-5" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: "500px" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-white" />
              <div>
                <p className="text-white font-semibold text-sm">CPB Bot</p>
                <p className="text-violet-200 text-[10px]">Asistente IA</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/oficiales/admin/asistente" className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10" title="Abrir panel completo">
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button onClick={() => setOpen(false)} className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-8 w-8 text-violet-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">¿En qué te puedo ayudar?</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 px-3 py-2.5 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Preguntale algo..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !input.trim()}
                className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center disabled:opacity-50">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
