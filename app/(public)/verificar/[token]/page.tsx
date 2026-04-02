import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { ROL_LABELS } from "@/lib/constants"

const CT_ROL_LABELS: Record<string, string> = {
  ENTRENADOR_NACIONAL: "Entrenador Nacional",
  ENTRENADOR_EXTRANJERO: "Entrenador Extranjero",
  ASISTENTE: "Asistente",
  PREPARADOR_FISICO: "Preparador Físico",
  FISIO: "Fisioterapeuta",
  UTILERO: "Utilero",
}

export default async function VerificarPage({
  params,
}: {
  params: { token: string }
}) {
  // Check oficiales first
  const usuario = await prisma.usuario.findUnique({
    where: { qrToken: params.token },
    include: { roles: true },
  })

  // Check cuerpo técnico
  const ct = !usuario ? await prisma.cuerpoTecnico.findUnique({
    where: { qrToken: params.token },
  }) : null

  if (!usuario && !ct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm border text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h1 className="text-lg font-medium mb-2">QR inválido</h1>
          <p className="text-sm text-muted-foreground">
            Este código QR no corresponde a ningún miembro registrado.
          </p>
        </div>
      </div>
    )
  }

  // Cuerpo Técnico
  if (ct) {
    const isHabilitado = ct.estadoHabilitacion === "HABILITADO"

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm border">
          <div className="text-center mb-6">
            <img src="/favicon-cpb.png" alt="CPB" className="h-14 w-14 object-contain mx-auto mb-3" />
            <h1 className="text-lg font-medium">Verificación — Cuerpo Técnico CPB</h1>
            <p className="text-xs text-muted-foreground mt-1">Confederación Paraguaya de Básquetbol</p>
          </div>

          {isHabilitado ? (
            <>
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-lg mb-5">
                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-medium text-sm">Habilitado</span>
              </div>

              {ct.fotoCarnetUrl && (
                <div className="flex justify-center mb-4">
                  <img src={ct.fotoCarnetUrl} alt="Foto" className="w-24 h-24 rounded-full object-cover border-2 border-green-200" />
                </div>
              )}

              <p className="text-center font-semibold text-lg">{ct.nombre} {ct.apellido}</p>
              <p className="text-center text-muted-foreground text-sm">CI: {ct.cedula}</p>

              <div className="flex gap-2 justify-center mt-3">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                  {CT_ROL_LABELS[ct.rol] || ct.rol}
                </Badge>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-3">{ct.ciudad}, Paraguay</p>

              {ct.verificadoEn && (
                <p className="text-center text-muted-foreground text-xs mt-4">
                  Habilitado el {new Date(ct.verificadoEn).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2.5 rounded-lg mb-4 justify-center">
                <span className="font-medium text-sm">{ct.estadoHabilitacion}</span>
              </div>
              <p className="text-sm text-muted-foreground">Este miembro no está habilitado actualmente.</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-[10px] text-muted-foreground">Cuerpo Técnico CPB — cpb.com.py</p>
          </div>
        </div>
      </div>
    )
  }

  // Oficiales
  const isVerified = usuario!.estadoVerificacion === "VERIFICADO"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm border">
        <div className="text-center mb-6">
          <img src="/favicon-cpb.png" alt="CPB" className="h-14 w-14 object-contain mx-auto mb-3" />
          <h1 className="text-lg font-medium">Verificación de Oficial CPB</h1>
          <p className="text-xs text-muted-foreground mt-1">Confederación Paraguaya de Básquetbol</p>
        </div>

        {isVerified ? (
          <>
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-lg mb-5">
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-medium text-sm">Oficial Verificado</span>
            </div>

            {usuario!.fotoCarnetUrl && (
              <div className="flex justify-center mb-4">
                <img src={usuario!.fotoCarnetUrl} alt="Foto" className="w-24 h-24 rounded-full object-cover border-2 border-green-200" />
              </div>
            )}

            <p className="text-center font-semibold text-lg">{usuario!.nombre} {usuario!.apellido}</p>
            <p className="text-center text-muted-foreground text-sm">CI: {usuario!.cedula}</p>

            <div className="flex gap-2 justify-center mt-3 flex-wrap">
              {usuario!.roles.map((r) => (
                <Badge key={r.id} className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                  {ROL_LABELS[r.rol] || r.rol}
                </Badge>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-3">{usuario!.ciudad}, Paraguay</p>

            {usuario!.verificadoEn && (
              <p className="text-center text-muted-foreground text-xs mt-4">
                Verificado el {new Date(usuario!.verificadoEn).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg mb-4 justify-center">
              <span className="font-medium text-sm">No verificado</span>
            </div>
            <p className="text-sm text-muted-foreground">Este oficial no está verificado actualmente.</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-[10px] text-muted-foreground">CPB Oficiales — cpb.com.py</p>
        </div>
      </div>
    </div>
  )
}
