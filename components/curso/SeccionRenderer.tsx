"use client"

import SeccionContenido from "./SeccionContenido"
import SeccionTrucoMemoria from "./SeccionTrucoMemoria"
import SeccionCasoPractico from "./SeccionCasoPractico"
import SeccionTarjetasExpandibles from "./SeccionTarjetasExpandibles"
import SeccionMiniQuiz from "./SeccionMiniQuiz"
import SeccionTablaResumen from "./SeccionTablaResumen"

interface Seccion {
  id: string
  titulo: string
  contenido: string
  tipo: string
  orden: number
  metadata: string | null
}

interface Props {
  seccion: Seccion
}

export default function SeccionRenderer({ seccion }: Props) {
  switch (seccion.tipo) {
    case "TRUCO_MEMORIA":
      return <SeccionTrucoMemoria titulo={seccion.titulo} contenido={seccion.contenido} />
    case "CASO_PRACTICO":
      return <SeccionCasoPractico titulo={seccion.titulo} contenido={seccion.contenido} />
    case "TARJETAS_EXPANDIBLES":
      return <SeccionTarjetasExpandibles titulo={seccion.titulo} contenido={seccion.contenido} metadata={seccion.metadata || undefined} />
    case "MINI_QUIZ":
      return <SeccionMiniQuiz titulo={seccion.titulo} contenido={seccion.contenido} metadata={seccion.metadata || undefined} />
    case "TABLA_RESUMEN":
      return <SeccionTablaResumen titulo={seccion.titulo} contenido={seccion.contenido} metadata={seccion.metadata || undefined} />
    case "CONTENIDO":
    default:
      return <SeccionContenido titulo={seccion.titulo} contenido={seccion.contenido} />
  }
}
