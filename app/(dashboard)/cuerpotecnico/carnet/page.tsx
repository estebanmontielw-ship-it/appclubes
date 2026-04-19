"use client"

import { useState, useEffect } from "react"
import { CreditCard, User, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

const rolLabels: Record<string, string> = {
  ENTRENADOR_NACIONAL: "Entrenador Nacional",
  ENTRENADOR_EXTRANJERO: "Entrenador Extranjero",
  ASISTENTE: "Asistente",
  PREPARADOR_FISICO: "Preparador Físico",
  FISIO: "Fisioterapeuta",
  UTILERO: "Utilero",
  NUTRICIONISTA: "Nutricionista",
}

export default function CTCarnetPage() {
  const [ct, setCt] = useState<any>(null)
  const [walletLoading, setWalletLoading] = useState(false)

  useEffect(() => {
    fetch("/api/ct/me").then(r => r.json()).then(data => setCt(data.ct)).catch(() => {})
  }, [])

  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent)

  const handleAddToWallet = async () => {
    setWalletLoading(true)
    try {
      const { openWalletPass } = await import("@/lib/wallet-download")
      await openWalletPass("/api/ct/carnet/wallet/ios")
    } catch {
      // silent — Share dialog cancel also throws
    } finally {
      setWalletLoading(false)
    }
  }

  if (!ct) return <div className="py-12 text-center text-gray-400">Cargando...</div>

  if (ct.estadoHabilitacion !== "HABILITADO") {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="font-bold text-lg text-gray-900">Carnet no disponible</h2>
        <p className="text-sm text-gray-500 mt-2">Tu carnet digital estará disponible una vez que tu habilitación sea aprobada.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Carnet Digital</h1>

      <div className="bg-gradient-to-br from-[#0a1628] to-[#132043] rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-red-600 via-white to-blue-600 h-2" />
        <div className="p-5 text-center">
          <img src="/favicon-cpb.png" alt="CPB" className="h-12 w-12 mx-auto mb-2" />
          <p className="text-white font-bold text-xs tracking-widest">CONFEDERACIÓN PARAGUAYA DE BÁSQUETBOL</p>
          <p className="text-blue-300 text-[10px] tracking-wider mt-0.5">CUERPO TÉCNICO — HABILITACIÓN {new Date().getFullYear()}</p>
        </div>
        <div className="px-5 pb-5 flex gap-4">
          {ct.fotoCarnetUrl ? (
            <img src={ct.fotoCarnetUrl} alt="" className="w-24 h-28 rounded-xl object-cover border-2 border-white/20 shrink-0" />
          ) : (
            <div className="w-24 h-28 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <User className="h-8 w-8 text-white/30" />
            </div>
          )}
          <div className="text-white flex-1 min-w-0">
            <p className="font-bold text-lg leading-tight">{ct.nombre}</p>
            <p className="font-bold text-lg leading-tight">{ct.apellido}</p>
            <p className="text-blue-300 text-xs mt-2">{rolLabels[ct.rol] || ct.rol}</p>
            <p className="text-white/60 text-xs mt-1">CI: {ct.cedula}</p>
            <p className="text-white/60 text-xs">{ct.ciudad}</p>
          </div>
        </div>
        <div className="bg-white/5 px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/40">ESTADO</p>
            <p className="text-green-400 text-xs font-bold">HABILITADO</p>
          </div>
          {ct.qrToken && (
            <div className="bg-white rounded-lg p-1">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://cpb.com.py/verificar/${ct.qrToken}`)}`} alt="QR" className="w-16 h-16" />
            </div>
          )}
        </div>
      </div>

      {isIOS && (
        <Button
          onClick={handleAddToWallet}
          disabled={walletLoading}
          className="w-full mt-4 bg-black hover:bg-zinc-900 text-white"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {walletLoading ? "Abriendo Wallet..." : "Agregar a Apple Wallet"}
        </Button>
      )}

      <p className="text-xs text-gray-400 text-center mt-4">Mostrá este carnet digital para verificar tu habilitación</p>
    </div>
  )
}
