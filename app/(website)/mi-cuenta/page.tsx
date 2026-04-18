"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, LogOut, Star, Bell, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const CATEGORIAS = [
  { id: "lnb", label: "Liga Nacional Masculina (LNB)" },
  { id: "lnbf", label: "Liga Nacional Femenina (LNBF)" },
  { id: "u22m", label: "Sub-22 Masculino" },
  { id: "u22f", label: "Sub-22 Femenino" },
]

interface Club { id: number; nombre: string }
interface Profile {
  nombre: string
  apellido: string
  email: string
  clubFavorito: string | null
  alertasCategorias: string | null
}

export default function MiCuentaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [clubes, setClubes] = useState<Club[]>([])
  const [clubFavorito, setClubFavorito] = useState("")
  const [categorias, setCategorias] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      Promise.all([
        fetch("/api/me/preferencias").then(r => r.json()),
        fetch("/api/website/clubes").then(r => r.json()),
      ]).then(([pref, clubData]) => {
        if (pref.profile) {
          setProfile(pref.profile)
          setClubFavorito(pref.profile.clubFavorito || "")
          try {
            setCategorias(pref.profile.alertasCategorias ? JSON.parse(pref.profile.alertasCategorias) : [])
          } catch { setCategorias([]) }
        }
        setClubes(clubData.clubes || [])
        setLoading(false)
      })
    })
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/me/preferencias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubFavorito: clubFavorito || null, alertasCategorias: categorias }),
      })
      if (res.ok) {
        toast({ title: "Preferencias guardadas" })
      } else {
        toast({ variant: "destructive", title: "Error al guardar" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const toggleCategoria = (id: string) => {
    setCategorias(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) return null

  const initials = `${profile.nombre[0]}${profile.apellido[0]}`.toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-primary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{profile.nombre} {profile.apellido}</h1>
            <p className="text-sm text-gray-500 truncate">{profile.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
              <User className="h-3 w-3" /> Aficionado
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
            <LogOut className="h-5 w-5 text-gray-400" />
          </Button>
        </div>

        {/* Club favorito */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="font-semibold text-gray-900">Tu club favorito</h2>
          </div>
          <Select value={clubFavorito || "__none__"} onValueChange={v => setClubFavorito(v === "__none__" ? "" : v)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Seleccioná un club" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin seleccionar</SelectItem>
              {clubes.map(c => (
                <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categorías */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Categorías de interés</h2>
          </div>
          <p className="text-sm text-gray-500 -mt-2">Recibí notificaciones sobre los partidos que seguís</p>
          <div className="space-y-3">
            {CATEGORIAS.map(cat => (
              <div key={cat.id} className="flex items-center gap-3">
                <Checkbox id={`pref-${cat.id}`} checked={categorias.includes(cat.id)} onCheckedChange={() => toggleCategoria(cat.id)} />
                <label htmlFor={`pref-${cat.id}`} className="text-sm text-gray-700 cursor-pointer">{cat.label}</label>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full h-11 text-base font-semibold" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>

        <button
          onClick={handleLogout}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
