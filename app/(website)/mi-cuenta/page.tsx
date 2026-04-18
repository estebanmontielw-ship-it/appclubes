"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Star, Bell, User, ChevronRight, BellOff } from "lucide-react"

interface Profile {
  nombre: string
  apellido: string
  email: string
  avatarUrl: string | null
  clubFavorito: string | null
  alertasCategorias: string | null
}

interface Club { id: number; nombre: string; logoUrl: string | null; sigla: string | null }

const CATEG_LABELS: Record<string, string> = {
  lnb: "Liga Nacional Masculina",
  lnbf: "Liga Nacional Femenina",
  u22m: "Sub-22 Masculino",
  u22f: "Sub-22 Femenino",
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [clubes, setClubes] = useState<Club[]>([])
  const [pushGranted, setPushGranted] = useState(false)

  useEffect(() => {
    fetch("/api/me/preferencias").then(r => r.ok ? r.json() : null).then(d => d?.profile && setProfile(d.profile))
    fetch("/api/website/clubes").then(r => r.json()).then(d => setClubes(d.clubes || []))
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushGranted(Notification.permission === "granted")
    }
  }, [])

  const categorias = (() => {
    try { return profile?.alertasCategorias ? JSON.parse(profile.alertasCategorias) as string[] : [] }
    catch { return [] }
  })()

  const clubData = clubes.find(c => c.nombre === profile?.clubFavorito)

  const initials = profile ? `${profile.nombre[0]}${profile.apellido[0]}`.toUpperCase() : "?"

  return (
    <div className="space-y-4">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-[#0a1628] to-[#1a3a6e] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="h-14 w-14 rounded-full object-cover ring-2 ring-white/30" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-xl font-bold">{initials}</span>
            </div>
          )}
          <div>
            <p className="text-white/70 text-sm">Bienvenido de vuelta</p>
            <h1 className="text-xl font-bold">{profile ? `${profile.nombre} ${profile.apellido}` : "..."}</h1>
            <p className="text-white/60 text-xs mt-0.5">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Quick cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Club favorito */}
        <Link href="/mi-cuenta/perfil" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-primary/30 transition-colors group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-yellow-500">
              <Star className="h-4 w-4" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Club favorito</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
          </div>
          {clubData?.logoUrl ? (
            <div className="flex items-center gap-3">
              <img src={clubData.logoUrl} alt={clubData.nombre} className="h-10 w-10 object-contain" />
              <span className="font-semibold text-gray-900 text-sm leading-tight">{clubData.nombre}</span>
            </div>
          ) : profile?.clubFavorito ? (
            <p className="font-semibold text-gray-900">{profile.clubFavorito}</p>
          ) : (
            <p className="text-sm text-gray-400">Sin seleccionar</p>
          )}
        </Link>

        {/* Categorías */}
        <Link href="/mi-cuenta/perfil" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-primary/30 transition-colors group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-blue-500">
              <Bell className="h-4 w-4" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categorías</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
          </div>
          {categorias.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {categorias.map((c: string) => (
                <span key={c} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {CATEG_LABELS[c] ?? c}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin categorías</p>
          )}
        </Link>

        {/* Notificaciones */}
        <Link href="/mi-cuenta/notificaciones" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-primary/30 transition-colors group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-green-500">
              {pushGranted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4 text-gray-400" />}
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notificaciones</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
          </div>
          {pushGranted ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-gray-700">Activadas</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-400">No activadas</span>
            </div>
          )}
        </Link>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        <Link href="/mi-cuenta/perfil" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Mi perfil</p>
            <p className="text-xs text-gray-500">Foto, club favorito y preferencias</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary" />
        </Link>
        <Link href="/mi-cuenta/notificaciones" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group">
          <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <Bell className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Configurar notificaciones</p>
            <p className="text-xs text-gray-500">Elegí qué partidos y competencias te interesan</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary" />
        </Link>
      </div>
    </div>
  )
}
