"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Bot, User, Trash2, Sparkles, Plus, MessageSquare, Paperclip, X, File as FileIcon } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  archivos?: { name: string; url: string; type: string }[]
}

interface Conversation {
  id: string
  titulo: string
  updatedAt: string
  mensajes?: { contenido: string; createdAt: string }[]
}

const quickActions = [
  "Dame un resumen completo del estado de la CPB",
  "¿Qué tareas tengo pendientes?",
  "Redactame una noticia sobre el inicio de la temporada 2026",
  "¿Cuántos oficiales están pendientes de verificación?",
  "Generame un comunicado oficial sobre inscripciones abiertas",
  "¿Qué me recomendás priorizar esta semana?",
]

export default function AsistentePage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [files, setFiles] = useState<{ name: string; url: string; type: string; file?: File }[]>([])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load conversations
  useEffect(() => {
    fetch("/api/ai/assistant/conversations")
      .then(r => r.json())
      .then(data => setConversations(data.conversaciones ?? []))
      .finally(() => setLoadingConvs(false))
  }, [])

  // Load conversation messages
  async function loadConversation(id: string) {
    setActiveConvId(id)
    const res = await fetch(`/api/ai/assistant/conversations/${id}`)
    const { conversacion } = await res.json()
    if (conversacion?.mensajes) {
      setMessages(conversacion.mensajes.map((m: any) => ({
        role: m.role,
        content: m.contenido,
        archivos: m.archivos ? JSON.parse(m.archivos) : undefined,
      })))
    }
  }

  async function newConversation() {
    setActiveConvId(null)
    setMessages([])
    setFiles([])
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("¿Eliminar esta conversación?")) return
    await fetch(`/api/ai/assistant/conversations/${id}`, { method: "DELETE" })
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConvId === id) { setActiveConvId(null); setMessages([]) }
  }

  // File upload
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return
    setUploading(true)

    const uploaded: typeof files = []
    for (const file of selectedFiles) {
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("bucket", "website")
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (res.ok) {
          const { url } = await res.json()
          uploaded.push({ name: file.name, url, type: file.type })
        }
      } catch {}
    }

    setFiles(prev => [...prev, ...uploaded])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSend(text?: string) {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput("")
    const currentFiles = [...files]
    setFiles([])

    const newMsg: Message = { role: "user", content: msg, archivos: currentFiles.length ? currentFiles : undefined }
    const newMessages = [...messages, newMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg + (currentFiles.length ? `\n\n[Archivos adjuntos: ${currentFiles.map(f => f.name).join(", ")}]` : ""),
          conversacionId: activeConvId,
          archivos: currentFiles,
        }),
      })

      const { response, conversacionId } = await res.json()

      if (!activeConvId && conversacionId) {
        setActiveConvId(conversacionId)
        setConversations(prev => [{ id: conversacionId, titulo: msg.slice(0, 60), updatedAt: new Date().toISOString() }, ...prev])
      }

      setMessages([...newMessages, { role: "assistant", content: response }])
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Error de conexión." }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 md:-m-6">
      {/* Sidebar - conversations */}
      <div className="hidden md:flex flex-col w-64 bg-gray-50 border-r border-gray-100">
        <div className="p-3 border-b border-gray-100">
          <button onClick={newConversation}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-indigo-700">
            <Plus className="h-4 w-4" /> Nueva conversación
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvs ? (
            <p className="text-xs text-gray-400 text-center py-4">Cargando...</p>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Sin conversaciones</p>
          ) : conversations.map(conv => (
            <button key={conv.id} onClick={() => loadConversation(conv.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors group ${
                activeConvId === conv.id ? "bg-violet-100 text-violet-700" : "hover:bg-gray-100 text-gray-700"
              }`}>
              <MessageSquare className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="flex-1 truncate">{conv.titulo}</span>
              <button onClick={(e) => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
                CPB Bot
                <span className="text-[10px] font-normal bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-1.5 py-0.5 rounded-full">IA</span>
              </h1>
              <p className="text-[11px] text-gray-500">Datos en tiempo real</p>
            </div>
          </div>
          <button onClick={newConversation} className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100" title="Nueva conversación">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-violet-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">¿En qué te puedo ayudar?</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-md">
                Tengo acceso a todos los datos de la CPB. Podés subir archivos también.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {quickActions.map((action, i) => (
                  <button key={i} onClick={() => handleSend(action)}
                    className="text-left px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-colors">
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mt-1">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className="max-w-[80%]">
                  {msg.archivos && msg.archivos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {msg.archivos.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1 text-xs text-gray-600">
                          {f.type?.startsWith("image/") ? (
                            <img src={f.url} alt="" className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <FileIcon className="h-3.5 w-3.5" />
                          )}
                          <span className="truncate max-w-[100px]">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-primary flex items-center justify-center mt-1">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Files preview */}
        {files.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-violet-50 rounded-lg px-2 py-1.5 text-xs text-violet-700">
                {f.type?.startsWith("image/") ? (
                  <img src={f.url} alt="" className="w-6 h-6 rounded object-cover" />
                ) : (
                  <FileIcon className="h-3.5 w-3.5" />
                )}
                <span className="truncate max-w-[120px]">{f.name}</span>
                <button onClick={() => removeFile(i)} className="text-violet-400 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-100">
          <div className="flex items-end gap-2">
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="shrink-0 w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-violet-50 hover:text-violet-600 transition-colors disabled:opacity-50"
              title="Adjuntar archivos">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </button>
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              rows={1} placeholder="Escribí tu consulta..." style={{ fontSize: "16px" }}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-base resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 max-h-32"
              disabled={loading} />
            <button onClick={() => handleSend()} disabled={loading || !input.trim()}
              className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx" onChange={handleFileSelect} className="hidden" />
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">
            Podés adjuntar imágenes, PDFs, Excel y más
          </p>
        </div>
      </div>
    </div>
  )
}
