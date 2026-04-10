export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  DESIGNADOR: "DESIGNADOR",
  VERIFICADOR: "VERIFICADOR",
  ARBITRO: "ARBITRO",
  MESA: "MESA",
  ESTADISTICO: "ESTADISTICO",
} as const

export const ROLES_REGISTRABLES = ["ARBITRO", "MESA", "ESTADISTICO"] as const

export const PERMISOS = {
  gestionar_usuarios: ["SUPER_ADMIN"],
  verificar_perfil: ["SUPER_ADMIN"],
  asignar_roles_admin: ["SUPER_ADMIN"],
  crear_curso: ["SUPER_ADMIN", "INSTRUCTOR"],
  editar_curso: ["SUPER_ADMIN", "INSTRUCTOR"],
  habilitar_curso: ["SUPER_ADMIN"],
  ver_inscripciones: ["SUPER_ADMIN", "INSTRUCTOR"],
  confirmar_pago: ["SUPER_ADMIN"],
  revisar_examenes: ["SUPER_ADMIN", "INSTRUCTOR"],
  cargar_recurso: ["SUPER_ADMIN"],
  designar_partido: ["SUPER_ADMIN", "DESIGNADOR"],
  crear_partido: ["SUPER_ADMIN", "DESIGNADOR"],
  ver_finanzas: ["SUPER_ADMIN"],
  gestionar_aranceles: ["SUPER_ADMIN"],
  marcar_honorario_pagado: ["SUPER_ADMIN"],
} as const

export const ROL_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  INSTRUCTOR: "Instructor",
  DESIGNADOR: "Designador",
  VERIFICADOR: "Verificador",
  ARBITRO: "Árbitro",
  MESA: "Oficial de Mesa",
  ESTADISTICO: "Estadístico",
}

export const CATEGORIA_LABELS: Record<string, string> = {
  PRIMERA_DIVISION: "LNB",
  FEMENINO:         "LNB Femenino",
  SEGUNDA_DIVISION: "Segunda División",
  U22:      "U22",
  U18:      "U18",
  U16:      "U16",
  U14:      "U14",
  ESPECIAL: "Especial",
}

export const ROL_PARTIDO_LABELS: Record<string, string> = {
  ARBITRO_PRINCIPAL:   "Árbitro Principal",
  ARBITRO_ASISTENTE_1: "Árbitro Asistente 1",
  ARBITRO_ASISTENTE_2: "Árbitro Asistente 2",
  MESA_ANOTADOR:       "Apuntador",
  MESA_CRONOMETRADOR:  "Cronómetro",
  MESA_OPERADOR_24S:   "Lanzamiento 24s",
  MESA_ASISTENTE:      "Relator",
  ESTADISTICO:         "Estadístico",
}

export const CIUDADES_PY = [
  "Asunción",
  "Ciudad del Este",
  "San Lorenzo",
  "Luque",
  "Capiatá",
  "Lambaré",
  "Fernando de la Mora",
  "Limpio",
  "Ñemby",
  "Mariano Roque Alonso",
  "Pedro Juan Caballero",
  "Encarnación",
  "Caaguazú",
  "Coronel Oviedo",
  "Itauguá",
  "Villarrica",
  "Concepción",
  "Pilar",
  "Areguá",
  "Villa Elisa",
  "San Antonio",
  "Caacupé",
  "Ypacaraí",
  "Paraguarí",
  "Otra",
] as const
