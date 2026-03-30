import type { Usuario, UsuarioRol, TipoRol } from "@prisma/client"

export type UsuarioConRoles = Usuario & {
  roles: UsuarioRol[]
}

export type RegistroStep = 1 | 2 | 3

export interface RegistroFormData {
  // Step 1
  nombre: string
  apellido: string
  cedula: string
  fechaNacimiento: string
  telefono: string
  ciudad: string
  email: string
  password: string
  confirmPassword: string
  // Step 2
  roles: TipoRol[]
  // Step 3
  fotoCedula: File | null
  fotoCarnet: File | null
  confirmaDatos: boolean
}
