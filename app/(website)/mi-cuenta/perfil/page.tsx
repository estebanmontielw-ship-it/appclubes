"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, CheckCircle2, Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface Club { id: number; nombre: string; logoUrl: string | null; sigla: string | null; ciudad: string }
interface Profile {
  nombre: string; apellido: string; email: string
  avatarUrl: string | null; clubFavorito: string | null; alertasCategorias: string | null
}

const CATEGORIAS = [
  { id: "lnb", label: "Liga Nacional Masculina", sublabel: "LNB" },
  { id: "lnbf", label: "Liga Nacional Femenina", sublabel: "LNBF" },
]

function normalize(s: string) {
  return s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function dedupeClubs(clubs: Club[]): Club[] {
  const seen = new Set<string>()
  const out: Club[] = []
  for (const c of clubs) {
    const key = normalize(c.nombre)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}

export default function PerfilPage() {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [clubes, setClubes] = useState<Club[]>([])
  const [clubFavorito, setClubFavorito] = useState("")
  const [categorias, setCategorias] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/me/preferencias").then(r => r.ok ? r.json() : null),
      fetch("/api/website/clubes").then(r => r.json()),
    ]).then(([pref, clubData]) => {
      if (pref?.profile) {
        const p = pref.profile as Profile
        setProfile(p)
        setClubFavorito(p.clubFavorito || "")
        setAvatarUrl(p.avatarUrl || null)
        try { setCategorias(p.alertasCategorias ? JSON.parse(p.alertasCategorias) : []) } catch { setCategorias([]) }
      }
      setClubes(dedupeClubs(clubData.clubes || []))
    })
  }, [])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("bucket", "avatares")
      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAvatarUrl(data.url)
      toast({ title: "Foto actualizada" })
    } catch {
      toast({ variant: "destructive", title: "Error al subir la foto" })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const toggleCategoria = (id: string) => {
    setCategorias(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/me/preferencias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubFavorito: clubFavorito || null, alertasCategorias: categorias, avatarUrl }),
      })
      if (res.ok) toast({ title: "Perfil guardado" })
      else toast({ variant: "destructive", title: "Error al guardar" })
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setSaving(false)
    }
  }

  const initials = profile ? `${profile.nombre[0]}${profile.apellido[0]}`.toUpperCase() : "?"

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Foto de perfil</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover ring-4 ring-gray-100" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-gray-100">
                <span className="text-2xl font-bold text-primary">{initials}</span>
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div>
            <p className="font-medium text-gray-900">{profile?.nombre} {profile?.apellido}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-primary hover:underline mt-1 font-medium"
            >
              Cambiar foto
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

      {/* Club favorito — visual grid */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-yellow-500" />
          <h2 className="font-semibold text-gray-900">Tu club favorito</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Seleccioná el club que más seguís en la LNB o LNBF</p>

        {clubes.length === 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {clubes.map(club => {
              const selected = clubFavorito === club.nombre
              return (
                <button
                  key={club.id}
                  onClick={() => setClubFavorito(selected ? "" : club.nombre)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all",
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-white"
                  )}
                  title={club.nombre}
                >
                  {club.logoUrl ? (
                    <img src={club.logoUrl} alt={club.nombre} className="h-9 w-9 object-contain" />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-500">{club.sigla ?? club.nombre.slice(0, 3)}</span>
                    </div>
                  )}
                  <span className="text-[10px] font-medium text-gray-600 text-center leading-tight line-clamp-2">
                    {club.sigla ?? club.nombre.split(" ").slice(-1)[0]}
                  </span>
                  {selected && <CheckCircle2 className="h-3 w-3 text-primary" />}
                </button>
              )
            })}
          </div>
        )}

        {clubFavorito && (
          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
            {clubes.find(c => c.nombre === clubFavorito)?.logoUrl && (
              <img src={clubes.find(c => c.nombre === clubFavorito)!.logoUrl!} alt="" className="h-8 w-8 object-contain" />
            )}
            <div>
              <p className="text-xs text-gray-500">Tu club</p>
              <p className="font-semibold text-primary text-sm">{clubFavorito}</p>
            </div>
            <button
              onClick={() => setClubFavorito("")}
              className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Quitar
            </button>
          </div>
        )}
      </div>

      {/* Categorías */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-1">Categorías de interés</h2>
        <p className="text-sm text-gray-500 mb-4">Elegí qué competencias querés seguir</p>
        <div className="space-y-3">
          {CATEGORIAS.map(cat => {
            const active = categorias.includes(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategoria(cat.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                  active ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200 bg-gray-50"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
                  active ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                )}>
                  {cat.sublabel}
                </div>
                <div className="flex-1">
                  <p className={cn("font-semibold text-sm", active ? "text-primary" : "text-gray-700")}>{cat.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Notificaciones de partidos en vivo</p>
                </div>
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  active ? "border-primary bg-primary" : "border-gray-300"
                )}>
                  {active && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Button className="w-full h-11 text-base font-semibold" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar cambios
      </Button>
    </div>
  )
}
